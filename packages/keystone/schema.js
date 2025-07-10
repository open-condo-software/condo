/** @type {import('ow').default} */
const debug = require('debug')('@open-condo/keystone/schema')
const Emittery = require('emittery')
const { pickBy, identity, isFunction, isArray, memoize } = require('lodash')
const get = require('lodash/get')
const ow = require('ow')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')

const { GQL_SCHEMA_PLUGIN } = require('./plugins/utils/typing')

let EVENTS = new Emittery()
let SCHEMAS = new Map()
const GQL_LIST_SCHEMA_TYPE = 'GQLListSchema'
const GQL_CUSTOM_SCHEMA_TYPE = 'GQLCustomSchema'
const GQL_SCHEMA_TYPES = [GQL_LIST_SCHEMA_TYPE, GQL_CUSTOM_SCHEMA_TYPE]

const TIMEOUT_DURATION = Number(conf.TIMEOUT_CHUNKS_DURATION) || 60 * 1000
const TOO_MANY_RETURNED_FIND_LIMIT = 200
const TOO_MANY_RETURNED_ITEMS_LIMIT = 200
const TOO_MANY_RETURNED_ALL_ITEMS_WARN_LIMIT = 1000
const TOO_MANY_RETURNED_ALL_ITEMS_ERROR_LIMIT = 2000

const limitsLogger = getLogger('sub-request-limits')

function logTooManyReturnedIfRequired (tooManyReturnedLimitCounters, allObjects, { functionName, schemaName, data }) {
    if (!Array.isArray(tooManyReturnedLimitCounters)) throw new Error('logTooManyReturned: wrong argument type')
    if (tooManyReturnedLimitCounters.length <= 0) return  // trying to notify only if have any counter
    const realLimit = tooManyReturnedLimitCounters[0]

    if (allObjects && Array.isArray(allObjects) && allObjects.length > realLimit) {
        limitsLogger.warn({
            msg: 'returned too much entities',
            listKey: schemaName,
            count: allObjects.length,
            functionName,
            data: {
                tooManyLimit: realLimit,
                data,
            },
        })
        tooManyReturnedLimitCounters.shift()  // remove counter and mark as already notified
    }
}

/**
 * This function is Keystone v5 only compatible and will be removed soon!
 * @deprecated use one of ./KSv5v6/v5/registerSchema
 */
function registerSchemas (keystone, modulesList, globalPreprocessors = []) {
    const { registerSchemas: registerSchemasV5 } = require('./KSv5v6/v5/registerSchema')
    registerSchemasV5(keystone, modulesList, globalPreprocessors)
}

async function unregisterAllSchemas () {
    console.warn('unregisterAllSchemas() called! It\'just for debug/tests purposes. Don\'t use it in prod!')
    EVENTS = new Emittery()
    SCHEMAS = new Map()
}

class GQLListSchema {
    constructor (name, schema) {
        ow(schema, ow.object.partialShape({
            fields: ow.object.valuesOfType(ow.any(ow.object.hasKeys('type'), ow.null, ow.undefined)),
            access: ow.object.nonEmpty,
        }))
        // remove null fields (may be overridden)
        schema.fields = pickBy(schema.fields, identity)
        this.name = name
        this.schema = schema
        this.plugins = []
        this.registeredSchema = null
        this._type = GQL_LIST_SCHEMA_TYPE
        this._keystone = null
    }

    _register (globalPreprocessors = [], { addSchema }) {
        if (SCHEMAS.has(this.name)) throw new Error(`Schema ${this.name} is already registered`)
        SCHEMAS.set(this.name, this)
        const plugins = this.schema.plugins || []
        if (plugins.length) this.schema = applyPlugins(this.schema, plugins, { schemaName: this.name, addSchema })
        this.schema.plugins = undefined
        this.registeredSchema = transformByPreprocessors(globalPreprocessors, this._type, this.name, this.schema)
    }

    _on (eventName, listener) {
        ow(eventName, ow.string)
        ow(listener, ow.function)
        return EVENTS.on(`${this.name}:${eventName}`, listener)
    }

    async _emit (eventName, eventData) {
        ow(eventName, ow.string)
        ow(eventData, ow.object)
        return await EVENTS.emit(`${this.name}:${eventName}`, eventData)
    }
}

class GQLCustomSchema {
    constructor (name, schema) {
        if (schema.hasOwnProperty('mutations')) {
            ow(schema, ow.object.partialShape({
                mutations: ow.array.valueOf(
                    ow.object.valuesOfType(ow.object.hasKeys(['access', 'schema', 'resolver']))),
            }))
        }

        if (schema.hasOwnProperty('queries')) {
            ow(schema, ow.object.partialShape({
                queries: ow.array.valueOf(
                    ow.object.valuesOfType(ow.object.hasKeys(['access', 'schema', 'resolver']))),
            }))
        }
        if (!name.endsWith('Service')) console.warn(`GQLCustomSchema name=${name} is not ends with 'Service'`)

        this.name = name
        this.schema = schema
        this.registeredSchema = null
        this._type = GQL_CUSTOM_SCHEMA_TYPE
        this._keystone = null
    }

