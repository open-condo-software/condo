const { spawnSync } = require('child_process')
const crypto = require('crypto')
const fs = require('fs')
const http = require('http')
const https = require('https')
const os = require('os')
const path = require('path')
const urlLib = require('url')

const { ApolloClient, ApolloLink, InMemoryCache } = require('@apollo/client')
const { faker } = require('@faker-js/faker')
const { createUploadLink } = require('apollo-upload-client')
const axiosLib = require('axios')
const axiosCookieJarSupportLib = require('axios-cookiejar-support')
const express = require('express')
const FormData = require('form-data')
const { gql } = require('graphql-tag')
const { flattenDeep, fromPairs, toPairs, get, isFunction, isEmpty, template, pick, set, isArray } = require('lodash')
const fetch = require('node-fetch')
const { CookieJar, Cookie } = require('tough-cookie')
const { throwIfError } = require('@open-condo/codegen/generate.test.utils')
const conf = require('@open-condo/config')
const { getTranslations } = require('@open-condo/locales/loader')

const { GQLErrorCode, GQLInternalErrorTypes } = require('./errors')
const { prepareKeystoneExpressApp } = require('./prepareKeystoneApp')

const urlParse = urlLib.parse
const axios = axiosLib.default
const axiosCookieJarSupport = axiosCookieJarSupportLib.default

const getRandomString = (length = 16) => crypto.randomBytes(Math.ceil(length / 2)).toString('hex')

const DATETIME_RE = /^[0-9]{4}-[01][0-9]-[0123][0-9]T[012][0-9]:[0-5][0-9]:[0-5][0-9][.][0-9]{3}Z$/i
const NUMBER_RE = /^[1-9][0-9]*$/i
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const API_PATH = '/admin/api'
const DEFAULT_TEST_USER_IDENTITY = conf.DEFAULT_TEST_USER_IDENTITY
const DEFAULT_TEST_USER_SECRET = conf.DEFAULT_TEST_USER_SECRET
const DEFAULT_TEST_ADMIN_IDENTITY = conf.DEFAULT_TEST_ADMIN_IDENTITY
const DEFAULT_TEST_ADMIN_SECRET = conf.DEFAULT_TEST_ADMIN_SECRET
const TESTS_TLS_IGNORE_UNAUTHORIZED = conf.TESTS_TLS_IGNORE_UNAUTHORIZED === 'true'
const TESTS_LOG_REQUEST_RESPONSE = conf.TESTS_LOG_REQUEST_RESPONSE === 'true'

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
 * @deprecated - use await getUploadingFile instead
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

/**
 * Returns correct file format based on environment
 * @param {string} filePath - absolute path to the upload file on the local disk
 * @param {Object} fileMeta - file meta, that should be attached to FileRecord
 * @param {Object} user - result of 'createTestUser'
 * @returns {Promise<UploadingFile>}
 */
async function getUploadingFile (filePath, fileMeta, user) {
    const fileSecret = conf['FILE_SECRET']
    const fileClient = conf['FILE_CLIENT_ID']
    const fileServiceUrl = (conf['FILE_SERVICE_URL'] || conf['SERVER_URL']) + '/api/files/upload'

    // NOTE: Old way to upload file. Keep that for backward compatibility
    if (!fileSecret || !fileClient) {
        return new UploadingFile(filePath)
    }

    const form = new FormData()
    form.append('file', fs.readFileSync(filePath), path.basename(filePath))
    form.append('meta', JSON.stringify(fileMeta))

    const response = await fetch(fileServiceUrl, {
        method: 'POST',
        body: form,
        headers: { Cookie: user.getCookie() },
    })
    const json = await response.json()

    return json.data.files[0]
}

