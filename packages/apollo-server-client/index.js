const { ApolloClient, InMemoryCache, ApolloLink } = require('@apollo/client')
const { BatchHttpLink } = require('@apollo/client/link/batch-http')
const { RetryLink } = require('@apollo/client/link/retry')
const { onError }  = require('apollo-link-error')
const { createUploadLink } = require('apollo-upload-client')
const FormData = require('form-data')
const { chunk: splitArray, isFunction } = require('lodash')
const fetch = require('node-fetch')

const { getLogger } = require('@open-condo/keystone/logging')

const { MAX_REQUESTS_IN_BATCH, MAX_MODIFY_OPERATIONS_IN_REQUEST, MAX_RETRIES_ON_NETWORK_ERROR, LOAD_CHUNK_SIZE } = require('./constants')
const { SIGNIN_BY_EMAIL_MUTATION, SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION } = require('./lib/gql')

if (!globalThis.fetch) {
    globalThis.fetch = fetch
}

class UploadingFile {
    constructor ({ stream, filename, mimetype, encoding }) {
        this.stream = stream

        if (filename) {
            this.filename = filename
            // NOTE: Note local file adapter uses this, to determine file mimetype
            this.name = filename
        }
        if (mimetype) {
            this.mimetype = mimetype
        }
        if (encoding) {
            this.encoding = encoding
        }
    }

    createReadStream () {
        return this.stream
    }
}

const normalizeAuthRequisites = (requisites = {}) => {
    const { email, identity, password, secret, phone, token } = requisites
    return Object.fromEntries([
        ['email', email || identity],
        ['password', password || secret],
        ['phone', phone],
        ['token', token],
    ].filter(([, value]) => !!value))
}

class OIDCAuthClient {

    constructor (authToken) {
        this.authToken = authToken
        this.cookieJar = new fetch.Headers()
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
            throw new Error(`OIDC request failed: ${response.status} ${response.statusText}`)
        }
        const newCookies = response.headers.raw()['set-cookie']
        if (newCookies) {
            newCookies.forEach(cookie => {
                const [cookieValue] = cookie.split(';')
                const [name, value] = cookieValue.split('=')
                this.cookieJar.set(name, value)
            })
        }
        return {
            location: response.headers.get('location'),
            debug: await response.text(),
        }
    }

}

class ApolloServerClient {
    #isAuthorized = false
    client
    clientName
    authToken
    userId
    locale
    endpoint
    authRequisites = {}
    logger

    /**
     *
     * @param endpoint - https://condo.d.doma.ai/admin/api
     * @param authRequisites - can be { identity: 'service-user@doma.ai', secret: 'password' } or { phone: '+7911....', password: '' } or { token: 'token' }
     * @param clientName - logger name
     * @param locale - for server side translated texts
     * @param customHeaders - can be { x-target: 'custom-x-target', ... }
     */
    constructor (endpoint, authRequisites = {}, { clientName = 'apollo-server-client', locale = 'ru', customHeaders = {} } = {}) {
        this.clientName = clientName
        this.endpoint = endpoint
        this.locale = locale
        this.customHeaders = customHeaders

        this.authRequisites = normalizeAuthRequisites(authRequisites)
        this.logger = getLogger(clientName)
        this.batchClient = this.createClient([this.errorLink(), this.authLink(), this.retryLink(), this.batchTerminateLink()])
        this.client = this.createClient([this.errorLink(), this.authLink(), this.retryLink(), this.uploadTerminateLink()])
    }

    dvSender () {
        return { dv: 1, sender: { dv: 1, fingerprint: this.clientName } }
    }

    createClient (links) {
        return new ApolloClient({
            link: ApolloLink.from(links),
            cache: new InMemoryCache({ addTypename: false }),
            defaultOptions: {
                watchQuery: {
                    fetchPolicy: 'no-cache',
                },
                query: {
                    fetchPolicy: 'no-cache',
                },
            },
        })
    }

    async signIn () {
        if (Reflect.has(this.authRequisites, 'token')) {
            this.signInByToken(this.authRequisites.token)
            return
        }
        if (Reflect.has(this.authRequisites, 'phone')) {
            await this.signInByPhoneAndPassword()
        } else {
            await this.signInByEmailAndPassword()
        }
    }

