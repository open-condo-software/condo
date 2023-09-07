const crypto = require('crypto')
const fs = require('fs')
const http = require('http')
const https = require('https')
const urlLib = require('url')

const { ApolloClient, ApolloLink, InMemoryCache } = require('@apollo/client')
const { createUploadLink } = require('apollo-upload-client')
const axiosLib = require('axios')
const axiosCookieJarSupportLib = require('axios-cookiejar-support')
const debug = require('debug')('@open-condo/keystone/test.utils')
const express = require('express')
const falsey = require('falsey')
const FormData = require('form-data')
const { gql } = require('graphql-tag')
const { flattenDeep, fromPairs, toPairs, get, isFunction, isEmpty, template } = require('lodash')
const fetch = require('node-fetch')
const { CookieJar, Cookie } = require('tough-cookie')

const conf = require('@open-condo/config')
const { getTranslations } = require('@open-condo/locales/loader')

const EXTRA_LOGGING = falsey(get(process, 'env.DISABLE_LOGGING'))

const urlParse = urlLib.parse
const axios = axiosLib.default
const axiosCookieJarSupport = axiosCookieJarSupportLib.default

const getRandomString = () => crypto.randomBytes(6).hexSlice()

const DATETIME_RE = /^[0-9]{4}-[01][0-9]-[0123][0-9]T[012][0-9]:[0-5][0-9]:[0-5][0-9][.][0-9]{3}Z$/i
const NUMBER_RE = /^[1-9][0-9]*$/i
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const API_PATH = '/admin/api'
const DEFAULT_TEST_USER_IDENTITY = conf.DEFAULT_TEST_USER_IDENTITY || 'user@example.com'
const DEFAULT_TEST_USER_SECRET = conf.DEFAULT_TEST_USER_SECRET || '1a92b3a07c78'
const DEFAULT_TEST_ADMIN_IDENTITY = conf.DEFAULT_TEST_ADMIN_IDENTITY || 'admin@example.com'
const DEFAULT_TEST_ADMIN_SECRET = conf.DEFAULT_TEST_ADMIN_SECRET || '3a74b3f07978'
const TESTS_TLS_IGNORE_UNAUTHORIZED = conf.TESTS_TLS_IGNORE_UNAUTHORIZED === 'true'
const TESTS_LOG_REQUEST_RESPONSE = conf.TESTS_LOG_REQUEST_RESPONSE
// TODO(pahaz): remove this old consts! we have TESTS_LOG_REQUEST_RESPONSE
const TESTS_LOG_FAKE_CLIENT_RESPONSE_ERRORS = conf.TESTS_FAKE_CLIENT_MODE && conf.TESTS_LOG_FAKE_CLIENT_RESPONSE_ERRORS
const TESTS_LOG_REAL_CLIENT_RESPONSE_ERRORS = !conf.TESTS_FAKE_CLIENT_MODE && conf.TESTS_LOG_REAL_CLIENT_RESPONSE_ERRORS
const TESTS_REAL_CLIENT_REMOTE_API_URL = conf.TESTS_REAL_CLIENT_REMOTE_API_URL || `${conf.SERVER_URL}${API_PATH}`

const SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION = gql`
    mutation authenticateUserWithPhoneAndPassword ($phone: String!, $password: String!) {
        obj: authenticateUserWithPhoneAndPassword(data: { phone: $phone, password: $password }) {
            item {
                id
            }
        }
    }
`

/**
 * Should be used to pass file uploading to variables of Keystone mutations
 * Pay attention to close stream in case when instance of this class is used more than one time in tests,
 * that examining a function (without mutation call).
 */
class UploadingFile {
    constructor (filePath) {
        this.stream = fs.createReadStream(filePath)
    }

