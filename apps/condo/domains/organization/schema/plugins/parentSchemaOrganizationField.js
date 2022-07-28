const { plugin } = require('@core/keystone/plugins/utils/typing')
const { Relationship } = require('@keystonejs/fields')
const get = require('lodash/get')
const { getById } = require('@core/keystone/schema')

const parentSchemaOrganizationField = (parentSchemaFieldName, parentSchemaName) => plugin(({ fields = {}, hooks = {}, ...rest }) => {
    fields['organization'] = {
        schemaDoc: 'Ref to the organization. It is filled in on the server and is read-only',
        type: Relationship,
        ref: 'Organization',
        isRequired: true,
        knexOptions: { isNotNullable: true }, // Relationship only!
        kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
        access: {
            read: true,
            create: false,
            update: false,
        },
        hooks: {
            resolveInput: async ({ resolvedData }) => {
                const parentObjId = get(resolvedData, parentSchemaFieldName)

                if (parentObjId) {
                    const parentObj = await getById(parentSchemaName, parentObjId)
                    resolvedData['organization'] = get(parentObj, 'organization')
                }

                return resolvedData['organization']
            },
        },
    }

    return { fields, hooks, ...rest }
})

module.exports = {
    parentSchemaOrganizationField,
}