const SIGNIN_BY_EMAIL_MUTATION = gql`
    mutation signin($identity: String, $secret: String) {
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
 * @type {Map<string, any>}
 */
const featureFlagsStore = new Map()
const FEATURE_FLAGS_STORE_ALL_KEY = '*'

/**
 * Sets the feature flag value and returns the previous one
 * @param {string} id
 * @param value
 * @returns {*}
 */
function setFeatureFlag (id, value) {
    const prev = featureFlagsStore.get(id)
    featureFlagsStore.set(id, value)

    return prev
}

/**
 * @param context The keystone context
 * @param {string} id
 * @returns {*}
 */
function getFeatureFlag (context, id) {
    // We pass featureFlagsStore via headers in the case when worker & condo are in different Node.js processes
    const featureFlagsStoreFromReqHeaders = new Map(JSON.parse(get(context, ['req', 'headers', 'feature-flags'], '[]')))
    return featureFlagsStore.get(id)
        || featureFlagsStore.get(FEATURE_FLAGS_STORE_ALL_KEY)
        || featureFlagsStoreFromReqHeaders.get(id)
        || featureFlagsStoreFromReqHeaders.get(FEATURE_FLAGS_STORE_ALL_KEY)
        || false
}

/**
 * @param value
 */
function setAllFeatureFlags (value) {
    featureFlagsStore.set(FEATURE_FLAGS_STORE_ALL_KEY, value)
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
            const res = await prepareKeystoneExpressApp(entryPoint, { excludeApps: ['NextApp', 'AdminUIApp'], ...prepareKeystoneOptions })
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

let __expressTestServers = {}

/**
 * Initializes provided express server on a free port. Returns an address of the server. Removes server after finishing tests
 * Use ONLY inside jest test files!
 * @param {string} name
 * @param {Express} app
 * @param {string} protocol like http, ssh, rdp, https. Used only in address
 * @param {number} port – defaults to 0 (random open port) – this is *preferred* way of using this utility
 * @param {boolean} useDanglingMode - if true then:
 *   - If server is already launched (port in use), do nothing
 *   - Server won't be closed after tests (will close when jest process dies)
 *   If false (default):
 *   - If server is already launched, throws error
 *   - Server will be closed after tests
 */
function initTestExpressApp (name, app, protocol = 'http', port = 0, { useDanglingMode = false } = {}) {
    if (!name) {
        throw new Error('initTestExpressApp(name, app) no name!')
    }

    if (!app) {
        throw new Error('initTestExpressApp(name, app) no app!')
    }

    if (useDanglingMode && (!port || port === 0)) {
        throw new Error('Dangling mode should only be used when port is specified')
    }

    beforeAll(async () => {
        __expressTestServers[name] = {
            server: null,
            address: null,
            port: null,
            baseUrl: null,
        }

        // Create server with self-signed certificate for HTTPS in tests
        let server
        if (protocol === 'https') {
            // Generate self-signed certificates on the fly using OpenSSL
            // This avoids external Node.js dependencies while creating proper X.509 certs
            
            // Create temporary files for key and cert
            const tmpDir = os.tmpdir()
            const randomSuffix = crypto.randomBytes(8).toString('hex')
            const keyPath = path.join(tmpDir, `test-ssl-${Date.now()}-${randomSuffix}.key`)
            const certPath = path.join(tmpDir, `test-ssl-${Date.now()}-${randomSuffix}.pem`)
            
            try {
                // Generate self-signed certificate using OpenSSL (available on most systems)
                // Using spawnSync instead of execSync to avoid spawning a shell (more secure)
                // OpenSSL is a system utility with a stable location across environments
                // nosemgrep: javascript.lang.security.audit.dangerous-spawn.dangerous-spawn, javascript.lang.security.audit.child-process-shell.child-process-shell
                const result = spawnSync('openssl', [ // NOSONAR this is a test utility
                    'req',
                    '-x509',
                    '-newkey', 'rsa:2048',
                    '-nodes',
                    '-keyout', keyPath,
                    '-out', certPath,
                    '-days', '1',
                    '-subj', '/CN=localhost',
                ], { stdio: 'pipe' })

                if (result.error || result.status !== 0) {
                    throw new Error(result.error?.message || result.stderr?.toString() || 'OpenSSL command failed')
                }
            } catch (error) {
                throw new Error(
                    `Failed to generate SSL certificates. OpenSSL is required.\n` +
                    `Error: ${error.message}\n\n` +
                    `Install OpenSSL or use protocol='http' for tests that don't require HTTPS`
                )
            }

            // For test purposes, we use self-signed certs generated on the fly
            // This is safe because it's only used in test environments with localhost servers
            // In production, proper certificates should be used
            // nosemgrep: problem-based-packs.insecure-transport.js-node.disallow-old-tls-versions2.disallow-old-tls-versions2
            const httpsOptions = {
                key: fs.readFileSync(keyPath),
                cert: fs.readFileSync(certPath),
            }

            // Clean up temporary certificate files after reading them
            try {
                fs.unlinkSync(keyPath)
                fs.unlinkSync(certPath)
            } catch (err) {
                // Ignore cleanup errors
            }

            // Used only inside of jest files
            // nosemgrep: problem-based-packs.insecure-transport.js-node.using-http-server.using-http-server
            server = https.createServer(httpsOptions, app)
        } else {
            // Used only inside of jest files
            // nosemgrep: problem-based-packs.insecure-transport.js-node.using-http-server.using-http-server
            server = http.createServer(app)
        }

        try {
            await new Promise((resolve, reject) => {
                const listenInstance = server.listen(port)

                listenInstance.on('listening', () => {
                    const addressInfo = listenInstance.address()
                    __expressTestServers[name] = {
                        server: listenInstance,
                        address: addressInfo.address === '::' ? 'localhost' : addressInfo.address,
                        port: addressInfo.port,
                        baseUrl: `${protocol}://${addressInfo.address === '::' ? 'localhost' : addressInfo.address}:${addressInfo.port}`,
                        isDangling: false,
                    }
                    resolve()
                })

                listenInstance.on('error', (err) => {
                    if (useDanglingMode && err.code === 'EADDRINUSE') {
                        __expressTestServers[name] = {
                            server: null,
                            address: 'localhost',
                            port: port,
                            baseUrl: `${protocol}://'localhost':${port}`,
                            isDangling: true,
                        }
                        resolve()
                    } else {
                        reject(err)
                    }
                })
            })
        } catch (err) {
            if (err.code === 'EADDRINUSE' && !useDanglingMode) {
                throw new Error(`Specified port: ${port} is already in use`)
            }
            throw err
        }
    })

    afterAll(async () => {
        if (__expressTestServers[name] && __expressTestServers[name].server && !useDanglingMode) {
            await new Promise((resolve) => {
                __expressTestServers[name].server.close(resolve)
            })
            delete __expressTestServers[name]
        }
    })
}

