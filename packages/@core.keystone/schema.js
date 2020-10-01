const ow = require('ow')
const _ = require('lodash')
const Emittery = require('emittery')

let EVENTS = new Emittery()
let SCHEMAS = new Map()
const GQL_LIST_SCHEMA_TYPE = 'GQLListSchema'
const GQL_CUSTOM_SCHEMA_TYPE = 'GQLCustomSchema'
const GQL_SCHEMA_TYPES = [GQL_LIST_SCHEMA_TYPE, GQL_CUSTOM_SCHEMA_TYPE]

const isNotNullObject = (v) => typeof v === 'object' && v !== null
const registerSchemas = (keystone, modulesList) => {
    modulesList.forEach(
        (module) => {
            if (GQL_SCHEMA_TYPES.includes(module._type)) {
                module._register(keystone)
            } else {
                Object.values(module).forEach(
                    (GQLSchema) => {
                        if (GQL_SCHEMA_TYPES.includes(GQLSchema._type)) {
                            GQLSchema._register(keystone)
                        } else {
                            console.warn('Wrong schema module export format! What\'s this? ', GQLSchema)
                        }
                    })
            }
        })
}
const unregisterAllSchemas = () => {
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
        schema.fields = _.pickBy(schema.fields, _.identity)
        this.name = name
        this.schema = schema
        this._type = GQL_LIST_SCHEMA_TYPE
        this._keystone = null
    }

    _factory (props = {}) {
        const result = {}
        for (const [name, field] of Object.entries(this.schema.fields)) {
            if (props.hasOwnProperty(name)) {
                if (props[name] !== undefined) {
                    result[name] = props[name]
                }
            } else if (field.factory) {
                result[name] = field.factory()
            } else if (field.hasOwnProperty('defaultValue') && typeof field.defaultValue !== 'function') {
                result[name] = field.defaultValue
            }
        }
        return result
    }

    _override (schema) {
        const mergedSchema = { ...this.schema, ...schema }
        Object.keys(schema).forEach((key) => {
            if (isNotNullObject(schema[key]) && isNotNullObject(this.schema[key])) {
                mergedSchema[key] = { ...this.schema[key], ...schema[key] }
            }
        })
        return new GQLListSchema(this.name, mergedSchema)
    }

    _register (keystone) {
        if (SCHEMAS.has(this.name)) throw new Error(`Schema ${this.name} is already registered`)
        SCHEMAS.set(this.name, this)
        this._keystone = keystone
        keystone.createList(this.name, this.schema)
    }

    on (eventName, listener) {
        ow(eventName, ow.string)
        ow(listener, ow.function)
        return EVENTS.on(`${this.name}:${eventName}`, listener)
    }

    async emit (eventName, eventData) {
        ow(eventName, ow.string)
        ow(eventData, ow.object)
        return await EVENTS.emit(`${this.name}:${eventName}`, eventData)
    }
}

class GQLCustomSchema {
    constructor (name, schema) {
        ow(schema, ow.object.partialShape({
            mutations: ow.array.valueOf(
                ow.object.valuesOfType(ow.object.hasKeys(['access', 'schema', 'resolver']))),
        }))
        if (!name.endsWith('Service')) console.warn(`GQLCustomSchema name=${name} is not ends with 'Service'`)
        this.name = name
        this.schema = schema
        this._type = GQL_CUSTOM_SCHEMA_TYPE
        this._keystone = null
    }

    _override (schema) {
        const mergedSchema = { ...this.schema, ...schema }
        return new GQLCustomSchema(this.name, mergedSchema)
    }

    _register (keystone) {
        if (SCHEMAS.has(this.name)) throw new Error(`Schema ${this.name} is already registered`)
        SCHEMAS.set(this.name, this)
        this._keystone = keystone
        keystone.extendGraphQLSchema(this.schema)
    }

    on (eventName, listener) {
        ow(eventName, ow.string)
        ow(listener, ow.function)
        return EVENTS.on(`${this.name}:${eventName}`, listener)
    }

    async emit (eventName, eventData) {
        ow(eventName, ow.string)
        ow(eventData, ow.object)
        return await EVENTS.emit(`${this.name}:${eventName}`, eventData)
    }
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
    const res = await find(schemaName, { id })
    if (res.length > 1) throw new Error('getById() returns multiple objects')
    else if (res.length === 1) return res[0]
    else return null
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
    GQL_CUSTOM_SCHEMA_TYPE,
    GQL_LIST_SCHEMA_TYPE,
}
