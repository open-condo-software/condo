const { ArgumentError } = require('ow')
const ow = require('ow')

const GQL_LIST_SCHEMA_TYPE = 'GQLListSchema'
const GQL_CUSTOM_SCHEMA_TYPE = 'GQLCustomSchema'
const GQL_SCHEMA_TYPES = [GQL_LIST_SCHEMA_TYPE, GQL_CUSTOM_SCHEMA_TYPE]

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
            fields: ow.object.valuesOfType(ow.object.hasKeys('type')),
            access: ow.object.nonEmpty,
        }))
        this.schema = schema
        this.name = name
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
}

class GQLCustomSchema {
    constructor (name, schema) {
        ow(schema, ow.object.partialShape({
            mutations: ow.array.valueOf(
                ow.object.valuesOfType(ow.object.hasKeys(['access', 'schema', 'resolver']))),
        }))
        this.schema = schema
        this.name = name
        this._type = GQL_CUSTOM_SCHEMA_TYPE
    }

    _register (keystone) {
        keystone.extendGraphQLSchema(this.schema)
    }
}

module.exports = {
    GQLListSchema,
    GQLCustomSchema,
    registerSchemas,
    GQL_CUSTOM_SCHEMA_TYPE,
    GQL_LIST_SCHEMA_TYPE,
}
