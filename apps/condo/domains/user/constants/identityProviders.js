const { PassportAuthRouter } = require('@condo/domains/user/integration/passport')

const APPLE_ID_IDP_TYPE = 'apple_id'
const SBER_ID_IDP_TYPE = 'sber_id'
const SBBOL_IDP_TYPE = 'sbbol'
const TELEGRAM_IDP_TYPE = 'telegram'

const RUNTIME_IDP_TYPES = [
    APPLE_ID_IDP_TYPE,
    SBER_ID_IDP_TYPE,
    SBBOL_IDP_TYPE,
    TELEGRAM_IDP_TYPE,
    ...PassportAuthRouter.init().getIdentityProviders(),
]

module.exports = {
    APPLE_ID_IDP_TYPE,
    SBER_ID_IDP_TYPE,
    SBBOL_IDP_TYPE,
    TELEGRAM_IDP_TYPE,
    RUNTIME_IDP_TYPES,
}