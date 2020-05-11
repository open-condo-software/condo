const ow = require('ow')
const _ = require('lodash')
const Emittery = require('emittery')

const EVENTS = new Emittery()
const GQL_LIST_SCHEMA_TYPE = 'GQLListSchema'
const GQL_CUSTOM_SCHEMA_TYPE = 'GQLCustomSchema'
const GQL_SCHEMA_TYPES = [GQL_LIST_SCHEMA_TYPE, GQL_CUSTOM_SCHEMA_TYPE]

const isNotNullObject = (v) => typeof v === 'object' && v !== null
const registerSchemas = (keystone, modulesList) => {
    modulesList.forEach(
        (module) => Object.values(module).forEach(
            (GQLSchema) => {
                if (GQL_SCHEMA_TYPES.includes(GQLSchema._type)) {
                    GQLSchema._register(keystone)
                }
            }))
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
    }

    _register (keystone) {
        keystone.createList(this.name, this.schema)
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
            } else if (field.hasOwnProperty('defaultValue')) {
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
        this.name = name
        this.schema = schema
        this._type = GQL_CUSTOM_SCHEMA_TYPE
    }

    _register (keystone) {
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

module.exports = {
    GQLListSchema,
    GQLCustomSchema,
    registerSchemas,
    GQL_CUSTOM_SCHEMA_TYPE,
    GQL_LIST_SCHEMA_TYPE,
}