    _register (globalPreprocessors = [], { addSchema }) {
        if (SCHEMAS.has(this.name)) throw new Error(`Schema ${this.name} is already registered`)
        SCHEMAS.set(this.name, this)
        const plugins = this.schema.plugins || []
        if (plugins.length) this.schema = applyPlugins(this.schema, plugins, { schemaName: this.name, addSchema })
        this.schema.plugins = undefined
        this.registeredSchema = transformByPreprocessors(globalPreprocessors, this._type, this.name, this.schema)
    }

    _on (eventName, listener) {
        ow(eventName, ow.string)
        ow(listener, ow.function)
        return EVENTS.on(`${this.name}:${eventName}`, listener)
    }

    async _emit (eventName, eventData) {
        ow(eventName, ow.string)
        ow(eventData, ow.object)
        return await EVENTS.emit(`${this.name}:${eventName}`, eventData)
    }
}

function applyPlugins (schema, plugins, { schemaName, addSchema }) {
    if (!isArray(plugins)) throw new Error('wrong plugins type')
    return plugins.reduce((schema, fn) => {
        if (fn._type !== GQL_SCHEMA_PLUGIN) throw new Error(`Schema ${schemaName}: wrong plugin type. You can use only GQLSchema plugins. It's not the same as Keystone v5 plugins!`)
        if (!isFunction(fn)) throw new Error(`Schema ${schemaName}: plugin is not a function!`)
        const newSchema = fn(schema, { schemaName, addSchema })
        if (!newSchema) throw new Error(`Schema ${schemaName}: plugin should return a new schema object!`)
        return newSchema
    }, schema)
}

function transformByPreprocessors (preprocessors, schemaType, name, schema) {
    if (!isArray(preprocessors)) throw new Error('wrong preprocessors type')
    debug('Transform %s %s by preprocessors', name, schemaType)
    return preprocessors.reduce((schema, fn) => {
        if (!isFunction(fn)) throw new Error('preprocessor is not a function! Check your global preprocessors')
        const fnName = Object(fn).name
        const newSchema = fn(schemaType, name, schema)
        if (!newSchema) throw new Error(`Preprocessor "${fnName}" should return a new schema object!`)
        debug('Processed by %s', fnName)
        return newSchema
    }, schema)
}

async function find (schemaName, condition) {
    if (!SCHEMAS.has(schemaName)) throw new Error(`Schema ${schemaName} is not registered yet`)
    if (SCHEMAS.get(schemaName)._type !== GQL_LIST_SCHEMA_TYPE) throw new Error(`Schema ${schemaName} type != ${GQL_LIST_SCHEMA_TYPE}`)
    const schemaList = SCHEMAS.get(schemaName)
    const result = await schemaList._keystone.lists[schemaName].adapter.find(condition)
    logTooManyReturnedIfRequired([TOO_MANY_RETURNED_FIND_LIMIT], result, {
        functionName: 'find',
        schemaName,
        data: { where: condition },
    })
    return result
}

/**
 * This function allows you to more flexibly specify a selection of records or get their number.
 *
 * @param {string} schemaName
 * @param args
 * @param {Object?} args.where
 * @param {number?} args.first
 * @param {number?} args.skip
 * @param {string?} args.orderBy
 * @param {string[]?} args.sortBy
 * same as "orderBy", only in an array
 * @param {string?} args.search
 * "search" not supported in knex adapter (from knex adapter implementation)
 * @param {boolean} meta
 * If "true", then returns { count } with the number of objects.
 * If "false", it will return objects
 * @param from
 */
async function itemsQuery (schemaName, args, { meta = false, from = {} } = {}) {
    if (!SCHEMAS.has(schemaName)) throw new Error(`Schema ${schemaName} is not registered yet`)
    if (SCHEMAS.get(schemaName)._type !== GQL_LIST_SCHEMA_TYPE) throw new Error(`Schema ${schemaName} type != ${GQL_LIST_SCHEMA_TYPE}`)
    const schemaList = SCHEMAS.get(schemaName)
    const result = await schemaList._keystone.lists[schemaName].adapter.itemsQuery(args, { meta, from })
    logTooManyReturnedIfRequired([TOO_MANY_RETURNED_ITEMS_LIMIT], result, {
        functionName: 'itemsQuery',
        schemaName,
        data: { from, meta, where: args },
    })
    return result
}

