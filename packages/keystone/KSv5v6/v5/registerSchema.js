const { get, isObject, isString } = require('lodash')

const { GQL_SCHEMA_TYPES, GQL_CUSTOM_SCHEMA_TYPE, GQL_LIST_SCHEMA_TYPE } = require('../../schema')

function convertStringToTypes (schema) {
    const { Text, Relationship, Integer, Float, Select, Slug, Virtual, Url, Uuid, Checkbox, DateTimeUtc, CalendarDay, Decimal, Password, File } = require('@keystonejs/fields')
    const { AuthedRelationship } = require('@keystonejs/fields-authed-relationship')
    const { Json, SignedDecimal, AutoIncrementInteger, LocalizedText } = require('../../fields')
    const { HiddenRelationship } = require('../../plugins/utils/HiddenRelationship')
    const mapping = {
        CalendarDay,
        Checkbox,
        DateTimeUtc,
        Decimal,
        File,
        Float,
        Integer,
        Password,
        Relationship,
        Select,
        Slug,
        Text,
        Url,
        Uuid,
        Virtual,
        Json,
        SignedDecimal,
        AutoIncrementInteger,
        LocalizedText,
        AuthedRelationship,
        HiddenRelationship,
    }

    if (!schema.fields) throw new Error('convertStringToTypes(): wrong schema type! no fields!')
    Object.keys(schema.fields).forEach((field) => {
        const fieldObj = schema.fields[field]
        if (fieldObj && !isObject(fieldObj)) throw new Error(`convertStringToTypes(): field "${field}" is not an object like!`)
        const type = fieldObj.type
        if (!type) throw new Error(`convertStringToTypes(): field "${field}" no "type" attr`)
        if (isString(type)) {
            // convert to object!
            const ks5type = mapping[type]
            if (!ks5type) throw new Error(`convertStringToTypes(): field "${field}" unknown "type" == ${type}`)
            fieldObj['type'] = mapping[type]
        }
    })
    return schema
}

function registerKeystone5Schema (gqlSchemaObject, keystone, globalPreprocessors = []) {
    const addSchema = (schemaObj) => registerKeystone5Schema(schemaObj, keystone, globalPreprocessors)
    if (gqlSchemaObject._type === GQL_LIST_SCHEMA_TYPE) {
        gqlSchemaObject._register(globalPreprocessors, { addSchema })
        gqlSchemaObject._keystone = keystone
        keystone.createList(gqlSchemaObject.name, convertStringToTypes(gqlSchemaObject.registeredSchema))  // create gqlSchemaObject._keystone.lists[gqlSchemaObject.name] as List type
        const keystoneList = get(keystone, ['lists', gqlSchemaObject.name])
        if (keystoneList) {
            // We need to save a shallow copy of createList config argument because
            // we want to use it in a future for kMigrator or some another extensions which need to define extra schema
            // extensions! It allow to use `this._keystone.lists[this.name].createListConfig`
            keystoneList.createListConfig = { ...gqlSchemaObject.schema }
            keystoneList.processedCreateListConfig = { ...gqlSchemaObject.registeredSchema }
        }
    } else if (gqlSchemaObject._type === GQL_CUSTOM_SCHEMA_TYPE) {
        gqlSchemaObject._register(globalPreprocessors, { addSchema })
        gqlSchemaObject._keystone = keystone
        keystone.extendGraphQLSchema(gqlSchemaObject.registeredSchema)
    } else {
        throw new Error('unknown schema object')
    }
}

function registerSchemas (keystone, modulesList, globalPreprocessors = []) {
    modulesList.forEach(
        (module) => {
            if (GQL_SCHEMA_TYPES.includes(module._type)) {
                registerKeystone5Schema(module, keystone, globalPreprocessors)
            } else {
                Object.values(module).forEach(
                    (GQLSchema) => {
                        if (GQL_SCHEMA_TYPES.includes(GQLSchema._type)) {
                            registerKeystone5Schema(GQLSchema, keystone, globalPreprocessors)
                        } else {
                            console.warn('Wrong schema module export format! What\'s this? ', GQLSchema)
                        }
                    })
            }
        })
}

module.exports = {
    convertStringToTypes,
    registerSchemas,
}