/**
 * Returns test express app. Use when you need to get address of the app
 * @param name
 * @returns {*}
 */
function getTestExpressApp (name) {
    return __expressTestServers[name]
}

/**
 * @param {function} callable
 * @param {Object} params
 * @param logRequestResponse
 * @returns {Promise<Object>}
 */
async function doGqlRequest (callable, { mutation, query, variables }, logRequestResponse) {
    let testName = ''
    if (typeof jasmine !== 'undefined') {
        // eslint-disable-next-line
        testName = `[${get(jasmine, ['currentTest', 'fullName'], jasmine['testPath'].split('/').pop().split('.')[0])}]`
    }

    try {
        if (logRequestResponse) {
            const text = get(query, 'loc.source.body', get(mutation, 'loc.source.body', 'no query data')).replace(/[\s,]+/g, ' ').trim()
            console.debug(`[GraphQL >>>]${testName}: ${text}; variables=${JSON.stringify(variables)}`)
        }
        const { errors, data } = await callable({
            mutation, query, variables,
            // About error policies see https://www.apollographql.com/docs/react/v2/data/error-handling/#error-policies
            errorPolicy: 'all',
            fetchPolicy: 'no-cache',
        })
        if (logRequestResponse && errors) {
            console.warn(`[GraphQL <<<]${testName}: errors=${JSON.stringify(errors)}; data=${JSON.stringify(data)};`)
        } else if (logRequestResponse) {
            console.debug(`[GraphQL <<<]${testName}: data=${JSON.stringify(data)};`)
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
                    console.warn(`[GraphQL <<<!!]${testName}: ${(e.operation) ? e.operation.operationName : '??'} ${JSON.stringify(gqlError)}}`)
                })
            }

            e.graphQLErrors.map((graphQLError) => {
                errors.push(graphQLError)
            })
        }

        if (e.networkError) {
            if (logRequestResponse) {
                console.warn(`[GraphQL <<<!!]${testName}: Network error: ${JSON.stringify(e.networkError)}`)
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
 * @param {{customHeaders?: Record<string, string>, logRequestResponse?: boolean}} opts
 * @returns {{client: ApolloClient, getCookie: () => string, setHeaders: ({object}) => void}}
 */
const makeApolloClient = (serverUrl, opts = {}) => {
    let cookiesObj = {}
    let customHeaders = opts.hasOwnProperty('customHeaders') ? opts.customHeaders : {}
    let logRequestResponse = Boolean(opts.logRequestResponse)

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
    // Terminating link must be in the end of links chains
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
            options.headers = {
                ...options.headers,
                'feature-flags': JSON.stringify(Array.from(featureFlagsStore)), ...customHeaders,
            }
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

const makeClient = async (opts = { generateIP: true, serverUrl: undefined }) => {
    // Data for real client
    let serverUrl
    const customHeaders = {}
    if (opts.generateIP) {
        customHeaders['x-forwarded-for'] = faker.internet.ip()
    }

    if (__expressApp) {
        // NOTE(pahaz): it's fake client mode
        const port = __expressServer.address().port
        const protocol = __expressApp instanceof https.Server ? 'https' : 'http'

        // Overriding with data for fake client
        serverUrl = protocol + '://127.0.0.1:' + port
    } else {
        // NOTE(pahaz): it's real client mode
        serverUrl = conf.SERVER_URL
    }

    return makeApolloClient(
        new URL(opts.serverUrl ? opts.serverUrl : serverUrl).origin,
        { logRequestResponse: TESTS_LOG_REQUEST_RESPONSE, customHeaders },
    )
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

const makeLoggedInClient = async (credentials, serverUrl) => {
    if (!credentials) {
        console.warn('Called makeLoggedInClient() without arguments! Try to create a new user and pass their credentials as argument to avoid unexpected test dependencies!')
        credentials = {
            email: DEFAULT_TEST_USER_IDENTITY,
            password: DEFAULT_TEST_USER_SECRET,
        }
    }
    // NOTE: we can't query user type, as not all apps has this field on User.
    //       so let's put STAFF type as it is default user type
    credentials.type = credentials.type || 'staff'
    if (!(credentials.email || credentials.phone) && !credentials.password) throw new Error('no credentials')
    const client = await makeClient({ generateIP: true, serverUrl })
    if (credentials.email) {
        const { data, errors } = await client.mutate(SIGNIN_BY_EMAIL_MUTATION, {
            identity: credentials.email,
            secret: credentials.password,
        })
        if (errors && errors.length > 0) {
            throw new Error(errors[0].message)
        }
        client.user = {
            email: credentials.email,
            password: credentials.password,
            id: data.auth.user.id,
            type: credentials.type,
        }
    } else if (credentials.phone) {
        const { data, errors } = await client.mutate(SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION, {
            phone: credentials.phone,
            password: credentials.password,
        })
        if (errors && errors.length > 0) {
            throw new Error(errors[0].message)
        }
        client.user = {
            phone: credentials.phone,
            password: credentials.password,
            id: data.obj.item.id,
            type: credentials.type,
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
 * Class for OIDC auth client
 * Helps to perform OIDC auth flow
 */
class OIDCAuthClient {

    constructor (authToken) {
        this.authToken = authToken
        this.cookieJar = new Map()
    }

    async oidcRequest (url) {
        const response = await fetch(url, {
            headers: {
                ...this.authToken ? { authorization: `Bearer ${this.authToken}` } : {},
                cookie: [...this.cookieJar.entries()].map(([name, value]) => `${name}=${value}`).join('; '),
            },
            redirect: 'manual',
            credentials: 'same-origin',
        })

        if (response.status >= 400) {
            throw new Error(`OIDC request failed: ${response.status} ${response.statusText} (URL: ${url})`)
        }

        const newCookies = response.headers.raw()['set-cookie']

        if (newCookies) {
            newCookies.forEach(cookie => {
                const cookieValue = cookie.split(';')[0]
                const separatorIndex = cookieValue.indexOf('=')
                if (separatorIndex !== -1) {
                    const name = cookieValue.substring(0, separatorIndex)
                    const value = cookieValue.substring(separatorIndex + 1)
                    this.cookieJar.set(name, value)
                }
            })
        }

        return {
            location: response.headers.get('location'),
            debug: await response.text(),
        }
    }
}

/**
 * Creates the client for mini app with all OIDC flow completed
 * This means that all OIDC endpoints of miniapp were called and session contains all needed fields
 * @note This function not working in TESTS_FAKE_CLIENT_MODE=true because callback url already contains miniapp url (see OidcClient model created during preparing)
 * @param {Object} loggedInCondoClient The logged in condo client
 * @param {object} options The options object
 * @param {string} options.condoOrganizationId Required if user in your tests has 2+ organizations
 * @param {string} options.condoUserId Required if you create this client not from the miniapp you testing
 * @param {string} options.miniAppServerUrl Required if you create this client not from the miniapp you testing
 * @returns {Promise<Object>} Mini app client with all OIDC flow completed
 */
const makeLoggedInMiniAppClient = async (
    loggedInCondoClient,
    { condoOrganizationId = null, condoUserId = null, miniAppServerUrl = null } = {},
) => {
    const authCookie = loggedInCondoClient.getCookie().split(';').find(cookie => cookie.startsWith('keystone.sid='))
    if (!authCookie) {
        throw new Error('keystone.sid cookie not found')
    }
    const miniAppAuth = new OIDCAuthClient()
    const condoAuth = new OIDCAuthClient(decodeURIComponent(authCookie.split('=')[1]).split(':')[1])

    const miniAppClient = await makeClient({ serverUrl: miniAppServerUrl })

    const whoAmIQuery = gql`query auth { authenticatedUser { id name } }`

    //
    // Try to detect oidc parameters (condoOrganizationId and condoUserId).
    // If these parameters not passed in forcedOidcAuthParams, try to get them from condo logged in user
    //
    if (!condoUserId) {
        const { data: condoUserData, errors: condoUserErrors } = await loggedInCondoClient.query(whoAmIQuery)
        throwIfError(condoUserData, condoUserErrors, { query: whoAmIQuery })
        condoUserId = condoUserData.authenticatedUser.id
    }

    if (!condoOrganizationId) {
        // Get all available organizations for logged in user
        const myOrganizationQuery = gql`query allOrganizations { allOrganizations { id name } }`
        const { data: condoOrganizationsData, errors: condoOrganizationsErrors } = await loggedInCondoClient.query(myOrganizationQuery)
        throwIfError(condoOrganizationsData, condoOrganizationsErrors, { query: myOrganizationQuery })
        const organizations = condoOrganizationsData.allOrganizations

        if (organizations.length === 0) throw new Error('No organizations found for logged in user!')
        if (organizations.length > 1) throw new Error('More than one organization found for logged in user! Please use forcedOidcAuthParams to specify organization id')

        condoOrganizationId = organizations[0].id
    }

    //
    // Set parameters for OIDC auth
    //
    const oidcAuthRequestParams = { condoUserId, condoOrganizationId }

    //
    // Build OIDC auth url
    //
    const miniAppUrl = miniAppClient.serverUrl
    const { origin: miniAppUrlOrigin } = new URL(miniAppUrl)
    const oidcAuthUrl = new URL(`${miniAppUrlOrigin}/oidc/auth`)
    Object.keys(oidcAuthRequestParams).forEach((k) => oidcAuthUrl.searchParams.set(k, oidcAuthRequestParams[k]))

    //
    // 3... 2... 1... AUTH!
    //
    // Start auth
    const { location: startAuthUrl } = await miniAppAuth.oidcRequest(oidcAuthUrl.toString())
    // Condo redirects
    const { location: interactUrl } = await condoAuth.oidcRequest(startAuthUrl)
    const { location: interactCompleteUrl } = await condoAuth.oidcRequest(interactUrl)
    const { location: completeAuthUrl } = await condoAuth.oidcRequest(interactCompleteUrl)
    // Complete auth
    await miniAppAuth.oidcRequest(completeAuthUrl)

    //
    // Get auth token from cookie
    //
    const oidcSessionCookie = miniAppAuth.cookieJar.get('keystone.sid')
    if (!oidcSessionCookie) {
        throw new Error('OIDC flow did not set keystone.sid cookie - authentication failed')
    }
    const decodedCookie = decodeURIComponent(oidcSessionCookie)

    const [, token] = decodedCookie.split(':')
    if (!token) {
        throw new Error('Can not extract token from keystone.sid cookie - authentication failed (should be in format "s:<token>")')
    }

    //
    // Set auth token to client
    //
    miniAppClient.setHeaders({
        'Authorization': `Bearer ${token}`,
    })

    //
    // Inject user data to client
    //
    const { data: miniAppUserData, errors: miniAppUserErrors } = await miniAppClient.query(whoAmIQuery)
    throwIfError(miniAppUserData, miniAppUserErrors, { query: whoAmIQuery })
    miniAppClient.user = miniAppUserData.authenticatedUser

    return miniAppClient
}

/**
 * Used for async action waiting in tests. Pass in callback and options.
 * Will retry executing callback again and again each $interval ms for $timeout ms.
 * You can also set $delay before trying callback if you sure that async action won't take less.
 * @param {() => Promise<any>} callback
 * @param {{ timeout:number, interval:number, delay:number }|null} options - default: timeout: 15000, interval: 150, delay: 0
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
 * Expectation checks inside `catch` are not covering a case,
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
 * @param {[({data: *, errors: *}|*),{dv: number, sender: {dv: number, fingerprint: string}}]} testFunc - Function, expected to throw an error
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
        thrownError = e
    }
    if (!thrownError) throw new Error(`catchErrorFrom() no caught error for: ${testFunc}`)
    try {
        return inspect(thrownError)
    } catch (e) {
        // NOTE(pahaz): We will catch the validation error from Jest,
        // and if it occurs, we want to see the stack and use click to file
        // and understand what's happen.
        if (typeof jasmine !== 'undefined') {
            // eslint-disable-next-line
            const testName = `[${get(jasmine, ['currentTest', 'fullName'], jasmine['testPath'].split('/').pop().split('.')[0])}]`
            // nosemgrep: javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
            console.error(`[catchError !!!]${testName}:`, thrownError)
        }
        throw e
    }
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
 * @param {Array<string>} path - path
 * @return {Promise<void>}
 */
const expectToThrowAccessDeniedError = async (testFunc, path) => {
    if (!path) throw new Error('path is not specified')
    if (!isArray(path)) throw new Error('wrong path type: Array<string> expected')
    await catchErrorFrom(testFunc, (caught) => {
        // TODO(pahaz): DOMA-10368 check 'data'
        expect(pick(caught, ['name', 'errors'])).toEqual({
            name: 'TestClientResponseError',
            errors: [expect.objectContaining({
                'message': 'You do not have access to this resource',
                'name': 'AccessDeniedError',
                'path': path,
                'locations': [expect.objectContaining({
                    line: expect.anything(),
                    column: expect.anything(),
                })],
                'extensions': {
                    'code': 'INTERNAL_SERVER_ERROR',
                    'messageForDeveloper': expect.stringMatching(/^You do not have access to this resource/),
                },
            })],
        })
    })
}

const expectToThrowAccessDeniedErrorToObj = async (testFunc) => {
    await expectToThrowAccessDeniedError(testFunc, ['obj'])
}

const expectToThrowAccessDeniedErrorToObjects = async (testFunc) => {
    await expectToThrowAccessDeniedError(testFunc, ['objs'])
}

const expectToThrowAccessDeniedErrorToResult = async (testFunc) => {
    await expectToThrowAccessDeniedError(testFunc, ['result'])
}

const expectToThrowAccessDeniedErrorToCount = async (testFunc) => {
    await expectToThrowAccessDeniedError(testFunc, ['meta', 'count'])
}

/**
 * @param testFunc
 * @param {string} path
 * @param {string} field
 * @param {Number} [count]
 * @returns {Promise<void>}
 */
const expectToThrowAccessDeniedToRelationFieldError = async (testFunc, path, field, count = 1) => {
    if (!path) throw new Error('path is not specified')
    if (!field) throw new Error('field is not specified')

    await catchErrorFrom(testFunc, (caught) => {
        expect(pick(caught, ['name', 'data', 'errors'])).toMatchObject({
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
                    'messageForDeveloper': expect.stringMatching(/^You do not have access to this resource/),
                },
            })),
        })
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
        expect(pick(caught, ['name', 'data', 'errors'])).toMatchObject({
            name: 'TestClientResponseError',
            data: { [path]: Array(count).fill(expect.objectContaining({ [field]: null })) },
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
                    'messageForDeveloper': expect.stringMatching(/^You do not have access to this resource/),
                },
            })),
        })
    })
}