    /**
    * @example
    * const client = new ApolloServerClient(`${CONDO_URL}/admin/api`, { phone:'***', password: '***' })
    * await client.signIn()
    * const miniAppClient = await client.signInToMiniApp(`${REGISTRY_URL}/graphql`)
    */
    async signInToMiniApp (apiEndpoint) {
        if (!this.authToken) {
            throw new Error('You need to authorize on condo first')
        }
        const miniAppAuth = new OIDCAuthClient()
        const condoAuth = new OIDCAuthClient(this.authToken)
        const { origin } = new URL(apiEndpoint)
        // Start auth
        const { location: startAuthUrl } = await miniAppAuth.oidcRequest(`${origin}/oidc/auth`)
        // Condo redirects
        const { location: interactUrl } = await condoAuth.oidcRequest(startAuthUrl)
        const { location: interactCompleteUrl } = await condoAuth.oidcRequest(interactUrl)
        const { location: completeAuthUrl } = await condoAuth.oidcRequest(interactCompleteUrl)
        // Complete auth
        await miniAppAuth.oidcRequest(completeAuthUrl)
        const decodedToken = decodeURIComponent(miniAppAuth.cookieJar.get('keystone.sid'))

        const miniAppClient = new ApolloServerClient(apiEndpoint, this.authRequisites)
        miniAppClient.authToken = decodedToken.split('s:')[1]

        return miniAppClient
    }

    signInByToken (token) {
        this.authToken = token
        this.#isAuthorized = true
    }

    async signInByEmailAndPassword () {
        const { email, password } = this.authRequisites
        const { data: { auth: { user, token } } } = await this.client.mutate({
            mutation: SIGNIN_BY_EMAIL_MUTATION,
            variables: {
                identity: email,
                secret: password,
            },
        })
        this.userId = user.id
        this.authToken = token
        this.#isAuthorized = true
    }

    async signInByPhoneAndPassword () {
        const { phone,  password } = this.authRequisites
        const { data: { obj: { item: user, token } } } = await this.client.mutate({
            mutation: SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION,
            variables: { ...this.dvSender(), phone, password },
        })
        this.userId = user.id
        this.authToken = token
        this.#isAuthorized = true
    }

    async executeAuthorizedQuery (queryArgs, opts = { batchClient: false }) {
        if (!this.#isAuthorized) {
            await this.signIn()
        }

        const client = opts.batchClient ? this.batchClient : this.client

        try {
            return await client.query(queryArgs)
        } catch (err) {
            // NOTE: Session expired
            if (err && err.graphQLErrors && err.graphQLErrors.length &&
                err.graphQLErrors.some((gqlErr => gqlErr && gqlErr.name && gqlErr.name === 'AuthenticationError'))) {
                await this.signIn()
                return await client.query(queryArgs)
            } else {
                throw err
            }
        }
    }

    async executeAuthorizedMutation (mutationArgs, opts = { batchClient: false }) {
        if (!this.#isAuthorized) {
            await this.signIn()
        }

        const client = opts.batchClient ? this.batchClient : this.client

        try {
            return await client.mutate(mutationArgs)
        } catch (err) {
            // NOTE: Session expired
            if (err && err.graphQLErrors && err.graphQLErrors.length &&
                err.graphQLErrors.some((gqlErr => gqlErr && gqlErr.name && gqlErr.name === 'AuthenticationError'))) {
                await this.signIn()
                return await client.mutate(mutationArgs)
            } else {
                throw err
            }
        }
    }

    async loadByChunks ({
        modelGql,
        where,
        chunkSize = LOAD_CHUNK_SIZE,
        limit = 100000,
        sortBy = ['id_ASC'],
        chunkProcessor = (chunk) => chunk,
    }) {
        let skip = 0
        let maxIterationsCount = Math.ceil(limit / chunkSize)
        let all = []
        let newChunkLength

        do {
            let newChunk = await this.getModels({ modelGql, where, sortBy, first: chunkSize, skip: skip })
            newChunkLength = newChunk.length

            if (newChunkLength > 0) {
                if (isFunction(chunkProcessor)) {
                    newChunk = chunkProcessor.constructor.name === 'AsyncFunction'
                        ? await chunkProcessor(newChunk)
                        : chunkProcessor(newChunk)
                }

                skip += newChunkLength
                all = all.concat(newChunk)
            }
        } while (--maxIterationsCount > 0 && newChunkLength)

        return all
    }

    /**
     * Counts objs for request
     * @param modelGql
     * @param where
     * @param first
     * @param skip
     * @param sortBy
     * @returns {Promise<*>}
     */
    async getCount ({ modelGql, where, first, skip, sortBy }) {
        const { data: { meta: { count } } } = await this.executeAuthorizedQuery({
            query: modelGql.GET_COUNT_OBJS_QUERY,
            variables: {
                where,
                first,
                skip,
                sortBy,
            },
        })

        return count
    }

