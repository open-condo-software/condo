// Todo(zuch): need to write JWT verification

const { Issuer, custom } = require('openid-client') // certified openid client will all checks
const jwtDecode = require('jwt-decode') // decode jwt without validation
const pino = require('pino')
const falsey = require('falsey')
const util = require('util')
const conf = require('@core/config')

const SBBOL_CONFIG = conf.SBBOL_CONFIG ? JSON.parse(conf.SBBOL_CONFIG) : {}
const SBBOL_PFX = conf.SBBOL_PFX ? JSON.parse(conf.SBBOL_PFX) : {}
const SERVER_URL = conf.SERVER_URL
const JWT_ALG = 'gost34.10-2012'

// NOTE: same as keystone logger
const logger = pino({ name: 'sbbol/auth', enabled: falsey(process.env.DISABLE_LOGGING) })

class SbbolOauth2Api {
    constructor () {
        this.createClient()
    }

    createClient () {
        this.enableDebugMode()
        this.createIssuer()
        const client = new this.issuer.Client({
            client_id: String(SBBOL_CONFIG.client_id),
            client_secret: SBBOL_CONFIG.client_secret,
            redirect_uris: [this.redirectUrl],
            response_types: ['code'],
            authorization_signed_response_alg: JWT_ALG,
            id_token_signed_response_alg: JWT_ALG,
            userinfo_signed_response_alg: JWT_ALG,
            token_endpoint_auth_method: 'client_secret_post',
            tls_client_certificate_bound_access_tokens: true,
        })
        client[custom.http_options] = (options) => {
            if (SBBOL_PFX.certificate) {
                return {
                    ...options,
                    https: {
                        pfx: Buffer.from(SBBOL_PFX.certificate, 'base64'),
                        passphrase: SBBOL_PFX.passphrase,
                        ...(SBBOL_PFX.https || {}),
                    },
                }
            }
            return options
        }
        // we override standart JWT validation as we do not have JWK from oauth provider
        const _validateJWT = client.validateJWT
        client.validateJWT = async (jwt, expectedAlg, required) => {
            try {
                await _validateJWT.call(client, jwt, expectedAlg, required)
            } catch (error) {
                //TODO(zuch): find a way to force jose validate gost algorithm
                logger.error({ message: error.message, jwt, error })
            }
            return { protected: jwtDecode(jwt, { header: true }), payload: jwtDecode(jwt) }
        }
        this.client = client
    }

    createIssuer () {
        const sbbolIssuer = new Issuer({
            issuer: SBBOL_CONFIG.issuer,
            authorization_endpoint: this.authUrl,
            token_endpoint: this.tokenUrl,
            userinfo_endpoint: this.userInfoUrl,
            revocation_endpoint: this.revokeUrl,
        })
        // turn off JWKS storage as it's not workin with sbbol
        // TODO(zuch): Find a way to turn on jwks
        sbbolIssuer.keystore = async () => null
        sbbolIssuer.queryKeyStore = async () => null
        this.issuer = sbbolIssuer
    }

    authorizationUrlWithParams (checks) {
        return this.client.authorizationUrl({
            response_type: 'code',
            scope: SBBOL_CONFIG.scope,
            ...checks,
        })
    }

    async completeAuth (inputOrReq, checks) {
        const params = this.client.callbackParams(inputOrReq)
        const tokenSet = await this.client.callback(this.redirectUrl, params, checks)
        return tokenSet
    }

    async refreshToken (refreshToken) {
        const tokenSet = await this.client.refresh(refreshToken)
        return tokenSet
    }

    async fetchUserInfo (accessToken) {
        const userInfo = await this.client.userinfo(accessToken)
        return userInfo
    }

    get userInfoUrl () {
        return `${this.protectedUrl}/ic/sso/api/v1/oauth/user-info`
    }

    get redirectUrl () {
        return `${SERVER_URL}/api/sbbol/auth/callback`
    }

    get tokenUrl () {
        return `${this.protectedUrl}/ic/sso/api/v2/oauth/token`
    }

    get authUrl () {
        return `${this.url}/ic/sso/api/v2/oauth/authorize`
    }

    get revokeUrl () {
        return `${this.protectedUrl}/v1/oauth/revoke`
    }

    get url () {
        return `${SBBOL_CONFIG.host}:${SBBOL_CONFIG.port}`
    }

    get protectedUrl () {
        return `${SBBOL_CONFIG.protected_host}:${SBBOL_CONFIG.protected_port || SBBOL_CONFIG.port}`
    }

    /**
     * Log incoming and outgoing data
     * https://github.com/panva/node-openid-client/blob/main/docs/README.md#customizing
     */
    enableDebugMode () {
        custom.setHttpOptionsDefaults({
            hooks: {
                beforeRequest: [
                    (options) => {
                        const logData = {
                            method: options.method.toUpperCase(),
                            url: options.url.href,
                            headers: options.headers,
                        }
                        if (options.body) {
                            logData.body = util.format('%s', options.body)
                        }
                        logger.info({
                            message: 'Request',
                            ...logData,
                        })
                    },
                ],
                afterResponse: [
                    (response) => {
                        const logData = {
                            statusCode: response.statusCode,
                            method: response.request.options.method.toUpperCase(),
                            url: response.request.options.url.href,
                            headers: response.headers,
                        }
                        if (response.body) {
                            logData.body = util.format('%s', response.body)
                        }
                        logger.info({
                            message: 'Response',
                            ...logData,
                        })
                        return response
                    },
                ],
            },
        })
    }
}

module.exports = {
    SbbolOauth2Api,
}