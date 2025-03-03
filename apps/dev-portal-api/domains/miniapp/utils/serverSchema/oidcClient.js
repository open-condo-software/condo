const crypto = require('crypto')

const { OIDC_SECRET_CHAR_POOL, OIDC_SECRET_LENGTH, OIDC_CLIENT_DEFAULT_PAYLOAD } = require('@dev-portal-api/domains/miniapp/constants/oidc')

function generateClientSecret () {
    return [...Array(OIDC_SECRET_LENGTH)]
        .map(() => OIDC_SECRET_CHAR_POOL[crypto.randomInt(OIDC_SECRET_CHAR_POOL.length)])
        .join('')
}

function generatePayload (clientId, redirectUri) {
    return {
        ...OIDC_CLIENT_DEFAULT_PAYLOAD,
        client_id: clientId,
        client_secret: generateClientSecret(),
        redirect_uris: [redirectUri],
    }
}

module.exports = {
    generateClientSecret,
    generatePayload,
}