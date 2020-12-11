const axios = require('axios').default
const axiosCookieJarSupport = require('axios-cookiejar-support').default
const gql = require('graphql-tag')
const { Cookie, CookieJar } = require('tough-cookie')
const { print } = require('graphql/language/printer')
const crypto = require('crypto')
const express = require('express')
const { GQL_LIST_SCHEMA_TYPE } = require('@core/keystone/schema')
const util = require('util')
const faker = require('faker')
const conf = require('@core/config')

const getRandomString = () => crypto.randomBytes(6).hexSlice()

const DATETIME_RE = /^[0-9]{4}-[01][0-9]-[0123][0-9]T[012][0-9]:[0-5][0-9]:[0-5][0-9][.][0-9]{3}Z$/i
const NUMBER_RE = /^[1-9][0-9]*$/i
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const API_PATH = '/admin/api'
const URL = `http://127.0.0.1:3000${API_PATH}`
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

let __expressApp = null
let __isAwaiting = false

function setFakeClientMode (path) {
    if (__expressApp !== null) return
    if (__isAwaiting) return
    const module = require(path)
    let mode = null
    if (module.hasOwnProperty('URL_PREFIX') && module.hasOwnProperty('prepareBackApp')) {
        mode = 'multi-server'
        beforeAll(async (done) => {
            __expressApp = await module.prepareBackApp()
            done()
        }, 20000)
    } else if (module.hasOwnProperty('keystone') && module.hasOwnProperty('apps')) {
        mode = 'keystone'
        beforeAll(async (done) => {
            const res = await prepareKeystoneExpressApp(path)
            __expressApp = res.app
            done()
        }, 20000)
    }
    if (!mode) throw new Error('setFakeServerOption(path) unknown module type')
    jest.setTimeout(60000)
    __isAwaiting = true
}

const prepareKeystoneExpressApp = async (entryPoint) => {
    const { distDir, keystone, apps, configureExpress } = require(entryPoint)
    const dev = process.env.NODE_ENV !== 'production'
    const { middlewares } = await keystone.prepare({ apps, distDir, dev })
    await keystone.connect()
    const app = express()
    if (configureExpress) configureExpress(app)
    app.use(middlewares)
    return { keystone, app }
}

const prepareNextExpressApp = async (dir) => {
    const next = require('next')
    const dev = process.env.NODE_ENV !== 'production'
    const nextApp = next({ dir, dev })
    await nextApp.prepare()
    const app = nextApp.getRequestHandler()
    return { app }
}

const makeFakeClient = async (app) => {
    const request = require('supertest')
    const client = request(app)
    let cookies = {}

    function extractCookies (cookies) {
        return cookies.reduce((shapedCookies, cookieString) => {
            const [rawCookie, ...flags] = cookieString.split('; ')
            const [cookieName, value] = rawCookie.split('=')
            return { ...shapedCookies, [cookieName]: value }
        }, {})
    }

    function cookiesToString (cookies) {
        return Object.entries(cookies).map(([key, value]) => `${key}=${value}`).join(';')
    }

    return {
        mutate: async (query, variables = {}) => {
            if (query.kind !== 'Document') throw new Error('query is not a gql object')
            return new Promise((resolve, reject) => {
                client.post(API_PATH).set('Cookie', [cookiesToString(cookies)]).send({
                    query: print(query),
                    variables: JSON.stringify(variables),
                }).end(function (err, res) {
                    const setCookies = res.headers['set-cookie']
                    if (setCookies) {
                        cookies = { ...cookies, ...extractCookies(setCookies) }
                    }
                    if (err) {
                        console.error(err)
                        return reject(err)
                    }
                    if (res.body && res.body.errors) {
                        console.warn(util.inspect(res.body.errors, { showHidden: false, depth: null }))
                    }
                    return resolve(res.body)
                })
            })
        },
        query: async (query, variables = {}) => {
            if (query.kind !== 'Document') throw new Error('query is not a gql object')
            return new Promise((resolve, reject) => {
                client.get(API_PATH).set('Cookie', [cookiesToString(cookies)]).query({
                    query: print(query),
                    variables: JSON.stringify(variables),
                }).end(function (err, res) {
                    const setCookies = res.headers['set-cookie']
                    if (setCookies) {
                        cookies = { ...cookies, ...extractCookies(setCookies) }
                    }
                    if (err) {
                        console.error(err)
                        return reject(err)
                    }
                    if (res.body && res.body.errors) {
                        console.warn(util.inspect(res.body.errors, { showHidden: false, depth: null }))
                    }
                    return resolve(res.body)
                })
            })
        },
    }
}