    /**
     * Default limit is 100 (on condo side). To load all models - use loadByChunks
     */
    async getModels ({ modelGql, where, first, skip, sortBy }) {
        const { data: { objs } } = await this.executeAuthorizedQuery({
            query: modelGql.GET_ALL_OBJS_QUERY,
            variables: {
                where,
                first,
                skip,
                sortBy,
            },
        })
        return objs
    }

    async getModelsWithCount ({ modelGql, where, first, skip, sortBy }) {
        const { data } = await this.executeAuthorizedQuery({
            query: modelGql.GET_ALL_OBJS_WITH_COUNT_QUERY,
            variables: {
                where,
                first,
                skip,
                sortBy,
            },
        })

        return data
    }

    async updateModel ({ modelGql, id = null, updateInput }) {
        const variables = { data: { ...this.dvSender(), ...updateInput } }

        if (id) variables.id = id

        const { data: { obj: updatedObj, result: updatedResult } } = await this.executeAuthorizedMutation({
            mutation: modelGql.UPDATE_OBJ_MUTATION,
            variables,
        })

        return updatedObj || updatedResult
    }

    async updateModels ({ modelGql, updateInputs = [], isBatch = false, onProgress = () => null }) {
        const chunks = splitArray(updateInputs, MAX_MODIFY_OPERATIONS_IN_REQUEST)
        let result = []
        for (const chunk of chunks) {
            const { data: { objs } } = await this.executeAuthorizedMutation({
                mutation: modelGql.UPDATE_OBJS_MUTATION,
                variables: {
                    data: chunk.map(data => ({ id: data.id, data: { ...this.dvSender(), ...data.data } })),
                },
            }, { batchClient: isBatch })
            await onProgress(objs.length)
            result = result.concat(objs)
        }

        return result
    }

    async createModel ({ modelGql, createInput, isBatch = false }) {
        const { data: { obj } } = await this.executeAuthorizedMutation({
            mutation: modelGql.CREATE_OBJ_MUTATION,
            variables: {
                data: {
                    ...this.dvSender(),
                    ...createInput,
                },
            },
        }, { batchClient: isBatch })
        return obj
    }

    async createModels ({ modelGql, createInputs = [], isBatch = false, onProgress = () => null }) {
        const chunks = splitArray(createInputs, MAX_MODIFY_OPERATIONS_IN_REQUEST)
        let result = []
        for (const chunk of chunks) {
            const { data: { objs } } = await this.executeAuthorizedMutation({
                mutation: modelGql.CREATE_OBJS_MUTATION,
                variables: {
                    data: chunk.map(data => ({ data: { ...this.dvSender(), ...data } })),
                },
            }, { batchClient: isBatch })
            await onProgress(objs.length)
            result = result.concat(objs)
        }
        return result
    }

    errorLink () {
        return onError(({ graphQLErrors, networkError, operation }) => {
            if (graphQLErrors)
                graphQLErrors.map(({ message, path }) =>
                    this.error('GraphQL error', { operation: operation.operationName, message, path }),
                )
            if (networkError) {
                this.error('Network error', { networkError })
            }
        })
    }

    authLink () {
        return new ApolloLink((operation, forward) => {
            operation.setContext({
                headers: {
                    authorization: 'Bearer ' + this.authToken,
                    'accept-language': this.locale,
                    ...this.customHeaders,
                },
                credentials: 'same-origin',
            })
            return forward(operation)
        })
    }

    retryLink () {
        return new RetryLink({
            delay: { initial: 300, max: Infinity, jitter: true },
            attempts: {
                max: MAX_RETRIES_ON_NETWORK_ERROR,
                retryIf: (error, _operation) => {
                    this.info('Retry', { error, _operation })
                    return !!error
                },
            },
        })
    }

    createUploadFile ({ stream, filename, mimetype, encoding }) {
        return new UploadingFile({ stream, filename, mimetype, encoding })
    }

    uploadTerminateLink () {
        return createUploadLink({
            uri: this.endpoint,
            includeExtensions: true,
            isExtractableFile: (value) => {
                return value instanceof UploadingFile
            },
            FormData,
            formDataAppendFile: (form, name, file) => {
                if (file.name) {
                    form.append(name, file.stream, file.name)
                } else {
                    form.append(name, file.stream)
                }
            },
            fetch,
        })
    }

    batchTerminateLink () {
        return new BatchHttpLink({
            uri: this.endpoint,
            batchMax: MAX_REQUESTS_IN_BATCH, // No more than ... operations per batch
            batchInterval: 20,
        })
    }

    error (message, payload = {}) {
        this.logger.error({
            msg: message,
            payload,
        })
    }

    info (message, payload = {}) {
        this.logger.info({
            msg: message,
            payload,
        })
    }
}

module.exports = {
    ApolloServerClient,
}
