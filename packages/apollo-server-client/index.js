const { ApolloClient, InMemoryCache, ApolloLink } = require('@apollo/client')
const { BatchHttpLink } = require('@apollo/client/link/batch-http')
const { createUploadLink } = require('apollo-upload-client')
const { onError }  = require('apollo-link-error')
const { RetryLink } = require('@apollo/client/link/retry')
const { getLogger } = require('@open-condo/keystone/logging')
const fetch = require('cross-fetch/polyfill').fetch
const { chunk: splitArray } = require('lodash')

const { MAX_REQUESTS_IN_BATCH, MAX_MODIFY_OPERATIONS_IN_REQUEST, MAX_RETRIES_ON_NETWORK_ERROR, LOAD_CHUNK_SIZE } = require('./constants')
const { SIGNIN_BY_EMAIL_MUTATION, SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION } = require('./lib/gql')

class ApolloServerClient {

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
     * @param authRequisites - can be { identity: 'service-user@doma.ai', secret: 'password' } or { phone: '+7911....', password: '' }
     * @param clientName - logger name
     * @param locale - for server side translated texts
     */
    constructor (endpoint, authRequisites = {}, { clientName = 'apollo-server-client', locale = 'ru' } = {}) {
        this.clientName = clientName
        this.endpoint = endpoint
        this.authRequisites = authRequisites
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
        if (Reflect.has(this.authRequisites, 'phone')) {
            await this.singInByPhoneAndPassword()
        } else {
            await this.singInByEmailAndPassword()
        }
    }

    async singInByEmailAndPassword () {
        const { identity, secret } = this.authRequisites
        const { data: { auth: { user, token } } } = await this.client.mutate({
            mutation: SIGNIN_BY_EMAIL_MUTATION,
            variables: { identity, secret },
        })
        this.userId = user.id
        this.authToken = token
    }

    async singInByPhoneAndPassword () {
        const { phone,  password } = this.authRequisites
        const { data: { obj: { item: user, token } } } = await this.client.mutate({
            mutation: SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION,
            variables: { ...this.dvSender(), phone, password },
        })
        this.userId = user.id
        this.authToken = token
    }

    async loadByChunks ({ modelGql, where, chunkSize = LOAD_CHUNK_SIZE, limit = 100000, sortBy = ['id_ASC'] }) {
        let skip = 0
        let maxIterationsCount = Math.ceil(limit / chunkSize)
        let newChunk = []
        let all = []
        do {
            newChunk = await this.getModels({ modelGql, where, sortBy, first: chunkSize, skip: skip })
            all = all.concat(newChunk)
            skip += newChunk.length
        } while (--maxIterationsCount > 0 && newChunk.length)
        return all
    }

    /**
     * Default limit is 100 (on condo side). To load all models - use loadByChunks
     */
    async getModels ({ modelGql, where, first, skip, sortBy }) {
        const { data: { objs } } = await this.client.query({
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

    async updateModel ({ modelGql, id, updateInput }) {
        const { data: { obj: updatedObj } } = await this.client.mutate({
            mutation: modelGql.UPDATE_OBJ_MUTATION,
            variables: {
                id,
                data: {
                    ...this.dvSender(),
                    ...updateInput,
                },
            },
        })
        return updatedObj
    }

    async updateModels ({ modelGql, updateInputs = [], isBatch = false, onProgress = () => null }) {
        const client = isBatch ? this.batchClient : this.client
        const chunks = splitArray(updateInputs, MAX_MODIFY_OPERATIONS_IN_REQUEST)
        let result = []
        for (const chunk of chunks) {
            const { data: { objs } } = await client.mutate({
                mutation: modelGql.UPDATE_OBJS_MUTATION,
                variables: {
                    data: chunk.map( data => ({ id: data.id, data: { ...this.dvSender(), ...data.data } })),
                },
            })
            await onProgress(objs.length)
            result = result.concat(objs)
        }

        return result
    }

    async createModel ({ modelGql, createInput, isBatch = false }) {
        const client = isBatch ? this.batchClient : this.client
        const { data: { obj } } = await client.mutate({
            mutation: modelGql.CREATE_OBJ_MUTATION,
            variables: {
                data: {
                    ...this.dvSender(),
                    ...createInput,
                },
            },
        })
        return obj
    }

    async createModels ({ modelGql, createInputs = [], isBatch = false, onProgress = () => null }) {
        const client = isBatch ? this.batchClient : this.client
        const chunks = splitArray(createInputs, MAX_MODIFY_OPERATIONS_IN_REQUEST)
        let result = []
        for (const chunk of chunks) {
            const { data: { objs } } = await client.mutate({
                mutation: modelGql.CREATE_OBJS_MUTATION,
                variables: {
                    data: chunk.map( data => ({ data: { ...this.dvSender(), ...data } })),
                },
            })
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
                },
            })
            return forward(operation)
        })
    }

    retryLink () {
        return new RetryLink({
            delay: { initial: 300, max: Infinity, jitter: true },
            attempts: {
                max: MAX_RETRIES_ON_NETWORK_ERROR,
                retryIf: (error, _operation) => !!error,
            },
        })
    }

    uploadTerminateLink () {
        return createUploadLink({ uri: this.endpoint, fetch })
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