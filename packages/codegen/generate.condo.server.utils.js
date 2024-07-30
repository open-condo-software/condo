const { get, isEmpty, isObject, isArray } = require('lodash')

const conf = require('@open-condo/config')
const { GQLError } = require('@open-condo/keystone/errors')
const { makeRemoteExecutor } = require('@open-condo/keystone/stitchSchema')
const { extractReqLocale } = require('@open-condo/locales/extractReqLocale')


const IS_DEBUG = conf.NODE_ENV === 'development'

const CONDO_API_URL = `${conf.CONDO_DOMAIN}/admin/api`
const DEFAULT_LOCALE = conf.DEFAULT_LOCALE || 'en'
const CONDO_ACCESS_TOKEN_KEY = conf.CONDO_ACCESS_TOKEN_KEY || 'condoAccessToken'
const ACCEPT_LANGUAGE = conf.ACCEPT_LANGUAGE || 'accept-language'
const CONDO_REFRESH_TOKEN_KEY = conf.CONDO_REFRESH_TOKEN_KEY || 'condoRefreshToken'


const client = makeRemoteExecutor(CONDO_API_URL, CONDO_ACCESS_TOKEN_KEY)


function getRequestContext (context) {
    return {
        [CONDO_REFRESH_TOKEN_KEY]: get(context, ['req', 'session', CONDO_REFRESH_TOKEN_KEY], get(context, CONDO_REFRESH_TOKEN_KEY)),
        [CONDO_ACCESS_TOKEN_KEY]: get(context, ['req', 'session', CONDO_ACCESS_TOKEN_KEY], get(context, CONDO_ACCESS_TOKEN_KEY)),
        [ACCEPT_LANGUAGE]: extractReqLocale(context.req) || get(context, ACCEPT_LANGUAGE) || DEFAULT_LOCALE,
    }
}

function _getAllErrorMessages (errors) {
    const messages = []
    for (const x of errors) {
        const m = get(x, 'message')
        if (m) messages.push(m)
    }
    return messages
}

function _throwIfError (context, errors, data, errorMessage, errorMapping, status, statusText) {
    if (errors) {
        if (IS_DEBUG) {
            const errorsToShow = errors.filter(error => get(error, 'originalError.data') || get(error, 'originalError.internalData'))
            if (!isEmpty(errorsToShow)) errorsToShow.forEach((error) => console.warn(get(error, 'originalError.data'), '\n', get(error, 'originalError.internalData')))
            console.error(errors)
        }

        const reason = String(errors.map(error => get(error, 'message')))
        let error = new Error(`${errorMessage}: ${reason}`)

        if (errorMapping && isObject(errorMapping)) {
            const message = _getAllErrorMessages(errors).join(' -- ')
            for (const key in errorMapping) {
                if (message.includes(key)) {
                    error = new GQLError(errorMapping[key], context)
                    break
                }
            }
        }

        // NOTE: we will see this nested result at the ApolloErrorFormatter
        error.errors = errors
        error.reqId = get(context, 'req.id')
        throw error
    }
    if (!data || typeof data !== 'object') {
        throw new Error(`${errorMessage}: wrong query result. (${status} - ${statusText})`)
    }
}

const requestToCondo = async (context, { query, variables, errorMessage = '[error] Internal Exec GQL Error', dataPath = 'obj', errorMapping = null }) => {
    if (!context) throw new Error('missing context argument')
    if (!query) throw new Error('missing query argument')
    if (!variables) throw new Error('missing variables argument')

    const { data, errors, status, statusText } = await client({
        document: query,
        variables,
        context: getRequestContext(context),
    })

    _throwIfError(context, errors, data, errorMessage, errorMapping, status, statusText)
    return (dataPath) ? get(data, dataPath) : data
}

const generateCondoServerUtils = (gql) => {
    if (!gql) throw new Error('no gql')

    async function getAll (context, where, { sortBy, first, skip } = {}) {
        if (!context) throw new Error('no context')
        if (!where) throw new Error('no where')

        return await requestToCondo(context, {
            query: gql.GET_ALL_OBJS_QUERY,
            variables: {
                where, sortBy, first, skip,
            },
            errorMessage: `[error] Unable to query ${gql.PLURAL_FORM}`,
            dataPath: 'objs',
        })
    }

    async function getOne (context, where) {
        if (!context) throw new Error('no context')
        if (!where) throw new Error('no where')

        const objs = await getAll(context, where, { first: 2 })

        if (!isArray(objs)) return undefined

        if (objs.length > 1) {
            throw new Error('getOne() got more than one result, check filters/logic please. The error is raised by a query if only one object is expected, but multiple objects are returned')
        } else if (objs.length < 1) {
            return undefined
        } else {
            return objs[0]
        }
    }

    async function count (context, where, { sortBy, first, skip } = {}) {
        if (!context) throw new Error('no context')
        if (!where) throw new Error('no where')

        return await requestToCondo(context, {
            query: gql.GET_COUNT_OBJS_QUERY,
            variables: {
                where, sortBy, first, skip,
            },
            errorMessage: `[error] Unable to query ${gql.PLURAL_FORM}`,
            dataPath: 'meta.count',
        })
    }

    async function create (context, data) {
        if (!context) throw new Error('no context')
        if (!data) throw new Error('no data')

        return await requestToCondo(context, {
            query: gql.CREATE_OBJ_MUTATION,
            variables: { data },
            errorMessage: `[error] Create ${gql.SINGULAR_FORM} internal error`,
            dataPath: 'obj',
        })
    }

    return {
        gql,
        count,
        create,
        getAll,
        getOne,
    }
}

module.exports = {
    generateCondoServerUtils,
    requestToCondo,
}