const makeRealClient = async () => {
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

const makeClient = async () => {
    if (__expressApp) {
        return await makeFakeClient(__expressApp)
    }
    return await makeRealClient()
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
        email: 'xx' + getRandomString().toLowerCase() + '@example.com',
        password: getRandomString(),
        ...args,
    }
    const result = await client.mutate(CREATE_USER_MUTATION, { data })
    if (result.errors && result.errors.length > 0) {
        console.warn(util.inspect(result.errors, { showHidden: false, depth: null }))
        throw new Error(result.errors[0].message)
    }
    if (!result.data.user.id) {
        throw new Error('createUser() no ID returned')
    }
    return { ...data, id: result.data.user.id }
}

const createSchemaObject = async (schemaList, args = {}) => {
    if (schemaList._type !== GQL_LIST_SCHEMA_TYPE) throw new Error(`Wrong type. Expect ${GQL_LIST_SCHEMA_TYPE}`)
    const client = await makeLoggedInAdminClient()
    const data = schemaList._factory(args)

    const mutation = gql`
        mutation create${schemaList.name}($data: ${schemaList.name}CreateInput) {
            obj: create${schemaList.name}(data: $data) { id }
        }
    `
    const result = await client.mutate(mutation, { data })
    if (result.errors && result.errors.length > 0) {
        throw new Error(result.errors[0].message)
    }
    return { id: result.data.obj.id, _raw_query_data: data }
}

const deleteSchemaObject = async (schemaList, args = {}) => {
    if (schemaList._type !== GQL_LIST_SCHEMA_TYPE) throw new Error(`Wrong type. Expect ${GQL_LIST_SCHEMA_TYPE}`)
    if (!args.id) throw new Error(`No ID`)

    const client = await makeLoggedInAdminClient()

    const mutation = gql`
        mutation delete${schemaList.name}($id: ID) {
            obj: delete${schemaList.name}(id: $id) { id }
        }
    `
    const result = await client.mutate(mutation, { id: args.id })
    if (result.errors && result.errors.length > 0) {
        throw new Error(result.errors[0].message)
    }
    return { id: result.data.obj.id }
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

const areWeRunningTests = () => {
    return process.env.JEST_WORKER_ID !== undefined
}

class EmptyApp {
    prepareMiddleware ({ keystone, dev, distDir }) {
        return express()
    }
}

const isPostgres = () => {
    return conf.DATABASE_URL.startsWith('postgres')
}

const isMongo = () => {
    return conf.DATABASE_URL.startsWith('mongo')
}

module.exports = {
    isPostgres, isMongo,
    EmptyApp,
    areWeRunningTests,
    prepareKeystoneExpressApp,
    prepareNextExpressApp,
    setFakeClientMode,
    makeClient,
    makeLoggedInClient,
    makeLoggedInAdminClient,
    createUser,
    createSchemaObject,
    deleteSchemaObject,
    getSchemaObject,
    gql,
    DEFAULT_TEST_USER_IDENTITY,
    DEFAULT_TEST_USER_SECRET,
    getRandomString,
    DATETIME_RE,
    UUID_RE,
    NUMBER_RE,
}