/**
 * @param testFunc
 * @param {string} path
 * @param {string} field
 * @param {Number} [count]
 * @returns {Promise<void>}
 */
const expectToThrowAccessDeniedToManageFieldError = async (testFunc, path, field, count = 1) => {
    if (!path) throw new Error('path is not specified')
    if (!field) throw new Error('field is not specified')

    await catchErrorFrom(testFunc, (caught) => {
        expect(pick(caught, ['name', 'data', 'errors'])).toMatchObject({
            name: 'TestClientResponseError',
            data: { [path]: null },
            errors: Array(count).fill(null).map((v, i) => expect.objectContaining({
                'message': 'You do not have access to this resource',
                'name': 'AccessDeniedError',
                path: [path],
                'locations': [expect.objectContaining({
                    line: expect.anything(),
                    column: expect.anything(),
                })],
                'extensions': {
                    'code': 'INTERNAL_SERVER_ERROR',
                    'messageForDeveloper': expect.stringMatching(/^You do not have access to this resource/),
                },
            })),
        })
    })
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
        expect(pick(caught, ['name', 'data', 'errors'])).toEqual({
            name: 'TestClientResponseError',
            data: { [path]: null },
            errors: [expect.objectContaining({
                'message': 'No or incorrect authentication credentials',
                'name': 'AuthenticationError',
                'path': [path],
                'extensions': {
                    'code': 'UNAUTHENTICATED',
                    'message': 'No or incorrect authentication credentials',
                    'messageForDeveloper': expect.stringMatching(/^No or incorrect authentication credentials/),
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
        expect(pick(caught, ['name', 'data', 'errors'])).toEqual({
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
                    'messageForDeveloper': expect.stringMatching(/^You attempted to perform an invalid mutation/),
                    'message': expect.stringContaining(message),
                },
            })],
        })
    })
}

