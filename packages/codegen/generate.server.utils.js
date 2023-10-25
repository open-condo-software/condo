const { pickBy, get, isEmpty, isObject } = require('lodash')

const conf = require('@open-condo/config')
const { GQLError } = require('@open-condo/keystone/errors')
const { getById } = require('@open-condo/keystone/schema')

const IS_DEBUG = conf.NODE_ENV === 'development' || conf.NODE_ENV === 'test'

const isNotUndefined = (x) => typeof x !== 'undefined'
const ALLOWED_OPTIONS = ['errorMapping', 'doesNotExistError', 'multipleObjectsError']

function _getAllErrorMessages (errors) {
    const messages = []
    for (const x of errors) {
        const m = get(x, 'message')
        if (m) messages.push(m)
    }
    return messages
}

function _throwIfError (context, errors, data, errorMessage, errorMapping) {
    if (errors) {
        if (IS_DEBUG) {
            const errorsToShow = errors.filter(error => get(error, 'originalError.data') || get(error, 'originalError.internalData'))
            if (!isEmpty(errorsToShow)) errorsToShow.forEach((error) => console.warn(get(error, 'originalError.data'), '\n', get(error, 'originalError.internalData')))
            console.error(errors)
        }

        let error = new Error(errorMessage)

        /** NOTE(pahaz): you can use it like so:
         *
         *    const ERRORS = {
         *        PASSWORD_IS_TOO_SHORT: {
         *            mutation: 'registerNewUser',
         *            variable: ['data', 'password'],
         *            code: BAD_USER_INPUT,
         *            type: WRONG_FORMAT,
         *            message: 'Password length is less then {min} characters',
         *            messageForUser: 'api.user.registerNewUser.PASSWORD_IS_TOO_SHORT',
         *            messageInterpolation: {
         *                min: MIN_PASSWORD_LENGTH,
         *            },
         *        },
         *    }
         *
         *    const user = await User.create(context, userData, {
         *        errorMapping: {
         *            '[password:minLength:User:password]': ERRORS.PASSWORD_IS_TOO_SHORT,
         *        },
         *    })
         *
         */
        if (errorMapping && isObject(errorMapping)) {
            const message = _getAllErrorMessages(errors).join(' -- ')
            for (const key in errorMapping) {
                if (message.includes(key)) {
                    error = new GQLError(errorMapping[key], context)
                    break
                }
            }
        }

        // NOTE(pahaz): we will see this nested result at the ApolloErrorFormatter
        error.errors = errors
        error.reqId = get(context, 'req.id')
        throw error
    }
    if (!data || typeof data !== 'object') {
        throw new Error('wrong query result')
    }
}

function _checkOptions (options) {
    // NOTE(pahaz): you need to know! this options is global for create/update/getOne/getAll/count!
    //   if you want to add one new option you need to check all of this function!
    //  - errorMapping -- you con use it to customize or override the error look at _throwIfError notes for examples
    for (const key in options) {
        if (!ALLOWED_OPTIONS.includes(key)) throw new Error(`Unknown options key ${key}!`)
    }
}

async function execGqlAsUser (context, user, {
    query,
    variables,
    errorMessage = '[error] Internal Exec as user GQL Error',
    authedListKey = 'User',
    dataPath = 'obj',
    errorMapping = null,
    deleted = false,
}) {
    if (!context) throw new Error('missing context argument')
    if (!context.executeGraphQL) throw new Error('wrong context argument: no executeGraphQL')
    if (!context.createContext) throw new Error('wrong context argument: no createContext')
    if (!user) throw new Error('wrong user argument')
    if (!user.id) throw new Error('wrong user argument: no id')
    const item = await getById(authedListKey, user.id)
    // NOTE(pahaz): we don't check here deletedAt or isActive or any other fields!
    if (!item) throw new Error('unknown user id')
    const { errors, data } = await context.executeGraphQL({
        context: {
            req: {
                ...context.req,
                query: {
                    query,
                    variables,
                    deleted,
                },
            },
            ...context.createContext({
                authentication: { item, listKey: authedListKey },
                skipAccessControl: false,
            }),
        },
        variables: pickBy(variables, isNotUndefined),
        query,
    })

    _throwIfError(context, errors, data, errorMessage, errorMapping)

    return (dataPath) ? get(data, dataPath) : data
}

async function execGqlWithoutAccess (context, { query, variables, errorMessage = '[error] Internal Exec GQL Error', dataPath = 'obj', errorMapping = null }) {
    if (!context) throw new Error('missing context argument')
    if (!context.executeGraphQL) throw new Error('wrong context argument: no executeGraphQL')
    if (!context.createContext) throw new Error('wrong context argument: no createContext')
    if (!query) throw new Error('wrong query argument')
    if (!variables) throw new Error('wrong variables argument')

    const { errors, data } = await context.executeGraphQL({
        context: {
            req: context.req,
            ...context.createContext({ skipAccessControl: true }),
        },
        variables: pickBy(variables, isNotUndefined),
        query,
    })

    _throwIfError(context, errors, data, errorMessage, errorMapping)

    return (dataPath) ? get(data, dataPath) : data
}

