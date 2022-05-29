const axios = require('axios').default
const axiosCookieJarSupport = require('axios-cookiejar-support').default
const { gql } = require('graphql-tag')
const { CookieJar, Cookie } = require('tough-cookie')
const urlParse = require('url').parse
const crypto = require('crypto')
const express = require('express')
const { GQL_LIST_SCHEMA_TYPE } = require('@core/keystone/schema')
const util = require('util')
const conf = require('@core/config')
const getRandomString = () => crypto.randomBytes(6).hexSlice()
const { ApolloClient, ApolloLink, InMemoryCache } = require('@apollo/client')
const { onError } = require('@apollo/client/link/error')
const { createUploadLink } = require('apollo-upload-client')
const FormData = require('form-data')
const fetch = require('node-fetch')
const http = require('http')
const https = require('https')
const { flattenDeep, fromPairs, toPairs } = require('lodash')
const fs = require('fs')

const DATETIME_RE = /^[0-9]{4}-[01][0-9]-[0123][0-9]T[012][0-9]:[0-5][0-9]:[0-5][0-9][.][0-9]{3}Z$/i
const NUMBER_RE = /^[1-9][0-9]*$/i
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const API_PATH = '/admin/api'
const DEFAULT_TEST_USER_IDENTITY = conf.DEFAULT_TEST_USER_IDENTITY || 'user@example.com'
const DEFAULT_TEST_USER_SECRET = conf.DEFAULT_TEST_USER_SECRET || '1a92b3a07c78'
const DEFAULT_TEST_ADMIN_IDENTITY = conf.DEFAULT_TEST_ADMIN_IDENTITY || 'admin@example.com'
const DEFAULT_TEST_ADMIN_SECRET = conf.DEFAULT_TEST_ADMIN_SECRET || '3a74b3f07978'
const TESTS_LOG_FAKE_CLIENT_RESPONSE_ERRORS = conf.TESTS_FAKE_CLIENT_MODE && conf.TESTS_LOG_FAKE_CLIENT_RESPONSE_ERRORS
const TESTS_LOG_REAL_CLIENT_RESPONSE_ERRORS = !conf.TESTS_FAKE_CLIENT_MODE && conf.TESTS_LOG_REAL_CLIENT_RESPONSE_ERRORS
const TESTS_REAL_CLIENT_REMOTE_API_URL = conf.TESTS_REAL_CLIENT_REMOTE_API_URL || `http://127.0.0.1:3000${API_PATH}`
const { SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION } = require('@condo/domains/user/gql.js')

class UploadingFile {
    constructor (filePath) {
        this.stream = fs.createReadStream(filePath)
    }
}

