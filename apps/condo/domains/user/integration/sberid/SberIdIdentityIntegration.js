const axios = require('axios').default

// eslint-disable-next-line import/order
const https = require('https')
const jwtDecode = require('jwt-decode')
const { capitalize, isNil } = require('lodash')
const { customAlphabet } = require('nanoid')


const conf = require('@open-condo/config')

const { normalizeEmail } = require('@condo/domains/common/utils/mail')
const { normalizePhone } = require('@condo/domains/common/utils/phone')

// get sber id configuration params
const SBER_ID_CONFIG = process.env.SBER_ID_CONFIG ? JSON.parse(process.env.SBER_ID_CONFIG) : {}
const {
    authorizeUrl,
    tokenUrl,
    userInfoUrl,
    scope,
    clientId,
    clientSecret,
    redirectUri,
    cert,
    key,
    verifyServerSsl,
} = SBER_ID_CONFIG
const callbackPath = '/api/sber_id/auth/callback'
const callbackUri = redirectUri || `${conf.SERVER_URL}${callbackPath}`
const axiosTimeout = 10000

// instantiate httpsAgent in order to support mTLS communication with sber id servers
const httpsAgent = new https.Agent({
    rejectUnauthorized: verifyServerSsl,
    cert,
    key,
})

// instantiate request id generator
const nanoid = customAlphabet('1234567890abcdef', 32)

class SberIdIdentityIntegration {
    async generateLoginFormParams (checks, redirectUrl) {
        const { nonce, state } = checks
        const link = new URL(authorizeUrl || conf.SERVER_URL)

        // generate params
        const responseType = 'code'
        const redirectUri = isNil(redirectUrl) ? callbackUri : redirectUrl

        // set params to link
        link.searchParams.set('scope', scope)
        link.searchParams.set('state', state)
        link.searchParams.set('response_type', responseType)
        link.searchParams.set('client_id', clientId)
        link.searchParams.set('redirect_uri', redirectUri)
        link.searchParams.set('nonce', nonce)

        return link
    }

    async issueExternalIdentityToken (code, redirectUrl) {
        const redirectUri = isNil(redirectUrl) ? callbackUri : redirectUrl
        // set issue token request parameters
        const request = {
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            client_id: clientId,
            client_secret: clientSecret,
        }

        // send a request
        const tokenResponse = await axios.create({
            timeout: axiosTimeout,
            headers: {
                'x-ibm-client-id': clientId,
                'rquid': nanoid(),
            },
            validateStatus: () => true,
            httpsAgent,
        }).post(tokenUrl, new URLSearchParams(request))

        // extract required params
        const {
            access_token: accessToken,
            token_type: tokenType,
            expires_in: expiresIn,
            scope,
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

    async getUserInfo ({ accessToken }) {
        if (!accessToken) throw new Error('call getUserInfo without required accessToken')

        // send a request
        const response = await axios.create({
            timeout: axiosTimeout,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'x-ibm-client-id': clientId,
                'x-introspect-rquid': nanoid(),
            },
            validateStatus: () => true,
            httpsAgent,
        }).get(userInfoUrl)

        // extract params that going to be cleaned
        const {
            iss,
            sub,
            email,
            phone_number: phoneNumber,
            family_name: familyName,
            given_name: givenName,
        } = response.data

        if (response.status !== 200 || isNil(sub)) {
            throw new Error(JSON.stringify(response.data))
        }

        return {
            id: sub,
            issuer: iss,
            email: normalizeEmail(email),
            phoneNumber: normalizePhone(phoneNumber),
            familyName: this.capitalizeName(familyName),
            givenName: this.capitalizeName(givenName),
        }
    }

    async getUserExternalIdentityId ({ idToken }) {
        const decodedToken = jwtDecode(idToken)
        return decodedToken.sub
    }

    capitalizeName (value) {
        if (isNil(value)) {
            return value
        } else {
            return value.trim()
                .replace(/\s+/g, ' ') // get rid of space sequences - replace them with single space
                .split(' ') // split name part into separate words (DE, SANTOS)
                .map(capitalize) // capitalize names: DE -> De, SANTOS -> Santos
                .join(' ') // join them into single capitalized name without extra spaces
        }
    }
}

module.exports = {
    SberIdIdentityIntegration,
}