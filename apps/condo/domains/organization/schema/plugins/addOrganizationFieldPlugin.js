const { plugin } = require('@core/keystone/plugins/utils/typing')
const { Relationship } = require('@keystonejs/fields')
const get = require('lodash/get')
const { getById } = require('@core/keystone/schema')

const addOrganizationFieldPlugin = ({ fromField }) => plugin(({ fields = {}, ...rest }) => {
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
                const objWithOrganizationId = get(resolvedData, fromField)

                if (objWithOrganizationId) {
                    const schemaName = get(fields, [fromField, 'ref'])
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
