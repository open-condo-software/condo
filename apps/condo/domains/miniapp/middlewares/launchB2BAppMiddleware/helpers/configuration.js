const { get } = require('lodash')
const DEV_KEYSTORE = require('oidc-provider/lib/consts/dev_keystore')
const attention = require('oidc-provider/lib/helpers/attention')


const createConfiguration = (conf) => {
    const isProduction = get(conf, 'NODE_ENV') === 'production'
    const serverUrl = get(conf, 'SERVER_URL')
    const jwks = (function () {
        const jwksStr =  get(conf, 'JWKS')
        let parsedJWKS
        try {
            parsedJWKS = jwksStr ? JSON.parse(jwksStr) : undefined
        } catch (error) {
            attention.warn('Failed to parse JWKS')
            console.error(error)
        }

        if (!parsedJWKS || !parsedJWKS.length) {
            if (isProduction) {
                attention.warn('You need to specify the JWKS to sign the miniapp launch parameters!')
            } else {
                attention.warn('Since the JWKS are not detected, the development mode keys will be used!')
                parsedJWKS = DEV_KEYSTORE
            }

        }

        return parsedJWKS
    })()

    return {
        serverUrl: serverUrl,
        whiteList: [
            (appId) => `${serverUrl}/miniapps/${appId}`,
        ],
        ttl: 1 * 60, // 1 minute in seconds
        alg: 'RS256',
        use: 'sig',
        jwks: jwks,
    }
}

module.exports = createConfiguration
