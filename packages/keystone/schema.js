/** @type {import('ow').default} */
const ow = require('ow')
const { pickBy, identity, isFunction, isArray } = require('lodash')
const Emittery = require('emittery')

const { GQL_SCHEMA_PLUGIN } = require('./plugins/utils/typing')

let EVENTS = new Emittery()
let SCHEMAS = new Map()
const GQL_LIST_SCHEMA_TYPE = 'GQLListSchema'
const GQL_CUSTOM_SCHEMA_TYPE = 'GQLCustomSchema'
const GQL_SCHEMA_TYPES = [GQL_LIST_SCHEMA_TYPE, GQL_CUSTOM_SCHEMA_TYPE]
const IS_DEV = process.env.NODE_ENV === 'development'

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
    if (preprocessors.length > 0 && IS_DEV) console.info('✔ Transform schema by global preprocessors')
    return preprocessors.reduce((schema, fn) => {
        if (!isFunction(fn)) throw new Error('preprocessor is not a function! Check your global preprocessors')
        const newSchema = fn(schemaType, name, schema)
        if (!newSchema) throw new Error('preprocessor should return a new schema object! Check your global preprocessors')
        return newSchema
    }, schema)
}

async function find (schemaName, condition) {
    if (!SCHEMAS.has(schemaName)) throw new Error(`Schema ${schemaName} is not registered yet`)
    if (SCHEMAS.get(schemaName)._type !== GQL_LIST_SCHEMA_TYPE) throw new Error(`Schema ${schemaName} type != ${GQL_LIST_SCHEMA_TYPE}`)
    const schemaList = SCHEMAS.get(schemaName)
    return await schemaList._keystone.lists[schemaName].adapter.find(condition)
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

async function getSchemaCtx (schemaObjOrName) {
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
        name: schema.name,
        keystone: schema._keystone,
    }
}

module.exports = {
    GQLListSchema,
    GQLCustomSchema,
    registerSchemas,
    unregisterAllSchemas,
    getSchemaCtx,
    find,
    getById,
    getByCondition,
    GQL_SCHEMA_TYPES,
    GQL_CUSTOM_SCHEMA_TYPE,
    GQL_LIST_SCHEMA_TYPE,
}
