const { pickBy, get, isEmpty, isObject } = require('lodash')

const {
    generateGetAllGQL,
    generateGetCountGQL,
    generateCreateGQL,
    generateCreateManyGQL,
    generateUpdateGQL,
    generateUpdateManyGQL,
    generateDeleteGQL,
    generateGqlQueries,
} = require('@open-condo/codegen/generate.gql')
const { GQLError, GQLErrorCode, GQLInternalErrorTypes } = require('@open-condo/keystone/errors')
const { getById } = require('@open-condo/keystone/schema')

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
        const fields = {
            code: GQLErrorCode.INTERNAL_ERROR,
            type: GQLInternalErrorTypes.SUB_GQL_ERROR,
            message: errorMessage,
        }
        if (errorMapping && isObject(errorMapping)) {
            const message = _getAllErrorMessages(errors).join(' -- ')
            for (const key in errorMapping) {
                if (message.includes(key)) {
                    Object.assign(fields, errorMapping[key])
                    break
                }
            }
        }

        throw new GQLError(fields, context, errors)
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

/** @deprecated use generateServerUtils with schemaName parameter */
function _generateServerUtilsDeprecated (gql) {
    if (!gql) throw new Error('you are trying to generateServerUtils without gql argument')

    // note developers that they are using deprecated generateServerUtils
    console.warn(`Generation of server utils by provided GQL object ${gql.PLURAL_FORM} going to be deprecated soon`)

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

    async function count (context, where, options = {}) {
        if (!context) throw new Error('no context')
        if (!where) throw new Error('no where')
        _checkOptions(options)
        return await execGqlWithoutAccess(context, {
            query: gql.GET_COUNT_OBJS_QUERY,
            variables: {
                where,
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

    async function createMany (context, data, options = {}) {
        if (!context) throw new Error('no context')
        if (!data) throw new Error('no data')
        _checkOptions(options)
        return await execGqlWithoutAccess(context, {
            query: gql.CREATE_OBJS_MUTATION,
            variables: { data },
            errorMessage: `[error] Create ${gql.PLURAL_FORM} internal error`,
            dataPath: 'objs',
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
        createMany,
        update,
        updateMany,
        updateOrCreate,
        delete: delete_,
        softDelete,
        softDeleteMany,
    }
}

function _addBracesIfMissing (fields) {
    const trimmed = fields.trim()
    return trimmed.startsWith('{') ? trimmed : `{ ${trimmed} }`
}

function generateServerUtils (gqlOrSchemaName) {
    if (!gqlOrSchemaName) throw new Error('you are trying to generateServerUtils without gqlOrSchemaName argument')

    // pre calc default gql
    const isSchemaNameProvided = typeof gqlOrSchemaName === 'string'
    const defaultGql = isSchemaNameProvided ? generateGqlQueries(gqlOrSchemaName, '{ id }') : gqlOrSchemaName
    const { SINGULAR_FORM: singularName, PLURAL_FORM: pluralForm } = defaultGql

    // check if this is deprecated server utils generation by provided gql object
    if (!isSchemaNameProvided) {
        return _generateServerUtilsDeprecated(gqlOrSchemaName)
    }

    // make decision to use defaultGql or not
    // don't use defaultGql for cases when fields are provided
    // for cases when fields empty use defaultGql (going to contains id field only)
    const isDefaultGql = (fields) => isEmpty(fields)

    // prepare a query resolver helper
    const queryResolver = {
        getAll: (fields) => isDefaultGql(fields)
            ? defaultGql.GET_ALL_OBJS_QUERY : generateGetAllGQL(gqlOrSchemaName, _addBracesIfMissing(fields)),
        count: (fields) => isDefaultGql(fields)
            ? defaultGql.GET_COUNT_OBJS_QUERY : generateGetCountGQL(gqlOrSchemaName, _addBracesIfMissing(fields)),
        create: (fields) => isDefaultGql(fields)
            ? defaultGql.CREATE_OBJ_MUTATION : generateCreateGQL(gqlOrSchemaName, _addBracesIfMissing(fields)),
        createMany: (fields) => isDefaultGql(fields)
            ? defaultGql.CREATE_OBJS_MUTATION : generateCreateManyGQL(gqlOrSchemaName, _addBracesIfMissing(fields)),
        update: (fields) => isDefaultGql(fields)
            ? defaultGql.UPDATE_OBJ_MUTATION : generateUpdateGQL(gqlOrSchemaName, _addBracesIfMissing(fields)),
        updateMany: (fields) => isDefaultGql(fields)
            ? defaultGql.UPDATE_OBJS_MUTATION : generateUpdateManyGQL(gqlOrSchemaName, _addBracesIfMissing(fields)),
        delete: (fields) => isDefaultGql(fields)
            ? defaultGql.DELETE_OBJ_MUTATION : generateDeleteGQL(gqlOrSchemaName, _addBracesIfMissing(fields)),
    }

    /**
     * Get all objects by provided where statement
     * @param context - keystone execution context
     * @param where - gql where statement
     * @param fields - returning fields in gql notation
     * @param { sortBy, first, skip } - pagination parameters
     * @param options - server side tuning options
     * @returns {Promise<[*]>} - model stored objects
     */
    async function getAll (context, where, fields, { sortBy, first, skip } = {}, options = {}) {
        if (!context) throw new Error('no context')
        if (!where) throw new Error('no where')
        _checkOptions(options)
        return await execGqlWithoutAccess(context, {
            query: queryResolver.getAll(fields),
            variables: {
                where, sortBy, first, skip,
            },
            errorMessage: `[error] Unable to query ${pluralForm}`,
            dataPath: 'objs',
            ...options,
        })
    }

    /**
     * Get one object by provided where statement.
     * Use multipleObjectsError and doesNotExistError options to tweak execution behaviour
     * @param context - keystone execution context
     * @param where - gql where statement
     * @param fields - returning fields in gql notation
     * @param options - server side tuning options
     * @returns {Promise<*>} - model stored object
     */
    async function getOne (context, where, fields, options = {}) {
        if (!context) throw new Error('no context')
        if (!where) throw new Error('no where')
        _checkOptions(options)

        const objs = await getAll(context, where, fields, { first: 2 }, options)

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

    /**
     * Count objects by provided where statement.
     * @param context - keystone execution context
     * @param where - gql where statement
     * @param options - server side tuning options
     * @returns {Promise<Number>} - count of model stored objects
     */
    async function count (context, where, options = {}) {
        if (!context) throw new Error('no context')
        if (!where) throw new Error('no where')
        _checkOptions(options)
        return await execGqlWithoutAccess(context, {
            query: queryResolver.count(),
            variables: {
                where,
            },
            errorMessage: `[error] Unable to query ${pluralForm}`,
            dataPath: 'meta.count',
            ...options,
        })
    }

    /**
     * Create object by provided data.
     * @param context - keystone execution context
     * @param data - object data
     * @param fields - returning fields in gql notation
     * @param options - server side tuning options
     * @returns {Promise<*>} - model stored object
     */
    async function create (context, data, fields, options = {}) {
        if (!context) throw new Error('no context')
        if (!data) throw new Error('no data')
        _checkOptions(options)
        return await execGqlWithoutAccess(context, {
            query: queryResolver.create(fields),
            variables: { data },
            errorMessage: `[error] Create ${singularName} internal error`,
            dataPath: 'obj',
            ...options,
        })
    }

    /**
     * Create many objects by provided data.
     * @param context - keystone execution context
     * @param data - object data
     * @param fields - returning fields in gql notation
     * @param options - server side tuning options
     * @returns {Promise<[*]>} - model stored objects
     */
    async function createMany (context, data, fields, options = {}) {
        if (!context) throw new Error('no context')
        if (!data) throw new Error('no data')
        _checkOptions(options)
        return await execGqlWithoutAccess(context, {
            query: queryResolver.createMany(fields),
            variables: { data },
            errorMessage: `[error] Create ${pluralForm} internal error`,
            dataPath: 'objs',
            ...options,
        })
    }

    /**
     * Update object by provided data and id.
     * @param context - keystone execution context
     * @param id - object id
     * @param data - object data
     * @param fields - returning fields in gql notation
     * @param options - server side tuning options
     * @returns {Promise<*>} - model stored object
     */
    async function update (context, id, data, fields, options = {}) {
        if (!context) throw new Error('no context')
        if (!id) throw new Error('no id')
        if (!data) throw new Error('no data')
        _checkOptions(options)
        return await execGqlWithoutAccess(context, {
            query: queryResolver.update(fields),
            variables: { id, data },
            errorMessage: `[error] Update ${singularName} internal error`,
            dataPath: 'obj',
            ...options,
        })
    }

    /**
     * Update many objects by provided data.
     * @param context - keystone execution context
     * @param data - object data
     * @param fields - returning fields in gql notation
     * @param options - server side tuning options
     * @returns {Promise<[*]>} - model stored objects
     */
    async function updateMany (context, data, fields, options = {}) {
        if (!context) throw new Error('no context')
        if (!data) throw new Error('no data')
        _checkOptions(options)

        return await execGqlWithoutAccess(context, {
            query: queryResolver.updateMany(fields),
            variables: { data },
            errorMessage: `[error] Update ${pluralForm} internal error`,
            dataPath: 'objs',
            ...options,
        })
    }

    /**
     * Delete an object by provided id DB.
     * @param context - keystone execution context
     * @param id - object id
     * @param fields - returning fields in gql notation
     * @param options - server side tuning options
     * @returns {Promise<*>} - model deleted object
     */
    async function delete_ (context, id, fields, options = {}) {
        if (!context) throw new Error('no context')
        if (!id) throw new Error('no id')
        _checkOptions(options)
        return await execGqlWithoutAccess(context, {
            query: queryResolver.delete(fields),
            variables: { id },
            errorMessage: `[error] Delete ${singularName} internal error`,
            dataPath: 'obj',
            ...options,
        })
    }

    /**
     * Mark an object as deleted by provided id.
     * @param context - keystone execution context
     * @param id - object id
     * @param fields - returning fields in gql notation
     * @param extraAttrs - can hold additional data for an update operation
     * @param options - server side tuning options
     * @returns {Promise<*>} - model stored object
     */
    async function softDelete (context, id, fields, extraAttrs = {}, options = {}) {
        const attrs = {
            deletedAt: 'true',
            ...extraAttrs,
        }
        return await update(context, id, attrs, fields, options)
    }

    /**
     * Mark objects as deleted by provided ids.
     * @param context - keystone execution context
     * @param ids - objects ids
     * @param fields - returning fields in gql notation
     * @param extraAttrs - can hold additional data for an update operation
     * @param options - server side tuning options
     * @returns {Promise<[*]>} - model stored objects
     */
    async function softDeleteMany (context, ids, fields, extraAttrs = {}, options = {}) {
        const data = ids.map(id => ({
            id,
            data: {
                deletedAt: 'true',
                ...extraAttrs,
            },
        }))
        return await updateMany(context, data, fields, options)
    }

    /**
     * Tries to receive existing item, and updates it on success or creates new one. Updated/created value is returned.
     * Attention! Be careful with where. Because of getOne, this helper will throw exception, if it gets 1+ items.
     * @param context - keystone execution context
     * @param where - getOne where check
     * @param data - create/update data
     * @param fields - returning fields in gql notation
     * @param options - server side tuning options
     * @returns {Promise<*|null|undefined>} - model stored object
     */
    async function updateOrCreate (context, where, data, fields, options = {}) {
        if (!context) throw new Error('no context')
        if (!where) throw new Error('no where')
        if (!data) throw new Error('no data')
        _checkOptions(options)

        const existingItem = await getOne(context, where, options)

        return get(existingItem, 'id')
            ? await update(context, existingItem.id, data, fields, options)
            : await create(context, data, fields, options)
    }

    return {
        gql: defaultGql,
        getAll,
        getOne,
        count,
        create,
        createMany,
        update,
        updateMany,
        updateOrCreate,
        delete: delete_,
        softDelete,
        softDeleteMany,
        hasFieldsParam: true, // TODO INFRA-538 remove this once migration to new server utils to be done
    }
}

module.exports = {
    generateServerUtils,
    execGqlAsUser,
    execGqlWithoutAccess,
}
