const util = require('util')

const jwtDecode = require('jwt-decode') // decode jwt without validation
const { Issuer, custom } = require('openid-client') // certified openid client will all checks

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')

const SBBOL_AUTH_CONFIG = conf.SBBOL_AUTH_CONFIG ? JSON.parse(conf.SBBOL_AUTH_CONFIG) : {}
const SBBOL_AUTH_CONFIG_EXTENDED = conf.SBBOL_AUTH_CONFIG_EXTENDED ? JSON.parse(conf.SBBOL_AUTH_CONFIG_EXTENDED) : {}
const SBBOL_PFX = conf.SBBOL_PFX ? JSON.parse(conf.SBBOL_PFX) : {}
const SERVER_URL = conf.SERVER_URL
const JWT_ALG = 'gost34.10-2012'

const logger = getLogger('sbbol/oauth2')

class SbbolOauth2Api {
    constructor ({ clientSecret, useExtendedConfig }) {
        if (!clientSecret) throw new Error('SbbolOauth2Api: unknown clientSecret')
        this.config = useExtendedConfig ? SBBOL_AUTH_CONFIG_EXTENDED : SBBOL_AUTH_CONFIG
        this.createClient(clientSecret)
    }

    createClient (clientSecret) {
        this.enableDebugMode()
        this.createIssuer()
        const client = new this.issuer.Client({
            client_id: String(this.config.client_id),
            client_secret: clientSecret,
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
                logger.error({ msg: 'JWT validation error', jwt, error })
            }
            return { protected: jwtDecode(jwt, { header: true }), payload: jwtDecode(jwt) }
        }
        this.client = client
    }

    createIssuer () {
        const sbbolIssuer = new Issuer({
            issuer: this.config.issuer,
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
            scope: this.config.scope,
            ...checks,
        })
    }

    async completeAuth (inputOrReq, checks) {
        const params = this.client.callbackParams(inputOrReq)
        return await this.client.callback(this.redirectUrl, params, checks)
    }

    async refreshToken (refreshToken) {
        return await this.client.refresh(refreshToken)
    }

    async fetchUserInfo (accessToken) {
        return await this.client.userinfo(accessToken)
    }

    // TODO(dkovyazin): DOMA-10395 find out why we are using mix of oauth versions on production and unify api

    get userInfoUrl () {
        const path = this.config.hasOwnProperty('oauthVersion') ? `/ic/sso/api/v${this.config.oauthVersion}` : '/ic/sso/api/v1'
        return `${this.protectedUrl}${path}/oauth/user-info`
    }

    get redirectUrl () {
        return `${SERVER_URL}/api/sbbol/auth/callback`
    }

    get tokenUrl () {
        const path = this.config.hasOwnProperty('oauthVersion') ? `/ic/sso/api/v${this.config.oauthVersion}` : '/ic/sso/api/v2'
        return `${this.protectedUrl}${path}/oauth/token`
    }

    get authUrl () {
        const path = this.config.hasOwnProperty('oauthVersion') ? `/ic/sbbid/api/v${this.config.oauthVersion}` : '/ic/sso/api/v2'
        return `${this.url}${path}/oauth/authorize`
    }

    get revokeUrl () {
        const path = this.config.hasOwnProperty('oauthVersion') ? `/ic/sso/api/v${this.config.oauthVersion}` : '/ic/sso/api/v1'
        return `${this.protectedUrl}${path}/oauth/revoke`
    }

    get url () {
        return `${this.config.host}:${this.config.port}`
    }

    get protectedUrl () {
        return `${this.config.protected_host}:${this.config.protected_port || this.config.port}`
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
                            msg: 'request', data: logData,
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
                            msg: 'response', data: logData,
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