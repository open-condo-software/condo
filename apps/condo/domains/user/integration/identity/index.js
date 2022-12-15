const { SBER_ID_IDP_TYPE } = require('@condo/domains/user/constants/common')
const SberIdIdentityIntegration = require('@condo/domains/user/integration/identity/SberIdIdentityIntegration')

// instantiate integrations
const sberIntegration = new SberIdIdentityIntegration()

const getIdentityIntegration = (identityType) => {
    if (identityType === SBER_ID_IDP_TYPE) {
        return sberIntegration
    }
}
module.exports = {
    getIdentityIntegration,
}