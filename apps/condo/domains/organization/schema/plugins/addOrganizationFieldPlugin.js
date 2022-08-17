const { plugin } = require('@condo/keystone/plugins/utils/typing')
const { Relationship } = require('@keystonejs/fields')
const get = require('lodash/get')
const { getById } = require('@condo/keystone/schema')

const addOrganizationFieldPlugin = ({ fromField, isRequired }) => plugin(({ fields = {}, ...rest }) => {
    let requiredConfig = isRequired ?
        { isRequired: true, knexOptions: { isNotNullable: true }, kmigratorOptions: { null: false, on_delete: 'models.CASCADE' } } :
        { isRequired: false, knexOptions: { isNotNullable: false }, kmigratorOptions: { null: true, on_delete: 'models.SET_NULL' } }

    fields['organization'] = {
        schemaDoc: 'Ref to the organization. It is filled in on the server and is read-only',
        type: Relationship,
        ref: 'Organization',
        ...requiredConfig,
        access: {
            read: true,
            create: false,
            update: false,
        },
        hooks: {
            resolveInput: async ({ resolvedData, existingItem }) => {
                const objWithOrganizationId = get(resolvedData, fromField, null) || get(existingItem, fromField, null)

                if (objWithOrganizationId) {
                    const schemaName = fields[fromField].ref
                    const objWithOrganization = await getById(schemaName, objWithOrganizationId)

                    resolvedData['organization'] = get(objWithOrganization, 'organization')
                }

                // If we cannot resolve organization from parent object -> set organization to null if it is possible
                if (objWithOrganizationId === null && !isRequired) {
                    resolvedData['organization'] = null
                }

                return resolvedData['organization']
            },
        },
    }

    return { fields, ...rest }
})

module.exports = {
    addOrganizationFieldPlugin,
}
