const get = require('lodash/get')
const set = require('lodash/set')

const { GQL_LIST_SCHEMA_TYPE } = require('../schema')
const adminDocPreprocessor = (schemaType, name, schema) => {
    if (schemaType !== GQL_LIST_SCHEMA_TYPE) {
        return schema
    } else {
        for (const fieldName of Object.keys(schema.fields)) {
            const currentAdminDoc = get(schema.fields, [fieldName, 'adminDoc'])
            const currentSchemaDoc = get(schema.fields, [fieldName, 'schemaDoc'], '')
            if (!currentAdminDoc) {
                set(schema.fields, [fieldName, 'adminDoc'], currentSchemaDoc)
            }
        }

        return schema
    }
}

module.exports = {
    adminDocPreprocessor,
}