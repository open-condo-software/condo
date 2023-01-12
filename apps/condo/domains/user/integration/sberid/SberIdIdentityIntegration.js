const { customAlphabet } = require('nanoid')
const { isNil } = require('lodash')
const jwtDecode = require('jwt-decode')
const axios = require('axios').default
const https = require('https')

const conf = require('@open-condo/config')

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
    async generateLoginFormParams (checks) {
        const { nonce, state } = checks
        const link = new URL(authorizeUrl)

        // generate params
        const responseType = 'code'
        const redirectUri = callbackUri

        // set params to link
        link.searchParams.set('scope', scope)
        link.searchParams.set('state', state)
        link.searchParams.set('response_type', responseType)
        link.searchParams.set('client_id', clientId)
        link.searchParams.set('redirect_uri', redirectUri)
        link.searchParams.set('nonce', nonce)

        return link
    }

    async issueExternalIdentityToken ({ code }) {
        // set issue token request parameters
        const request = {
            grant_type: 'authorization_code',
            code,
            redirect_uri: callbackUri,
            client_id: clientId,
            client_secret: clientSecret,
        }

        // send a request
        const tokenResponse = await axios.create({
            timeout: axiosTimeout,
            headers: {
                'x-ibm-client-id': clientId,
                'rquid': this.generateRequestId(),
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
        // send a request
        const response = await axios.create({
            timeout: axiosTimeout,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'x-ibm-client-id': clientId,
                'x-introspect-rquid': this.generateRequestId(),
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
            email: this.cleanString(email),
            phoneNumber: this.cleanPhone(phoneNumber),
            familyName: this.cleanName(familyName),
            givenName: this.cleanName(givenName),
        }
    }

    async getUserExternalIdentityId ({ idToken }) {
        const decodedToken = jwtDecode(idToken)
        return decodedToken.sub
    }

    generateRequestId () {
        return nanoid()
    }

    cleanString (value) {
        return !isNil(value) ? value.toLowerCase() : null
    }

    cleanPhone (value) {
        return !isNil(value)
            ? value.replaceAll(' ', '').replaceAll('(', '').replaceAll(')', '')
            : null
    }

    cleanName (value) {
        if (isNil(value)) {
            return value
        } else {
            return value.split(' ').map(part => {
                const capitalized = part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
                return capitalized
            }).join(' ')
        }
    }
}

module.exports = {
    SberIdIdentityIntegration,
}