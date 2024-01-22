const { Relationship } = require('@keystonejs/fields')
const get = require('lodash/get')

const { plugin } = require('@open-condo/keystone/plugins/utils/typing')
const { getById } = require('@open-condo/keystone/schema')

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
            resolveInput: async ({ resolvedData }) => {
                // If we explicitly passed null to fromField, then we will disconnect the organization
                const objWithOrganizationId = get(resolvedData, fromField)
                if (objWithOrganizationId === null && !isRequired) {
                    resolvedData['organization'] = null
                    return resolvedData['organization']
                }

                if (objWithOrganizationId) {
                    const schemaName = fields[fromField].ref.split('.')[0]
                    const objWithOrganization = await getById(schemaName, objWithOrganizationId)

                    resolvedData['organization'] = get(objWithOrganization, 'organization')
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