/**
 *
 * @param testFunc
 * @param message
 * @param {Array<string>} path - path
 * @returns {Promise<void>}
 */
const expectToThrowInternalError = async (testFunc, message, path) => {
    if (!message) throw new Error('expectToThrowInternalError(): no message argument')
    if (!isArray(path)) throw new Error('wrong path type: Array<string> expected')
    const data = {}
    set(data, path, null)
    await catchErrorFrom(testFunc, (caught) => {
        expect(pick(caught, ['name', 'data', 'errors'])).toEqual({
            name: 'TestClientResponseError',
            data,
            errors: [expect.objectContaining({
                'message': expect.stringContaining(message),
                'name': 'GraphQLError',
                path,
                'locations': [expect.objectContaining({
                    line: expect.anything(),
                    column: expect.anything(),
                })],
                'extensions': {
                    'code': 'INTERNAL_SERVER_ERROR',
                    'messageForDeveloper': expect.stringContaining(message),
                },
            })],
        })
    })
}

/**
 * @example
 * @param template {string}
 * @param eol {boolean} use end of line in result regexp
 * @param sol {boolean} use start of line in result regexp
 * @returns {RegExp}
 * @example
 *   const template = "You have to wait {secondsRemaining} seconds";
 *   const str = "You have to wait 10 seconds";
 *   const regex = createRegExByTemplate(template);
 *   console.log(regex.test(str)); // Output: true
 *   const values = str.match(regex).groups;
 *   console.log(values); // Output: { secondsRemaining: '10' }
 */