    // Used for testing code, that reads data from this object
    createReadStream () {
        return this.stream
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

let __expressApp = null
let __expressServer = null
let __keystone = null
let __isAwaiting = false

/**
 * Something looks like an ip address. Need to test calls limit from one ip address.
 * @type {string}
 */
let __x_forwarder_for_header

/**
 * @type {Map<string, any>}
 */
const featureFlagsStore = new Map()
const FEATURE_FLAGS_STORE_ALL_KEY = '*'

function setFeatureFlag (id, value) {
    featureFlagsStore.set(id, value)
}

function getFeatureFlag (id) {
    return featureFlagsStore.get(id) || featureFlagsStore.get(FEATURE_FLAGS_STORE_ALL_KEY) || false
}

function setAllFeatureFlags (value) {
    featureFlagsStore.set(FEATURE_FLAGS_STORE_ALL_KEY, value)
}

/**
 * Use before create the client.
 * @param {string} [ip]
 */
function setXForwardedFor (ip = undefined) {
    __x_forwarder_for_header = ip
}

function setFakeClientMode (entryPoint, prepareKeystoneOptions = {}) {
    if (__expressApp !== null) return
    if (__isAwaiting) return
    console.warn('setFakeClientMode(): you changed the test execution mode to FAKE client! Your test will not really make a request to remote server! Use it only for local debugging or .spec.js tests cases')
    const module = (typeof entryPoint === 'string') ? require(entryPoint) : entryPoint
    let mode = null
    if (module.hasOwnProperty('keystone') && module.hasOwnProperty('apps')) {
        mode = 'keystone'
        beforeAll(async () => {
            const res = await prepareKeystoneExpressApp(entryPoint, prepareKeystoneOptions)
            __expressApp = res.app
            __keystone = res.keystone
            // tests express for a fake gql client
            // nosemgrep: problem-based-packs.insecure-transport.js-node.using-http-server.using-http-server
            __expressServer = http.createServer(__expressApp).listen(0)
        })
        afterAll(async () => {
            if (__expressServer) __expressServer.close()
            if (__keystone) await __keystone.disconnect()
            __keystone = null
            __expressApp = null
            __expressServer = null
        })
    }
    if (!mode) throw new Error('setFakeServerOption(entryPoint) unknown module type')
    __isAwaiting = true
}

const prepareKeystoneExpressApp = async (entryPoint, { excludeApps } = {}) => {
    debug('prepareKeystoneExpressApp(%s) excludeApps=%j cwd=%s', entryPoint, excludeApps, process.cwd())
    const dev = process.env.NODE_ENV === 'development'
    const {
        keystone,
        apps,
        configureExpress,
        cors,
        pinoOptions,
    } = (typeof entryPoint === 'string') ? require(entryPoint) : entryPoint
    const newApps = (excludeApps) ? apps.filter(x => !excludeApps.includes(x.constructor.name)) : apps
    const { middlewares } = await keystone.prepare({ apps: newApps, dev, cors, pinoOptions })
    await keystone.connect()

    // not a csrf case: used for test & development scripts purposes
    // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
    const app = express()
    if (configureExpress) configureExpress(app)
    app.use(middlewares)
    return { keystone, app }
}

/**
 * @param {function} callable
 * @param {Object} params
 * @param logRequestResponse
 * @returns {Promise<Object>}
 */
async function doGqlRequest (callable, { mutation, query, variables }, logRequestResponse) {
    try {
        if (logRequestResponse) {
            const text = get(query, 'loc.source.body', get(mutation, 'loc.source.body', 'no query data')).replace(/[\s,]+/g, ' ').trim()
            console.debug(`[GraphQL >>>]: ${text}; variables=${JSON.stringify(variables)}`)
        }
        const { errors, data } = await callable({
            mutation, query, variables,
            // About error policies see https://www.apollographql.com/docs/react/v2/data/error-handling/#error-policies
            errorPolicy: 'all',
            fetchPolicy: 'no-cache',
        })
        if (logRequestResponse && errors) {
            console.warn(`[GraphQL <<<]: errors=${JSON.stringify(errors)}; data=${JSON.stringify(data)};`)
        } else if (logRequestResponse) {
            console.debug(`[GraphQL <<<]: data=${JSON.stringify(data)};`)
        }
        return { errors, data }
    } catch (e) {
        // NOTE(pahaz): to understand whats going on here look at https://www.apollographql.com/docs/react/data/error-handling
        //     In a few words: in case of response status code != 200 the ApolloClient throw and an exception and there is
        //     NO RIGHT WAY TO GET ORIGINAL SERVER RESPONSE FROM APOLLO CLIENT in case of != 200 response.
        //     Code below is just a hack: We try to return the original error response to use it in our tests!
        const errors = []

        if (e.graphQLErrors && e.graphQLErrors.length > 0) {
            if (logRequestResponse) {
                e.graphQLErrors.forEach((gqlError) => {
                    console.warn(`[GraphQL <<<!!]: ${(e.operation) ? e.operation.operationName : '??'} ${JSON.stringify(gqlError)}}`)
                })
            }

            e.graphQLErrors.map((graphQLError) => {
                errors.push(graphQLError)
            })
        }

        if (e.networkError) {
            if (logRequestResponse) {
                console.warn(`[GraphQL <<<!!]: Network error: ${JSON.stringify(e.networkError)}`)
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
 * @param {boolean} logRequestResponse
 * @returns {{client: ApolloClient, getCookie: () => string, setHeaders: ({object}) => void}}
 */
const makeApolloClient = (serverUrl, logRequestResponse = false) => {
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
                const [rawCookie] = cookieString.split('; ')
                const [cookieName, value] = rawCookie.split('=')
                return { ...shapedCookies, [cookieName]: value }
            }, {}),
        }
    }

    // test apollo client with disabled tls
    // nosemgrep: problem-based-packs.insecure-transport.js-node.bypass-tls-verification.bypass-tls-verification
    const httpsAgentWithUnauthorizedTls = new https.Agent({ rejectUnauthorized: false })

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
            ...(__x_forwarder_for_header ? { 'x-forwarded-for': __x_forwarder_for_header } : {}),
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

            if (TESTS_TLS_IGNORE_UNAUTHORIZED) options.agent = httpsAgentWithUnauthorizedTls

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
            return doGqlRequest(client.mutate, { mutation, variables }, logRequestResponse)
        },
        query: async (query, variables = {}) => {
            return doGqlRequest(client.query, { query, variables }, logRequestResponse)
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

    return makeApolloClient(serverUrl, TESTS_LOG_REQUEST_RESPONSE || logErrors)
}

const createAxiosClientWithCookie = (options = {}, cookie = '', cookieDomain = '') => {
    const cookies = (cookie) ? cookie.split(';').map(Cookie.parse) : []
    const cookieJar = new CookieJar()
    const domain = (urlParse(cookieDomain).protocol || 'http:') + '//' + urlParse(cookieDomain).host
    cookies.forEach((cookie) => cookieJar.setCookieSync(cookie, domain))
    // test axios client with disabled tls
    // nosemgrep: problem-based-packs.insecure-transport.js-node.bypass-tls-verification.bypass-tls-verification
    const httpsAgentWithUnauthorizedTls = new https.Agent({ rejectUnauthorized: false })
    if (TESTS_TLS_IGNORE_UNAUTHORIZED) options.httpsAgent = httpsAgentWithUnauthorizedTls
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
        console.warn('Called makeLoggedInClient() without arguments! Try to create a new user and pass their credentials as argument to avoid unexpected test dependencies!')
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

/**
 * Used for async action waiting in tests. Pass in callback and options.
 * Will retry executing callback again and again each $interval ms for $timeout ms.
 * You can also set $delay before trying callback if you sure that async action won't take less.
 * @param callback
 * @param options { timeout: 15000, interval: 150, delay: 0 }
 * @returns {Promise<unknown>}
 */
async function waitFor (callback, options = null) {
    const timeout = get(options, 'timeout', 15000)
    const interval = get(options, 'interval', 150)
    const delay = get(options, 'delay', 0)
    let savedError = null

    if (delay > 0) {
        await new Promise((res) => {
            setTimeout(res, delay + 1)
        })
    }

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
    prepareMiddleware () {
        return express()
    }
}

const isPostgres = () => {
    return conf.DATABASE_URL.startsWith('postgres')
}

const isMongo = () => {
    return conf.DATABASE_URL.startsWith('mongo')
}

/**
 * Implements correct expecting of GraphQLError, thrown by Keystone.
 * Expectation checks inside of `catch` are not covering a case,
 * when no exception is thrown, — test will pass, but should fail.
 * https://stackoverflow.com/questions/48707111/asserting-against-thrown-error-objects-in-jest
 *
 * @example
 * await catchErrorFrom(async () => {
 *     await doSomethingThatShouldThrowAnError()
 * }, (e) => {
 *     // any `expect` checks for catched error
 * })
 *
 *
 * @param {() => Promise<*>} testFunc - Function, expected to throw an error
 * @param {(Error) => void} inspect - Function, that should inspect the error in details
 * @return {Promise<*>}
 */
const catchErrorFrom = async (testFunc, inspect) => {
    if (testFunc.constructor.name !== 'AsyncFunction') throw new Error('catchErrorFrom( testFunc ) testFunc is not an AsyncFunction!')
    if (!isFunction(inspect)) throw new Error('catchErrorFrom( inspect ) inspect is not a function!')
    let thrownError = null
    try {
        await testFunc()
    } catch (e) {
        if (EXTRA_LOGGING) console.warn('catchErrorFrom() caught error:', e)
        thrownError = e
    }
    if (!thrownError) throw new Error(`catchErrorFrom() no caught error for: ${testFunc}`)
    return inspect(thrownError)
}

/**
 * Expects a GraphQLError of type 'AccessDeniedError', thrown by Keystone on access to a specified path.
 * Should be used to examine access to operation of GraphQL utility wrapper for complex paths.
 * If path is skipped, than nor it, neither value won't be checked. This option is useful,
 * when we have unstable errors contents, for example when there are sub-requests that are executed in parallel
 * and we get different errors, depending on which sub-request finishes first.
 * @example
 *
 * test('something, that should throw an error', async () => {
 *     const userClient = await makeClientWithNewRegisteredAndLoggedInUser()
 *     await expectToThrowAccessDeniedError(
 *         async () => await createTestResident(userClient, ...),
 *         'objs',
 *     )
 * })
 *
 * @param {() => Promise<void>} testFunc - Function, expected to throw an error
 * @param {String} path - path
 * @return {Promise<void>}
 */
const expectToThrowAccessDeniedError = async (testFunc, path) => {
    if (!path) throw new Error('path is not specified')

    await catchErrorFrom(testFunc, (caught) => {
        expect(caught).toMatchObject({
            name: 'TestClientResponseError',
            data: { [path]: null },
            errors: [expect.objectContaining({
                'message': 'You do not have access to this resource',
                'name': 'AccessDeniedError',
                'path': [path],
                'locations': [expect.objectContaining({
                    line: expect.anything(),
                    column: expect.anything(),
                })],
                'extensions': {
                    'code': 'INTERNAL_SERVER_ERROR',
                },
            })],
        })
    })
}

const expectToThrowAccessDeniedErrorToObj = async (testFunc) => {
    await expectToThrowAccessDeniedError(testFunc, 'obj')
}

const expectToThrowAccessDeniedErrorToObjects = async (testFunc) => {
    await expectToThrowAccessDeniedError(testFunc, 'objs')
}

const expectToThrowAccessDeniedErrorToResult = async (testFunc) => {
    await expectToThrowAccessDeniedError(testFunc, 'result')
}

/**
 * Expects a GraphQL 'AuthenticationError' Error, thrown by access check if case of UNAUTHENTICATED user access.
 * Should be used to examine access to `getAll` GraphQL utility wrapper, that returns `objs`.
 * @example
 *
 * test('something, that should throw an error', async () => {
 *     const client = await makeClient()
 *     await expectToThrowAuthenticationError(
 *         async () => await Organization.getAll(client),
 *         'obj',
 *     )
 * })
 *
 * @param {() => Promise<void>} testFunc - Function, expected to throw an error
 * @param {String} path - path
 * @return {Promise<void>}
 */
const expectToThrowAuthenticationError = async (testFunc, path) => {
    if (!path) throw new Error('path argument is not specified')
    await catchErrorFrom(testFunc, (caught) => {
        expect(caught).toMatchObject({
            name: 'TestClientResponseError',
            data: { [path]: null },
            errors: [expect.objectContaining({
                'message': 'No or incorrect authentication credentials',
                'name': 'AuthenticationError',
                'path': [path],
                'extensions': {
                    'code': 'UNAUTHENTICATED',
                },
            })],
        })
    })
}

const expectToThrowAuthenticationErrorToObj = async (testFunc) => {
    await expectToThrowAuthenticationError(testFunc, 'obj')
}

const expectToThrowAuthenticationErrorToObjects = async (testFunc) => {
    await expectToThrowAuthenticationError(testFunc, 'objs')
}

const expectToThrowAuthenticationErrorToResult = async (testFunc) => {
    await expectToThrowAuthenticationError(testFunc, 'result')
}

const expectToThrowValidationFailureError = async (testFunc, message, path = 'obj') => {
    if (!message) throw new Error('expectToThrowValidationFailureError(): no message argument')
    await catchErrorFrom(testFunc, (caught) => {
        expect(caught).toMatchObject({
            name: 'TestClientResponseError',
            data: { [path]: null },
            errors: [expect.objectContaining({
                'message': 'You attempted to perform an invalid mutation',
                'name': 'ValidationFailureError',
                'path': [path],
                'locations': [expect.objectContaining({
                    line: expect.anything(),
                    column: expect.anything(),
                })],
                'extensions': {
                    'code': 'INTERNAL_SERVER_ERROR',
                },
            })],
        })

        // TODO(pahaz): you really don't have access to originalError in production! need to change this check!
        expect(caught.errors[0]).toMatchObject({
            originalError: {
                data: {
                    messages: expect.arrayContaining([
                        expect.stringContaining(message),
                    ]),
                },
            },
        })
    })
}

const expectToThrowInternalError = async (testFunc, message, path = 'obj') => {
    if (!message) throw new Error('expectToThrowInternalError(): no message argument')
    await catchErrorFrom(testFunc, (caught) => {
        expect(caught).toMatchObject({
            name: 'TestClientResponseError',
            data: { [path]: null },
            errors: [expect.objectContaining({
                'message': expect.stringContaining(message),
                'name': 'GraphQLError',
                'path': [path],
                'locations': [expect.objectContaining({
                    line: expect.anything(),
                    column: expect.anything(),
                })],
                'extensions': {
                    'code': 'INTERNAL_SERVER_ERROR',
                },
            })],
        })
    })
}

const expectToThrowGQLError = async (testFunc, errorFields, path = 'obj') => {
    if (isEmpty(errorFields) || typeof errorFields !== 'object') throw new Error('expectToThrowGQLError(): wrong errorFields argument')
    if (!errorFields.code || !errorFields.type) throw new Error('expectToThrowGQLError(): errorFields argument: no code or no type')
    let interpolatedMessageForUser
    if (errorFields.messageForUser) {
        const locale = conf.DEFAULT_LOCALE
        const translations = getTranslations(locale)
        const translatedMessage = translations[errorFields.messageForUser]
        interpolatedMessageForUser = template(translatedMessage)(errorFields.messageInterpolation)
        if (!interpolatedMessageForUser) throw new Error(`expectToThrowGQLError(): you need to set ${errorFields.messageForUser} for locale=${locale}`)
    }
    const message = template(errorFields.message)(errorFields.messageInterpolation)
    // NOTE: In case where only type and code provided message should not be checked
    const messageFields = message ? { message } : {}
    // NOTE: In case where is no errorFields.messageForUser interpolatedMessageForUser becomes undefined,
    // so we should not check it
    const messageForUserFields = interpolatedMessageForUser ? { messageForUser: interpolatedMessageForUser } : {}

    await catchErrorFrom(testFunc, (caught) => {
        expect(caught).toMatchObject({
            name: 'TestClientResponseError',
            data: { [path]: null },
            errors: [expect.objectContaining({
                ...messageFields,
                'name': 'GQLError',
                'path': [path],
                'locations': [expect.objectContaining({
                    line: expect.anything(),
                    column: expect.anything(),
                })],
                'extensions': expect.objectContaining({
                    ...errorFields,
                    ...messageForUserFields,
                }),
            })],
        })
    })
}

const expectToThrowGraphQLRequestError = async (testFunc, message) => {
    if (!message) throw new Error('expectToThrowGraphQLRequestError(): no message argument')
    await catchErrorFrom(testFunc, (caught) => {
        expect(caught).toMatchObject({
            name: 'TestClientResponseError',
        })

        const { errors, data } = caught
        expect(data).toBeUndefined()
        expect(errors).toHaveLength(1)
        expect(errors[0].message).toMatch(message)
        // NOTE(pahaz):
        //  ValidationError - The GraphQL operation is not valid against the server's schema.
        //  UserInputError - The GraphQL operation includes an invalid value for a field argument.
        //  SyntaxError - The GraphQL operation string contains a syntax error.
        expect(errors[0].name).toMatch(/(UserInputError|ValidationError|SyntaxError)/)
    })
}

const expectValuesOfCommonFields = (obj, attrs, client) => {
    expect(obj.id).toMatch(UUID_RE)
    expect(obj.dv).toEqual(1)
    expect(obj.sender).toEqual(attrs.sender)
    expect(obj.v).toEqual(1)
    expect(obj.newId).toEqual(null)
    expect(obj.deletedAt).toEqual(null)
    expect(obj.createdBy).toEqual(expect.objectContaining({ id: client.user.id }))
    expect(obj.updatedBy).toEqual(expect.objectContaining({ id: client.user.id }))
    expect(obj.createdAt).toMatch(DATETIME_RE)
    expect(obj.updatedAt).toMatch(DATETIME_RE)
}

/**
 * Returns actual name of database entity, that may be different from specified at Keystone level
 * @param name
 * @returns {*}
 */
const actualDatabaseEntityName = (name) => {
    // The system uses no more than NAMEDATALEN-1 bytes of an identifier; longer names can be written in commands, but they will be truncated.
    // By default, NAMEDATALEN is 64 so the maximum identifier length is 63 bytes.
    // https://www.postgresql.org/docs/13/sql-syntax-lexical.html
    const NAMEDATALEN = 63
    return name.slice(0, NAMEDATALEN)
}


/**
 * Handles maximum characters count of Postgres for naming of database entities while checking violation of a specified unique constraint
 * @param testFunc
 * @param constraintName - full name of constraint as presented in Keystone schema
 * @returns {Promise<void>}
 */
const expectToThrowUniqueConstraintViolationError = async (testFunc, constraintName) => {
    await catchErrorFrom(async () => {
        await testFunc()
    }, ({ errors }) => {
        expect(errors[0].message).toContain(`duplicate key value violates unique constraint "${actualDatabaseEntityName(constraintName)}"`)
    })
}

/**
 * @param testFunc
 * @param {string} path
 * @param {string} field
 * @param {Number} [count]
 * @returns {Promise<void>}
 */
const expectToThrowAccessDeniedToFieldError = async (testFunc, path, field, count = 1) => {
    if (!path) throw new Error('path is not specified')
    if (!field) throw new Error('field is not specified')

    await catchErrorFrom(testFunc, (caught) => {
        expect(caught).toMatchObject({
            name: 'TestClientResponseError',
            data: { [path]: Array(count).fill(null) },
            errors: Array(count).fill(null).map((v, i) => expect.objectContaining({
                'message': 'You do not have access to this resource',
                'name': 'AccessDeniedError',
                'path': [path, i, field],
                'locations': [expect.objectContaining({
                    line: expect.anything(),
                    column: expect.anything(),
                })],
                'extensions': {
                    'code': 'INTERNAL_SERVER_ERROR',
                },
            })),
        })
    })
}

module.exports = {
    waitFor,
    isPostgres, isMongo,
    EmptyApp,
    prepareKeystoneExpressApp,
    setFakeClientMode,
    createAxiosClientWithCookie,
    makeClient,
    makeLoggedInClient,
    makeLoggedInAdminClient,
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
    setXForwardedFor,
    catchErrorFrom,
    expectToThrowAccessDeniedError,
    expectToThrowAccessDeniedErrorToObj,
    expectToThrowAccessDeniedErrorToObjects,
    expectToThrowAccessDeniedErrorToResult,
    expectToThrowAuthenticationError,
    expectToThrowAuthenticationErrorToObj,
    expectToThrowAuthenticationErrorToObjects,
    expectToThrowAuthenticationErrorToResult,
    expectToThrowValidationFailureError,
    expectToThrowInternalError,
    expectToThrowGQLError,
    expectToThrowGraphQLRequestError,
    expectValuesOfCommonFields,
    expectToThrowUniqueConstraintViolationError,
    expectToThrowAccessDeniedToFieldError,
    setFeatureFlag,
    getFeatureFlag,
    setAllFeatureFlags,
}
