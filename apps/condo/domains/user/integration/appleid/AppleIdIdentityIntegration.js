// eslint-disable-next-line import/order
const axios = require('axios').default

// eslint-disable-next-line import/order
const dayjs = require('dayjs')
const jose = require('jose')
const jwtDecode = require('jwt-decode')
const { isNil } = require('lodash')

const conf = require('@open-condo/config')

const { normalizeEmail } = require('@condo/domains/common/utils/mail')

// get apple id configuration params
const APPLE_ID_CONFIG = process.env.APPLE_ID_CONFIG ? JSON.parse(process.env.APPLE_ID_CONFIG) : {}
const {
    authorizeUrl,
    tokenUrl,
    scope,
    clientId,
    redirectUri,
    keyId,
    teamId,
    secretKey,
} = APPLE_ID_CONFIG
const CALLBACK_PATH = '/api/apple_id/auth/callback'
const CALLBACK_URL = redirectUri || `${conf.SERVER_URL}${CALLBACK_PATH}`
const AXIOS_TIMEOUT = 10000
const keystore = new jose.JWKS.KeyStore()

class AppleIdIdentityIntegration {
    async getClientSecret () {
        const alg = 'ES256'
        const now = dayjs().startOf('day').toDate()
        const startOfTheDay = dayjs().startOf('day').unix()
        const endOfTheDay = dayjs().add(1, 'day').startOf('day').unix()

        const payload = {
            iss: teamId,
            iat: startOfTheDay,
            exp: endOfTheDay,
            aud: 'https://appleid.apple.com',
            sub: clientId,
        }

        const privateKey = await jose.JWK.asKey(secretKey)

        return await jose.JWT.sign(payload, privateKey, {
            header: { kid: keyId },
            kid: false,
            iat: false,
            algorithm: alg,
            now,
        })
    }

    async generateLoginFormParams (checks) {
        const { nonce, state } = checks
        const link = new URL(authorizeUrl || conf.SERVER_URL)

        // set params to link
        link.searchParams.set('client_id', clientId)
        link.searchParams.set('redirect_uri', CALLBACK_URL)
        link.searchParams.set('response_type', 'code')
        link.searchParams.set('response_mode', 'form_post')
        link.searchParams.set('scope', scope)
        link.searchParams.set('state', state)
        link.searchParams.set('nonce', nonce)

        return link
    }

    async issueExternalIdentityToken (code) {
        // set issue token request parameters
        const request = {
            client_id: clientId,
            client_secret: await this.getClientSecret(),
            code,
            grant_type: 'authorization_code',
            redirect_uri: CALLBACK_URL,
            scope,
        }

        // send a request
        const tokenResponse = await axios.create({
            timeout: AXIOS_TIMEOUT,
            validateStatus: () => true,
        }).post(tokenUrl, new URLSearchParams(request))

        // extract required params
        const {
            access_token: accessToken,
            token_type: tokenType,
            expires_in: expiresIn,
            id_token: idToken,
        } = tokenResponse.data

        if (tokenResponse.status !== 200 || isNil(accessToken) || isNil(idToken)) {
            throw new Error(JSON.stringify(tokenResponse.data))
        }

        return {
            accessToken,
            tokenType,
            expiresIn,
            scope,
            idToken,
        }
    }

    async getUserInfo ({ idToken }) {
        if (!idToken) throw new Error('call getUserInfo without required idToken')

        const decodedToken = jwtDecode(idToken)

        return {
            id: decodedToken.sub,
            issuer: decodedToken.iss,
            email: normalizeEmail(decodedToken.email),
        }
    }

    async validateIdToken (idToken) {
        const { kid } = jwtDecode(idToken, { header: true })

        // get key or refill keystore
        let key = keystore.get({ kid })
        if (!key) {
            const { keys } = await this.getAppleIdKeys()
            for (const appleKey of keys) {
                keystore.add(await jose.JWK.asKey(appleKey))
            }

            key = keystore.get({ kid })
        }

        // validate idToken
        const verifyResult = await jose.JWS.verify(idToken, key, { complete:true })
        const { iss, aud, exp } = JSON.parse(String(verifyResult.payload))
        return iss === 'https://appleid.apple.com' && aud === clientId && exp >= dayjs().unix()
    }

    async getAppleIdKeys () {
        // send a request
        return (await axios.create({
            timeout: AXIOS_TIMEOUT,
            validateStatus: () => true,
        }).get('https://appleid.apple.com/auth/keys')).data
    }
}

module.exports = {
    AppleIdIdentityIntegration,
}