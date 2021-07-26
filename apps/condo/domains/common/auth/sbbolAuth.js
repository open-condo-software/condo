const { v4: uuid } = require('uuid')
const conf = require('@core/config')
const fetch = require('node-fetch')
const https = require('https')

const SBBOL_CONFIG = conf.SBBOL_CONFIG ? JSON.parse(conf.SBBOL_CONFIG) : {}
const SBBOL_PFX = conf.SBBOL_PFX ? JSON.parse(conf.SBBOL_PFX) : {}

class SbbolApi {
    constructor () {
        this.host = SBBOL_CONFIG.host
        this.protectedHost = SBBOL_CONFIG.protected_host
        this.port = SBBOL_CONFIG.port
        this.clientSecret = SBBOL_CONFIG.client_secret
        this.clientId = SBBOL_CONFIG.client_id
        this.serviceId = SBBOL_CONFIG.service_id
        this.redirectUrl = `${conf.SERVER_URL}/api/sbbol/auth/callback`
        if (SBBOL_PFX.certificate) {
            this.agent = new https.Agent({
                pfx: Buffer.from(SBBOL_PFX.certificate, 'base64'),
                passphrase: SBBOL_PFX.passphrase,
            })
        }
    }

    async fetchToken ({ code, state, nonce }) {
        const tokenRequest = await fetch(this.tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: this.paramsToFormBody({
                grant_type: 'authorization_code',
                code,
                client_id: this.clientId,
                client_secret: this.clientSecret,
                redirect_uri: this.redirectUrl,
            }),
            agent: this.agent,
        })
        const token = await tokenRequest.json()
        return token
    }

    get tokenUrl () {
        return `${this.protectedUrl}/ic/sso/api/v2/oauth/token`
    }

    get authUrl () {
        const nonce = this.nonce
        const state = this.state
        return `${this.url}/ic/sso/api/oauth/authorize?${this.paramsToUri({
            nonce,
            state,
            response_type: 'code',
            client_id: this.clientId,
            scope: `openid ${this.serviceId}`, //  //SBBOL_CONFIG.scope
            redirect_uri: this.redirectUrl,
        })}`
    }

    paramsToUri (params = {}) {
        return Object.entries(params).map(([name, value]) => `${name}=${encodeURI(value)}`).join('&')
    }

    paramsToFormBody (params = {}) {
        return Object.entries(params).map(([name, value]) => `${encodeURIComponent(name)}=${encodeURIComponent(value)}`).join('&')
    }

    get url () {
        return `${this.host}:${this.port}`
    }

    get protectedUrl () {
        return `${this.protectedHost}:${this.port}`
    }

    get nonce () {
        return uuid()
    }

    get state () {
        return uuid()
    }

}

const helper = new SbbolApi()

const startAuth = () => {
    return (req, res, next) => {
        res.redirect(helper.authUrl)
    }
}

const completeAuth = ({ keystone }) => {
    return async (req, res, next) => {
        const { code, state, nonce } = req.query
        const token = await helper.fetchToken({ code, state, nonce })
        console.log('code, state, nonce', code, state, nonce)
        console.log('result', JSON.stringify(token))
    }
}

module.exports = {
    startAuth,
    completeAuth,
    SbbolApi,
}