function generateServerUtils (gql) {
    if (!gql) throw new Error('you are trying to generateServerUtils without gql argument')

    async function getAll (context, where, { sortBy, first, skip } = {}, options = {}) {
        if (!context) throw new Error('no context')
        if (!where) throw new Error('no where')
        _checkOptions(options)
        return await execGqlWithoutAccess(context, {
            query: gql.GET_ALL_OBJS_QUERY,
            variables: {
                where, sortBy, first, skip,
            },
            errorMessage: `[error] Unable to query ${gql.PLURAL_FORM}`,
            dataPath: 'objs',
            ...options,
        })
    }

    async function getOne (context, where, options = {}) {
        if (!context) throw new Error('no context')
        if (!where) throw new Error('no where')
        _checkOptions(options)

        const objs = await getAll(context, where, { first: 2 }, options)

        if (objs.length > 1) {
            if (options.multipleObjectsError) {
                throw new GQLError(options.multipleObjectsError, context)
            } else {
                throw new Error('getOne() got more than one result, check filters/logic please. The error is raised by a query if only one object is expected, but multiple objects are returned')
            }
        } else if (objs.length < 1) {
            if (options.doesNotExistError) {
                throw new GQLError(options.doesNotExistError, context)
            } else {
                return undefined
            }
        } else {
            return objs[0]
        }
    }

    async function count (context, where, { sortBy, first, skip } = {}, options = {}) {
        if (!context) throw new Error('no context')
        if (!where) throw new Error('no where')
        _checkOptions(options)
        return await execGqlWithoutAccess(context, {
            query: gql.GET_COUNT_OBJS_QUERY,
            variables: {
                where, sortBy, first, skip,
            },
            errorMessage: `[error] Unable to query ${gql.PLURAL_FORM}`,
            dataPath: 'meta.count',
            ...options,
        })
    }

    /**
     * Tries to create a new domain object.
     * @param context
     * @param data -- create data
     * @param options -- server side tuning options
     * @returns {Promise<*>}
     */
    async function create (context, data, options = {}) {
        if (!context) throw new Error('no context')
        if (!data) throw new Error('no data')
        _checkOptions(options)
        return await execGqlWithoutAccess(context, {
            query: gql.CREATE_OBJ_MUTATION,
            variables: { data },
            errorMessage: `[error] Create ${gql.SINGULAR_FORM} internal error`,
            dataPath: 'obj',
            ...options,
        })
    }

    async function update (context, id, data, options = {}) {
        if (!context) throw new Error('no context')
        if (!id) throw new Error('no id')
        if (!data) throw new Error('no data')
        _checkOptions(options)
        return await execGqlWithoutAccess(context, {
            query: gql.UPDATE_OBJ_MUTATION,
            variables: { id, data },
            errorMessage: `[error] Update ${gql.SINGULAR_FORM} internal error`,
            dataPath: 'obj',
            ...options,
        })
    }

    async function updateMany (context, data, options = {}) {
        if (!context) throw new Error('no context')
        if (!data) throw new Error('no data')
        _checkOptions(options)

        return await execGqlWithoutAccess(context, {
            query: gql.UPDATE_OBJS_MUTATION,
            variables: { data },
            errorMessage: `[error] Update ${gql.PLURAL_FORM} internal error`,
            dataPath: 'objs',
            ...options,
        })
    }

    async function delete_ (context, id, options = {}) {
        if (!context) throw new Error('no context')
        if (!id) throw new Error('no id')
        _checkOptions(options)
        return await execGqlWithoutAccess(context, {
            query: gql.DELETE_OBJ_MUTATION,
            variables: { id },
            errorMessage: `[error] Delete ${gql.SINGULAR_FORM} internal error`,
            dataPath: 'obj',
            ...options,
        })
    }

    async function softDelete (context, id, extraAttrs = {}) {
        const attrs = {
            deletedAt: 'true',
            ...extraAttrs,
        }
        return await update(context, id, attrs)
    }

    async function softDeleteMany (context, ids, extraAttrs = {}) {
        const data = ids.map(id => ({
            id,
            data: {
                deletedAt: 'true',
                ...extraAttrs,
            },
        }))
        return await updateMany(context, data)
    }

    /**
     * Tries to receive existing item, and updates it on success or creates new one. Updated/created value is returned.
     * Attention! Be careful with where. Because of getOne, this helper will throw exception, if it gets 1+ items.
     * @param context
     * @param where -- getOne where check
     * @param data -- create/update data
     * @param options -- server side tuning options
     * @returns {Promise<*|null|undefined>}
     */
    async function updateOrCreate (context, where, data, options = {}) {
        if (!context) throw new Error('no context')
        if (!where) throw new Error('no where')
        if (!data) throw new Error('no data')
        _checkOptions(options)

        const existingItem = await getOne(context, where, options)

        return get(existingItem, 'id')
            ? await update(context, existingItem.id, data, options)
            : await create(context, data, options)
    }

    return {
        gql,
        getAll,
        getOne,
        count,
        create,
        update,
        updateMany,
        updateOrCreate,
        delete: delete_,
        softDelete,
        softDeleteMany,
    }
}

module.exports = {
    generateServerUtils,
    execGqlAsUser,
    execGqlWithoutAccess,
}
