const {
    CalendarDay,
    Checkbox,
    DateTimeUtc,
    Decimal,
    Float,
    Integer,
    Password,
    Slug,
    Url,
    Uuid,
    Virtual,
} = require('@open-keystone/fields')
const { Markdown } = require('@open-keystone/fields-markdown')
const { Wysiwyg } = require('@open-keystone/fields-wysiwyg-tinymce')
const { get, isObject, isString } = require('lodash')

const {
    AddressPartWithType,
    AutoIncrementInteger,
    DateInterval,
    Json,
    LocalizedText,
    Select,
    SignedDecimal,
    Text,
    EncryptedText,
    CustomFile,
} = require('../../fields')
const { HiddenRelationship } = require('../../plugins/utils/HiddenRelationship')
const { AuthedRelationship, Relationship } = require('../../plugins/utils/Relationship')
const { GQL_SCHEMA_TYPES, GQL_CUSTOM_SCHEMA_TYPE, GQL_LIST_SCHEMA_TYPE } = require('../../schema')

function _defaultAdminUiColumns (fields) {
    const res = []
    if (fields.createdBy) res.push('createdBy')
    if (fields.createdAt) res.push('createdAt')
    return res.join(',')
}

function applyKeystoneV5AdminFixes (schema) {
    // https://v5.keystonejs.com/api/create-list#labelresolver
    if (!schema.labelResolver && !schema.labelField) {
        schema.labelResolver = (item) => (item.name) ? `${item.name} -- <${item.id}>` : item.id
    }
    schema.adminConfig = {
        defaultPageSize: 50,
        maximumPageSize: 100,
        defaultSort: '-createdAt',
        defaultColumns: _defaultAdminUiColumns(schema.fields),
        ...get(schema, 'adminConfig', {}),
    }
    return schema
}

/** @deprecated it's part of internal API use prepareKeystone instead */
function convertStringToTypes (schema) {
    const mapping = {
        // Default types
        AuthedRelationship,
        CalendarDay,
        Checkbox,
        DateTimeUtc,
        Decimal,
        Float,
        Integer,
        Markdown,
        Password,
        Relationship,
        Slug,
        Url,
        Uuid,
        Virtual,
        Wysiwyg,

        // Custom types
        AddressPartWithType,
        AutoIncrementInteger,
        DateInterval,
        File: CustomFile,
        Json,
        HiddenRelationship,
        LocalizedText,
        Select,
        SignedDecimal,
        Text,
        EncryptedText,
    }
    const allTypesForPrint = Object.keys(mapping).map(item => `"${item}"`).join(', ')

    if (!schema.fields) throw new Error('convertStringToTypes(): wrong schema type! no fields!')
    schema.fields = Object.keys(schema.fields).reduce((acc, field) => {
        const fieldObj = schema.fields[field]
        if (fieldObj && !isObject(fieldObj)) throw new Error(`convertStringToTypes(): field "${field}" is not an object like!`)
        const type = fieldObj.type
        if (!type) throw new Error(`convertStringToTypes(): field "${field}" no "type" attr`)
        if (!isString(type)) throw new Error(`convertStringToTypes(): field "${field}" unknown "type" == ${type}. Type can be one of the listed values: ${allTypesForPrint}`)

        // convert to object!
        const ks5type = get(mapping, type)
        if (!ks5type) throw new Error(`convertStringToTypes(): field "${field}" unknown "type" == ${type}. Type can be one of the listed values: ${allTypesForPrint}`)

        acc[field] = { ...fieldObj, type: ks5type }
        return acc
    }, {})
    return schema
}

function registerKeystone5Schema (gqlSchemaObject, keystone, globalPreprocessors = []) {
    const addSchema = (schemaObj) => registerKeystone5Schema(schemaObj, keystone, globalPreprocessors)
    if (gqlSchemaObject._type === GQL_LIST_SCHEMA_TYPE) {
        gqlSchemaObject._register(globalPreprocessors, { addSchema })
        gqlSchemaObject._keystone = keystone
        keystone.createList(gqlSchemaObject.name, {
            ...applyKeystoneV5AdminFixes(convertStringToTypes(gqlSchemaObject.registeredSchema)),
            queryLimits: { maxResults: 1000 },
        })  // create gqlSchemaObject._keystone.lists[gqlSchemaObject.name] as List type
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

/** @deprecated it's part of internal API use prepareKeystone instead */
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
