const isEmpty = require('lodash/isEmpty')

const conf = require('@open-condo/config')

const { SbbolSecretStorage } = require('../SbbolSecretStorage')

const SBBOL_AUTH_CONFIG = conf.SBBOL_AUTH_CONFIG ? JSON.parse(conf.SBBOL_AUTH_CONFIG) : {}
const SBBOL_AUTH_CONFIG_EXTENDED = conf.SBBOL_AUTH_CONFIG_EXTENDED ? JSON.parse(conf.SBBOL_AUTH_CONFIG_EXTENDED) : {}
if (isEmpty(SBBOL_AUTH_CONFIG)) {
    SBBOL_AUTH_CONFIG.client_id = 'test'
}

// Singleton instance
let sbbolSecretStorage
let sbbolSecretStorageExtended

function getSbbolSecretStorage (useExtendedConfig = false) {
    if (useExtendedConfig) {
        if (sbbolSecretStorageExtended) return sbbolSecretStorageExtended
        sbbolSecretStorageExtended = new SbbolSecretStorage('auth', SBBOL_AUTH_CONFIG_EXTENDED.client_id)
        return sbbolSecretStorageExtended
    } else {
        if (sbbolSecretStorage) return sbbolSecretStorage
        sbbolSecretStorage = new SbbolSecretStorage('auth', SBBOL_AUTH_CONFIG.client_id)
        return sbbolSecretStorage
    }
}

module.exports = {
    getSbbolSecretStorage,
}
