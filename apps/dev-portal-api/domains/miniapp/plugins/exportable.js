const { userIsAdminOrIsSupport } = require('@open-condo/keystone/access')
const { plugin } = require('@open-condo/keystone/plugins/utils/typing')

const { getEnvironmentalFields } = require('@dev-portal-api/domains/miniapp/schema/fields/environmental')

const BASE_FIELD = {
    type: 'Text',
    schemaDoc:
        'ID of this entity in the {environment} environment. ' +
        'If set, subsequent publications to this environment will update the entity with the specified ID.',
    isRequired: false,
    access: {
        read: true,
        create: userIsAdminOrIsSupport,
        update: userIsAdminOrIsSupport,
    },
}

function exportable () {
    return plugin(({ fields = {}, ...rest }) => {
        return { fields: { ...fields, ...getEnvironmentalFields('exportId', BASE_FIELD) }, ...rest }
    })
}

module.exports = {
    exportable,
}