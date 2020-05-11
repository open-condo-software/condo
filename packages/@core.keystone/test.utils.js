const axios = require('axios').default
const axiosCookieJarSupport = require('axios-cookiejar-support').default
const gql = require('graphql-tag')
const { Cookie, CookieJar } = require('tough-cookie')
const { print } = require('graphql/language/printer')
const crypto = require('crypto')
const express = require('express')
const { GQL_LIST_SCHEMA_TYPE } = require('@core/keystone/schema')

const getRandomString = () => crypto.randomBytes(6).hexSlice()

const URL = 'http://127.0.0.1:3000/admin/api'
const DEFAULT_TEST_USER_IDENTITY = 'user@example.com'
const DEFAULT_TEST_USER_SECRET = '1a92b3a07c78'
const DEFAULT_TEST_ADMIN_IDENTITY = 'admin@example.com'
const DEFAULT_TEST_ADMIN_SECRET = '3a74b3f07978'

const SIGNIN_MUTATION = gql`
    mutation sigin($identity: String, $secret: String) {
        auth: authenticateUserWithPassword(email: $identity, password: $secret) {
            user: item {
                id
            }
        }
    }
`

const GET_MY_USERINFO = gql`
    query getUser {
        user: authenticatedUser {
            id
        }
    }
`

const CREATE_USER_MUTATION = gql`
    mutation createNewUser($data: UserCreateInput) {
        user: createUser(data: $data) {
            id
        }
    }
`

const makeClient = async () => {
    // TODO(pahaz): remove axios! need something else ... may be apollo client
    const cookieJar = new CookieJar()
    const client = axios.create({
        withCredentials: true,
        adapter: require('axios/lib/adapters/http'),
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Cache: 'no-cache',
        },
        validateStatus: (status) => status >= 200 && status < 500,
    })
    axiosCookieJarSupport(client)
    client.defaults.jar = cookieJar

    return {
        mutate: async (query, variables = {}) => {
            if (query.kind !== 'Document') throw new Error('query is not a gql object')
            const response = await client.post(URL, {
                query: print(query),
                variables: JSON.stringify(variables),
            })
            return response.data
        },
        query: async (query, variables = {}) => {
            if (query.kind !== 'Document') throw new Error('query is not a gql object')
            const response = await client.get(URL, {
                params: {
                    query: print(query),
                    variables: JSON.stringify(variables),
                },
            })
            return response.data
        },
    }
}

const makeLoggedInClient = async (args = {}) => {
    const variables = {
        email: DEFAULT_TEST_USER_IDENTITY,
        password: DEFAULT_TEST_USER_SECRET,
        ...args,
    }
    const client = await makeClient()
    const { data, errors } = await client.mutate(SIGNIN_MUTATION, {
        identity: variables.email,
        secret: variables.password,
    })
    if (errors && errors.length > 0) {
        throw new Error(errors[0].message)
    }
    client.user = {
        email: variables.email,
        password: variables.password,
        id: data.auth.user.id,
    }
    return client
}

const makeLoggedInAdminClient = async () => {
    return await makeLoggedInClient({ email: DEFAULT_TEST_ADMIN_IDENTITY, password: DEFAULT_TEST_ADMIN_SECRET })
}

const createUser = async (args = {}) => {
    const client = await makeLoggedInAdminClient()
    const data = {
        name: 'Mr#' + getRandomString(),
        email: 'xx' + getRandomString() + '@example.com',
        password: getRandomString(),
        ...args,
    }
    const result = await client.mutate(CREATE_USER_MUTATION, { data })
    if (result.errors && result.errors.length > 0) {
        throw new Error(result.errors[0].message)
    }
    return { ...data, id: result.data.user.id }
}

const createSchemaObject = async (schemaList, args = {}) => {
    if (schemaList._type !== GQL_LIST_SCHEMA_TYPE) throw new Error(`Wrong type. Expect ${GQL_LIST_SCHEMA_TYPE}`)
    const client = await makeLoggedInAdminClient()
    const data = schemaList._factory(args)

    const mutation = gql`
        mutation createNew${schemaList.name}($data: ${schemaList.name}CreateInput) {
            obj: create${schemaList.name}(data: $data) {
            id
        }
        }
    `
    const result = await client.mutate(mutation, { data })
    if (result.errors && result.errors.length > 0) {
        throw new Error(result.errors[0].message)
    }
    return { ...data, id: result.data.obj.id }
}

const getSchemaObject = async (schemaList, fields, where) => {
    if (schemaList._type !== GQL_LIST_SCHEMA_TYPE) throw new Error(`Wrong type. Expect ${GQL_LIST_SCHEMA_TYPE}`)
    const client = await makeLoggedInAdminClient()

    function fieldsToStr (fields) {
        return '{ ' + fields.map((f) => Array.isArray(f) ? fieldsToStr(f) : f).join(' ') + ' }'
    }

    const query = gql`
        query ${schemaList.name}($where: ${schemaList.name}WhereUniqueInput!) {
        obj: ${schemaList.name}(where: $where) ${fieldsToStr(fields)}
        }
    `
    const result = await client.query(query, { where })
    if (result.errors && result.errors.length > 0) {
        throw new Error(result.errors[0].message)
    }
    return result.data.obj
}

// TODO: remove or use it!
const upTestServer = async (entryPoint) => {
    const { distDir, keystone, apps, configureExpress } = require(entryPoint)
    const dev = process.env.NODE_ENV !== 'production'
    const { middlewares } = await keystone.prepare({ apps, distDir, dev })
    await keystone.connect()
    const app = express()
    configureExpress(app)
    app.use(middlewares)
    return { keystone, app }
}

module.exports = {
    makeClient,
    makeLoggedInClient,
    makeLoggedInAdminClient,
    createUser,
    createSchemaObject,
    getSchemaObject,
    gql,
    DEFAULT_TEST_USER_IDENTITY,
    DEFAULT_TEST_USER_SECRET,
}