const SIGNIN_BY_EMAIL_MUTATION = gql`
    mutation sigin($identity: String, $secret: String) {
        auth: authenticateUserWithPassword(email: $identity, password: $secret) {
            user: item {
                id
            }
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
let __expressServer = null
let __keystone = null
let __isAwaiting = false

function setFakeClientMode (entryPoint, { excludeApps } = {}) {
    if (__expressApp !== null) return
    if (__isAwaiting) return
    const module = (typeof entryPoint === 'string') ? require(entryPoint) : entryPoint
    let mode = null
    if (module.hasOwnProperty('keystone') && module.hasOwnProperty('apps')) {
        mode = 'keystone'
        beforeAll(async () => {
            const res = await prepareKeystoneExpressApp(entryPoint)
            __expressApp = res.app
            __keystone = res.keystone
            __expressServer = http.createServer(__expressApp).listen(0)
        }, 10000)
        afterAll(async () => {
            if (__expressServer) __expressServer.close()
            if (__keystone) await __keystone.disconnect()
            __keystone = null
            __expressApp = null
            __expressServer = null
        }, 10000)
    }
    if (!mode) throw new Error('setFakeServerOption(entryPoint) unknown module type')
    jest.setTimeout(30000)
    __isAwaiting = true
}

const prepareKeystoneExpressApp = async (entryPoint, { excludeApps } = {}) => {
    const dev = process.env.NODE_ENV === 'development'
    const {
        distDir,
        keystone,
        apps,
        configureExpress,
    } = (typeof entryPoint === 'string') ? require(entryPoint) : entryPoint
    const newApps = (excludeApps) ? apps.filter(x => !excludeApps.includes(x.constructor.name)) : apps
    if (excludeApps && dev) console.info(`prepareKeystoneExpressApp() with excluded apps:`, excludeApps, `apps:`, newApps.map(x => x.constructor.name))
    const { middlewares } = await keystone.prepare({ apps: newApps, distDir, dev })
    await keystone.connect()
    const app = express()
    if (configureExpress) configureExpress(app)
    app.use(middlewares)
    return { keystone, app }
}

const prepareNextExpressApp = async (dir) => {
    const next = require('next')
    const dev = process.env.NODE_ENV === 'development'
    const nextApp = next({ dir, dev })
    await nextApp.prepare()
    const app = nextApp.getRequestHandler()
    return { app }
}

/**
 * @param {function} callable
 * @param {Object} params
 * @returns {Promise<Object>}
 */
async function doGqlRequest (callable, { mutation, query, variables }, logResponseErrors) {
    try {
        const { errors, data } = await callable({
            mutation, query, variables,
            // About error policies see https://www.apollographql.com/docs/react/v2/data/error-handling/#error-policies
            errorPolicy: 'all',
            fetchPolicy: 'no-cache',
        })
        if (logResponseErrors && errors) {
            console.warn(`[GraphQL error]: errors=${JSON.stringify(errors)}; data=${JSON.stringify(data)};`)
        }
        return { errors, data }
    } catch (e) {
        // NOTE(pahaz): to understand whats going on here look at https://www.apollographql.com/docs/react/data/error-handling
        //     In a few words: in case of response status code != 200 the ApolloClient throw and an exception and there is
        //     NO RIGHT WAY TO GET ORIGINAL SERVER RESPONSE FROM APOLLO CLIENT in case of != 200 response.
        //     Code below is just a hack: We try to return the original error response to use it in our tests!
        const errors = []

        if (e.graphQLErrors && e.graphQLErrors.length > 0) {
            if (logResponseErrors) {
                e.graphQLErrors.forEach((gqlError) => {
                    console.warn(`[GraphQL error]: ${(e.operation) ? e.operation.operationName : '??'} ${JSON.stringify(gqlError)}}`)
                })
            }

            e.graphQLErrors.map((graphQLError) => {
                errors.push(graphQLError)
            })
        }

        if (e.networkError) {
            if (logResponseErrors) {
                console.warn(`[Network error]: ${JSON.stringify(e.networkError)}`)
            }

            // NOTE(pahaz): apollo client group by their custom logic %) we need to split errors related to Network errors (fetch errors)
            if (typeof e.networkError.statusCode !== 'number' || e.networkError.type === 'system') throw e.networkError
            if (e.networkError.result && e.networkError.result.errors) {
                e.networkError.result.errors.forEach((err) => errors.push(err))
            }
        }

        return { errors }
    }
}

/**
 * @param {string} serverUrl
 * @param {boolean} logResponseErrors
 * @returns {{client: ApolloClient, getCookie: () => string, setHeaders: ({object}) => void}}
 */
const makeApolloClient = (serverUrl, logResponseErrors = true) => {
    let cookiesObj = {}
    let customHeaders = {}

    /**
     * @returns {string}
     */
    const restoreCookies = () => {
        return Object.entries(cookiesObj).map(([key, value]) => `${key}=${value}`).join(';')
    }

    /**
     * @param {string[]} cookiesToSave
     */
    const saveCookies = (cookiesToSave) => {
        cookiesObj = {
            ...cookiesObj,
            ...cookiesToSave.reduce((shapedCookies, cookieString) => {
                const [rawCookie, ...flags] = cookieString.split('; ')
                const [cookieName, value] = rawCookie.split('=')
                return { ...shapedCookies, [cookieName]: value }
            }, {}),
        }
    }

    const apolloLinks = []
    // Terminating link must be in the end of links chain
    apolloLinks.push(createUploadLink({
        uri: `${serverUrl}${API_PATH}`,
        credentials: 'include',
        headers: {
            'content-type': 'application/json',
            accept: 'application/json',
            cache: 'no-cache',
            mode: 'cors',
            credentials: 'include',
        },
        includeExtensions: true,
        isExtractableFile: (value) => {
            return value instanceof UploadingFile
        },
        FormData,
        formDataAppendFile: (form, name, file) => {
            form.append(name, file.stream)
        },
        useGETForQueries: true,
        fetch: (uri, options) => {
            options.headers = { ...options.headers, ...customHeaders }
            if (cookiesObj && Object.keys(cookiesObj).length > 0) {
                options.headers = { ...options.headers, cookie: restoreCookies() }
            }

            return fetch(uri, options)
                .then((response) => {
                    const setCookieHeader = response.headers.raw()['set-cookie']
                    if (setCookieHeader) {
                        // accumulate cookies received from the server
                        saveCookies(setCookieHeader)
                    }
                    return response
                })
        },
    }))

    const client = new ApolloClient({
        uri: serverUrl,
        cache: new InMemoryCache({
            addTypename: false,
        }),
        link: ApolloLink.from(apolloLinks),
    })

    return {
        client,
        serverUrl,
        getCookie: () => restoreCookies(),
        setHeaders: (headers) => {
            customHeaders = { ...customHeaders, ...headers }
        },
        mutate: async (mutation, variables = {}) => {
            return doGqlRequest(client.mutate, { mutation, variables }, logResponseErrors)
        },
        query: async (query, variables = {}) => {
            return doGqlRequest(client.query, { query, variables }, logResponseErrors)
        },
    }
}

const makeClient = async () => {
    // Data for real client
    let serverUrl = new URL(TESTS_REAL_CLIENT_REMOTE_API_URL).origin
    let logErrors = TESTS_LOG_REAL_CLIENT_RESPONSE_ERRORS

    if (__expressApp) {
        const port = __expressServer.address().port
        const protocol = __expressApp instanceof https.Server ? 'https' : 'http'

        // Overriding with data for fake client
        serverUrl = protocol + '://127.0.0.1:' + port
        logErrors = TESTS_LOG_FAKE_CLIENT_RESPONSE_ERRORS
    }

    return makeApolloClient(serverUrl, logErrors)
}

const createAxiosClientWithCookie = (options = {}, cookie = '', cookieDomain = '') => {
    const cookies = (cookie) ? cookie.split(';').map(Cookie.parse) : []
    const cookieJar = new CookieJar()
    const domain = (urlParse(cookieDomain).protocol || 'http:') + '//' + urlParse(cookieDomain).host
    cookies.forEach((cookie) => cookieJar.setCookieSync(cookie, domain))
    const client = axios.create({
        withCredentials: true,
        adapter: require('axios/lib/adapters/http'),
        validateStatus: (status) => status >= 200 && status < 500,
        ...options,
    })
    axiosCookieJarSupport(client)
    client.defaults.jar = cookieJar
    client.getCookie = () => toPairs(fromPairs(flattenDeep(Object.values(client.defaults.jar.store.idx).map(x => Object.values(x).map(y => Object.values(y).map(c => `${c.key}=${c.value}`)))).map(x => x.split('=')))).map(([k, v]) => `${k}=${v}`).join(';')
    return client
}

const makeLoggedInClient = async (args) => {
    if (!args) {
        args = {
            email: DEFAULT_TEST_USER_IDENTITY,
            password: DEFAULT_TEST_USER_SECRET,
        }
    }
    if (!(args.email || args.phone) && !args.password) throw new Error('no credentials')
    const client = await makeClient()
    if (args.email) {
        const { data, errors } = await client.mutate(SIGNIN_BY_EMAIL_MUTATION, {
            identity: args.email,
            secret: args.password,
        })
        if (errors && errors.length > 0) {
            throw new Error(errors[0].message)
        }
        client.user = {
            email: args.email,
            password: args.password,
            id: data.auth.user.id,
        }
    } else if (args.phone) {
        const { data, errors } = await client.mutate(SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION, {
            phone: args.phone,
            password: args.password,
        })
        if (errors && errors.length > 0) {
            throw new Error(errors[0].message)
        }
        client.user = {
            phone: args.phone,
            password: args.password,
            id: data.obj.item.id,
        }
    } else {
        throw new Error('no credentials')
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

async function waitFor (callback, options = { timeout: 2000, interval: 50 }) {
    const timeout = options.timeout || 2000
    const interval = options.interval || 50
    let savedError = null

    return new Promise((res, rej) => {
        const handler1 = setInterval(async () => {
            try {
                const result = await callback()
                clearInterval(handler1)
                clearTimeout(handler2)
                res(result)
            } catch (e) {
                savedError = e
            }
        }, interval)
        const handler2 = setTimeout(() => {
            clearInterval(handler1)
            clearTimeout(handler2)
            rej(savedError || new Error('waitForTimeout'))
        }, timeout)
    })
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
    waitFor,
    isPostgres, isMongo,
    EmptyApp,
    prepareKeystoneExpressApp,
    prepareNextExpressApp,
    setFakeClientMode,
    createAxiosClientWithCookie,
    makeClient,
    makeLoggedInClient,
    makeLoggedInAdminClient,
    createUser,
    createSchemaObject,
    deleteSchemaObject,
    getSchemaObject,
    gql,
    DEFAULT_TEST_ADMIN_IDENTITY,
    DEFAULT_TEST_ADMIN_SECRET,
    DEFAULT_TEST_USER_IDENTITY,
    DEFAULT_TEST_USER_SECRET,
    getRandomString,
    DATETIME_RE,
    UUID_RE,
    NUMBER_RE,
    UploadingFile,
}
