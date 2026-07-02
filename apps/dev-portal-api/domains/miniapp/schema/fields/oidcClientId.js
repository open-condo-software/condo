const { userIsAdminOrIsSupport } = require('@open-condo/keystone/access')

const OIDC_CLIENT_ID_FIELD = {
    schemaDoc:
        'ID of the OIDC client used by this miniapp for condo users authentication for {environment} environment. ' +
        'Cannot be set directly by dev-portal user. ' +
        'For historical reasons (where each app has its own OIDC client), this field might be null. ' +
        'In this scenario, lookup by importId + importRemoteSystem is used to find the correct OIDC client.',
    type: 'Uuid',
    isRequired: false,
    access: {
        read: true,
        create: userIsAdminOrIsSupport,
        update: userIsAdminOrIsSupport,
    },
}

module.exports = {
    OIDC_CLIENT_ID_FIELD,
}