function createRegExByTemplate (template, { eol = true, sol = true } = {}) {
    let regexString = template.replace(/([.*+?^$()|\][\\])/g, '\\$1') // escape regexp chars
    if (template.includes('{')) {
        // replace template string `{secondsRemaining}` to RegExp
        regexString = regexString.replace(/{(\w+)}/g, '(?<$1>.*?)') // named group
    }
    // Not a ReDoS case. We generate a specific RE
    // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
    return new RegExp((sol ? '^' : '') + regexString + (eol ? '$' : ''))
}

function _getGQLErrorMatcher (errorFields, path, locations, originalErrorMatcher) {
    if (isEmpty(errorFields) || typeof errorFields !== 'object') throw new Error('expectToThrowGQLError(): wrong errorFields argument')
    if (!errorFields.code || !errorFields.type) throw new Error('expectToThrowGQLError(): errorFields argument: no code or no type')
    if (errorFields.messageForUserTemplateKey) throw new Error('expectToThrowGQLError(): you do not really need to use `messageForUserTemplateKey` key! You should pass it as `messageForUser` value! Look like a developer error!')
    if (errorFields.messageForUserTemplate) throw new Error('expectToThrowGQLError(): you do not really need to use `messageForUserTemplate` key! You should pass right `messageForUser` value! Look like a developer error!')
    if (errorFields.messageForUser && !errorFields.messageForUser.startsWith('api.')) {
        // TODO(pahaz): DOMA-10345 strongly check it and throw error!
        console.warn('expectToThrowGQLError(): developer error! `messageForUser` should starts with `api.`')
    }
    if (!errorFields.message) {
        // TODO(pahaz): DOMA-10345 strongly check it!
        console.warn('expectToThrowGQLError(): errorFields message argument is required')
        // throw new Error('expectToThrowGQLError(): errorFields message argument is required')
    }
    const fieldsToCheck = { ...errorFields }
    if (!isEmpty(errorFields.messageInterpolation)) {
        fieldsToCheck['message'] = template(errorFields.message)(errorFields.messageInterpolation)
    }
    if (errorFields.messageForUser) {
        const locale = conf.DEFAULT_LOCALE
        const translations = getTranslations(locale)
        const translatedMessage = translations[errorFields.messageForUser]
        if (!translatedMessage) {
            // TODO(pahaz): DOMA-10345 throw new error!
            console.warn('expectToThrowGQLError! you do not have translation key', errorFields.messageForUser)
        }
        if (errorFields.messageInterpolation) fieldsToCheck['messageForUserTemplate'] = translatedMessage
        const interpolatedMessageForUser = template(translatedMessage)(errorFields.messageInterpolation)
        if (!interpolatedMessageForUser) throw new Error(`expectToThrowGQLError(): you need to set ${errorFields.messageForUser} for locale=${locale}`)
        fieldsToCheck['messageForUser'] = interpolatedMessageForUser
        // TODO(pahaz): check messageForUserTemplateKey
    }

    // NOTE(pahaz): if we have a template `{secondsRemaining}` inside message without messageInterpolation
    //  it means we want to use RegExp for our tests. Check @examples
    if (errorFields?.message?.includes('{')) {
        fieldsToCheck['message'] = expect.stringMatching(createRegExByTemplate(errorFields.message))
    }

    return expect.objectContaining({
        message: expect.anything(),
        name: 'GQLError',
        extensions: expect.objectContaining({ ...fieldsToCheck }),
        ...(path ? { path: [path] } : {}),
        ...(locations ? { locations: [expect.objectContaining({ line: expect.anything(), column: expect.anything() })] } : {}),
        ...(originalErrorMatcher ? { errors: originalErrorMatcher } : {}),
    })
    // TODO(pahaz): check another fields: messageForDeveloper
}