async function allItemsQueryByChunks ({
    schemaName,
    where = {},
    chunkSize = 100,
    chunkProcessor = (chunk) => chunk,
}) {
    let skip = 0
    let newChunk = []
    let all = []
    let newChunkLength
    let tooManyReturnedLimitCounters = [TOO_MANY_RETURNED_ALL_ITEMS_WARN_LIMIT]

    const startTime = Date.now()
    const sortBy = ['id_ASC']

    do {
        const now = Date.now()

        if (conf.DISABLE_CHUNKS_TIMEOUT !== 'true' && now - startTime >= TIMEOUT_DURATION) {
            limitsLogger.info({
                msg: 'operation timed out',
                functionName: 'allItemsQueryByChunks',
                listKey: schemaName,
                data: { where, first: chunkSize, skip, sortBy },
                count: all.length,
            })

            throw new Error('Operation timed out')
        }

        newChunk = await itemsQuery(schemaName, { where, first: chunkSize, skip, sortBy })
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

        logTooManyReturnedIfRequired(tooManyReturnedLimitCounters, all, {
            functionName: 'allItemsQueryByChunks',
            schemaName: schemaName,
            data: {
                where, first: chunkSize, skip, sortBy,
            },
        })

    } while (newChunkLength)

    logTooManyReturnedIfRequired([TOO_MANY_RETURNED_ALL_ITEMS_ERROR_LIMIT], all, {
        functionName: 'allItemsQueryByChunks',
        schemaName: schemaName,
        data: {
            where, first: chunkSize, skip, sortBy,
        },
    })

    return all
}

async function getByCondition (schemaName, condition) {
    const res = await find(schemaName, condition)
    if (res.length > 1) throw new Error('getByCondition() returns multiple objects')
    else if (res.length === 1) return res[0]
    else return null
}

async function getById (schemaName, id) {
    if (!id) throw new Error('getById() call without id')
    return await getByCondition(schemaName, { id })
}

function getSchemaCtx (schemaObjOrName) {
    let name
    if (typeof schemaObjOrName === 'object' && GQL_SCHEMA_TYPES.includes(schemaObjOrName._type) && schemaObjOrName.name) {
        name = schemaObjOrName.name
    } else if (typeof schemaObjOrName === 'string') {
        name = schemaObjOrName
    } else {
        throw new Error('unexpected type')
    }

    if (!SCHEMAS.has(name)) throw new Error(`Schema ${name} is not registered yet`)
    const schema = SCHEMAS.get(name)
    return {
        type: schema._type,
        name: schema.name,
        list: get(schema, ['_keystone', 'lists', schema.name], null),
        keystone: schema._keystone,
    }
}

/**
 * Outputs gql schema
 */
function getSchemaContexts () {
    if (SCHEMAS.size === 0) throw new Error('Schemas are not registered yet')
    const result = new Map()
    for (const [name] of SCHEMAS) {
        result[name] = getSchemaCtx(name)
    }
    return result
}


/**
 * Gets all relations in the schema
 */
const getAllRelations = memoize(() => {
    const schemas = getSchemaContexts()
    const listSchemas = Object.values(schemas).filter(x => x.type === GQL_LIST_SCHEMA_TYPE)
    const relations = []
    listSchemas.forEach(listSchema => {
        const listFields = get(listSchema, ['list', 'fields'], [])
        const listRelations = listFields.filter(x => x.isRelationship === true)
        listRelations.forEach(listRelation => {
            relations.push({
                label: listRelation.label,
                from: listRelation.listKey,
                to: listRelation.refListKey,
                path: listRelation.path,
                config: listRelation.config,
            })
        })
    })

    return relations
})


/**
 * Gets all relations that depend on provided list
 * Note: this function is computationally complex, but exported as cached function with finite number of arguments.
 */
const getListDependentRelations = memoize((list) => {
    if (!SCHEMAS.has(list)) throw new Error(`Schema ${list} is not registered yet`)
    if (SCHEMAS.get(list)._type !== GQL_LIST_SCHEMA_TYPE) throw new Error(`Schema ${list} type != ${GQL_LIST_SCHEMA_TYPE}`)

    const allRelations = getAllRelations()

    return allRelations.filter(x => x.to === list)
})

module.exports = {
    GQLListSchema,
    GQLCustomSchema,
    registerSchemas,
    unregisterAllSchemas,
    getSchemaCtx,
    find,
    getById,
    getByCondition,
    itemsQuery,
    allItemsQueryByChunks,
    getSchemaContexts,
    getListDependentRelations,
    GQL_SCHEMA_TYPES,
    GQL_CUSTOM_SCHEMA_TYPE,
    GQL_LIST_SCHEMA_TYPE,
}
