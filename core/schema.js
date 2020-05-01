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
                    GQLSchema.register(keystone)
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

    register (keystone) {
        keystone.createList(this.name, this.schema)
    }
}

class GQLCustomSchema {
    constructor (customSchema) {
        this.customSchema = customSchema
        this._type = GQL_CUSTOM_SCHEMA_TYPE
    }

    register (keystone) {
        keystone.extendGraphQLSchema(this.customSchema)
    }
}

module.exports = {
    GQLListSchema,
    GQLCustomSchema,
    registerSchemas,
}
