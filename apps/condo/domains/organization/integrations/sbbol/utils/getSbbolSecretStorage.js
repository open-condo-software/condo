const conf = require('@open-condo/config')

const { SbbolSecretStorage } = require('../SbbolSecretStorage')

const SBBOL_AUTH_CONFIG = conf.SBBOL_AUTH_CONFIG ? JSON.parse(conf.SBBOL_AUTH_CONFIG) : {}
const SBBOL_AUTH_CONFIG_EXTENDED = conf.SBBOL_AUTH_CONFIG_EXTENDED ? JSON.parse(conf.SBBOL_AUTH_CONFIG_EXTENDED) : {}
if (conf.NODE_ENV === 'test') {
    SBBOL_AUTH_CONFIG.client_id = 'test'
}

// Singleton instance
let sbbolSecretStorage

function getSbbolSecretStorage (useExtendedConfig = false) {
    if (sbbolSecretStorage) return sbbolSecretStorage
    sbbolSecretStorage = new SbbolSecretStorage('auth', useExtendedConfig ? SBBOL_AUTH_CONFIG_EXTENDED.client_id : SBBOL_AUTH_CONFIG.client_id)
    return sbbolSecretStorage
}

module.exports = {
    getSbbolSecretStorage,
}