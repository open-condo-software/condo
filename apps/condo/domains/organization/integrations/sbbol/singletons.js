const conf = require('@condo/config')
const { SbbolSecretStorage } = require('./SbbolSecretStorage')

const SBBOL_AUTH_CONFIG = conf.SBBOL_AUTH_CONFIG ? JSON.parse(conf.SBBOL_AUTH_CONFIG) : {}
const sbbolSecretStorage = new SbbolSecretStorage('auth', SBBOL_AUTH_CONFIG.client_id)

module.exports = {
    sbbolSecretStorage,
}