/**
 * Catches GQLError thrown by functions, such as serverUtils
 * @example
 * async function someServerUtil() {
 *     throw new GQLError(...)
 * }
 *
 * await expectToThrowRawGQLError(async () => {
 *     await someServerUtil()
 * }, { ... })
 * @param {() => Promise<void>} testFunc
 * @param {{[key: string]: string}} errorFields
 * @returns {Promise<void>}
 */
async function expectToThrowRawGQLError (testFunc, errorFields, originalErrors) {
    await catchErrorFrom(testFunc, (caught) =>
        expect(caught).toEqual(_getGQLErrorMatcher(errorFields, null, false, originalErrors))
    )
}

/**
 * Catches GQLError thrown by API
 * @example
 * await expectToThrowGQLError(async () => {
 *     await createTestModel(context, data)
 * }, { ... })
 * @param testFunc {() => Promise<void>}
 * @param errorFields {{[key: string]: string}}
 * @param path {string}
 * @returns {Promise<void>}
 */
const expectToThrowGQLError = async (testFunc, errorFields, path = 'obj') => {
    await catchErrorFrom(testFunc, (caught) => {
        expect(pick(caught, ['name', 'data', 'errors'])).toEqual({
            name: 'TestClientResponseError',
            data: { [path]: null },
            errors: [_getGQLErrorMatcher(errorFields, path, true)],
        })
    })
}

const expectToThrowGQLErrorToResult = async (testFunc, errorFields) => {
    return await expectToThrowGQLError(testFunc, errorFields, 'result')
}

const expectToThrowGraphQLRequestError = async (testFunc, message) => {
    if (!message) throw new Error('expectToThrowGraphQLRequestError(): no message argument')
    if (typeof message !== 'string') throw new Error('expectToThrowGraphQLRequestError(): message argument is not a string type')

    await expectToThrowGraphQLRequestErrors(testFunc, [message])
}

