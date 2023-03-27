const conf = require('@open-condo/config')

const { SbbolSecretStorage } = require('../SbbolSecretStorage')

const SBBOL_AUTH_CONFIG = conf.SBBOL_AUTH_CONFIG ? JSON.parse(conf.SBBOL_AUTH_CONFIG) : {}
if (conf.NODE_ENV === 'test') {
    SBBOL_AUTH_CONFIG.client_id = 'test'
}

// Singleton instance
let sbbolSecretStorage

function getSbbolSecretStorage () {
    if (sbbolSecretStorage) return sbbolSecretStorage
    sbbolSecretStorage = new SbbolSecretStorage('auth', SBBOL_AUTH_CONFIG.client_id)
    return sbbolSecretStorage
}

module.exports = {
    getSbbolSecretStorage,
}