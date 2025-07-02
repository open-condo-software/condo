const { userIsAdminOrIsSupport } = require('@open-condo/keystone/access')
const { plugin } = require('@open-condo/keystone/plugins/utils/typing')

const { AVAILABLE_ENVIRONMENTS } = require('@dev-portal-api/domains/miniapp/constants/publishing')

function exportable () {
    return plugin(({ fields = {}, ...rest }) => {
        for (const environment of AVAILABLE_ENVIRONMENTS) {
            const fieldName = `${environment}ExportId`
            fields[fieldName] = {
                type: 'Text',
                schemaDoc:
                    `ID of this entity in the ${environment} environment. ` +
                    'If set, subsequent publications to this environment will update the entity with the specified ID.',
                isRequired: false,
                access: {
                    read: true,
                    create: userIsAdminOrIsSupport,
                    update: userIsAdminOrIsSupport,
                },
            }
        }

        return { fields, ...rest }
    })
}

module.exports = {
    exportable,
}