const expectToThrowGraphQLRequestErrors = async (testFunc, messages) => {
    if (!messages) throw new Error('expectToThrowGraphQLRequestErrors(): no message argument')
    if (!isArray(messages)) throw new Error('expectToThrowGraphQLRequestErrors(): message argument is not an Array<strings> type')

    // NOTE(pahaz):
    //  ValidationError - The GraphQL operation is not valid against the server's schema.
    //  UserInputError - The GraphQL operation includes an invalid value for a field argument.
    //  SyntaxError - The GraphQL operation string contains a syntax error.
    const matcher = messages.map(message => expect.objectContaining({
        message: expect.stringContaining(message),
        name: expect.stringMatching(/(UserInputError|ValidationError|SyntaxError|GraphQLError)/),
    }))

    await catchErrorFrom(testFunc, (caught) => {
        expect(caught?.name).toEqual('TestClientResponseError')
        const { errors, data } = caught
        expect(data).toBeUndefined()
        expect(errors).toEqual(matcher)
        expect(errors).toHaveLength(messages.length)
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
        // TODO(pahaz): DOMA-10368 we need to use strict checks!
        // expect(errors).toHaveLength(1)
        const error = errors[0]
        if (error.name === 'GQLError' && error.extensions.code === GQLErrorCode.INTERNAL_ERROR && error.extensions.type === GQLInternalErrorTypes.SUB_GQL_ERROR) {
            expect(error.extensions.message).toContain(`duplicate key value violates unique constraint "${actualDatabaseEntityName(constraintName)}"`)
        } else {
            expect(error.message).toContain(`duplicate key value violates unique constraint "${actualDatabaseEntityName(constraintName)}"`)
        }
    })
}

/**
 * Handles violates check constraint errors
 * @param testFunc
 * @param constraintName - full name of constraint as presented in Keystone schema
 * @returns {Promise<void>}
 */
const expectToThrowCheckConstraintViolationError = async (testFunc, constraintName) => {
    await catchErrorFrom(async () => {
        await testFunc()
    }, ({ errors }) => {
        // TODO(pahaz): DOMA-10368 we need to use strict checks!
        // expect(errors).toHaveLength(1)
        const error = errors[0]
        if (error.name === 'GQLError' && error.extensions.code === GQLErrorCode.INTERNAL_ERROR && error.extensions.type === GQLInternalErrorTypes.SUB_GQL_ERROR) {
            expect(error.extensions.message).toContain(`violates check constraint "${actualDatabaseEntityName(constraintName)}"`)
        } else {
            expect(error.message).toContain(`violates check constraint "${actualDatabaseEntityName(constraintName)}"`)
        }
    })
}

/**
 * Handles violates check constraint errors
 * @param testFunc
 * @param constraintName - full name of constraint as presented in Keystone schema
 * @returns {Promise<void>}
 */
const expectToThrowForeignKeyConstraintViolationError = async (testFunc, tableName, constraintName) => {
    await catchErrorFrom(async () => {
        await testFunc()
    }, ({ errors }) => {
        expect(errors).toHaveLength(1)
        const error = errors[0]
        if (error.name === 'GQLError' && error.extensions.code === GQLErrorCode.INTERNAL_ERROR && error.extensions.type === GQLInternalErrorTypes.SUB_GQL_ERROR) {
            expect(error.extensions.message).toContain(`on table "${tableName}" violates foreign key constraint "${actualDatabaseEntityName(constraintName)}"`)
        } else {
            expect(error.message).toContain(`on table "${tableName}" violates foreign key constraint "${actualDatabaseEntityName(constraintName)}"`)
        }
    })
}

module.exports = {
    waitFor,
    isPostgres, isMongo,
    EmptyApp,
    setFakeClientMode,
    createAxiosClientWithCookie,
    makeClient,
    makeLoggedInClient,
    makeLoggedInAdminClient,
    makeLoggedInMiniAppClient,
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
    getUploadingFile,
    catchErrorFrom,
    expectToThrowAccessDeniedError,
    expectToThrowAccessDeniedErrorToObj,
    expectToThrowAccessDeniedErrorToObjects,
    expectToThrowAccessDeniedErrorToResult,
    expectToThrowAccessDeniedErrorToCount,
    expectToThrowAccessDeniedToRelationFieldError,
    expectToThrowAccessDeniedToFieldError,
    expectToThrowAccessDeniedToManageFieldError,
    expectToThrowAuthenticationError,
    expectToThrowAuthenticationErrorToObj,
    expectToThrowAuthenticationErrorToObjects,
    expectToThrowAuthenticationErrorToResult,
    expectToThrowValidationFailureError,
    expectToThrowInternalError,
    expectToThrowGQLError,
    expectToThrowGQLErrorToResult,
    expectToThrowRawGQLError,
    expectToThrowGraphQLRequestError,
    expectToThrowGraphQLRequestErrors,
    expectValuesOfCommonFields,
    expectToThrowUniqueConstraintViolationError,
    expectToThrowCheckConstraintViolationError,
    expectToThrowForeignKeyConstraintViolationError,
    setFeatureFlag,
    getFeatureFlag,
    setAllFeatureFlags,
    initTestExpressApp,
    getTestExpressApp,
}
