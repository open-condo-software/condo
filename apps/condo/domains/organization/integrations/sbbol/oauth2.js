// Todo(zuch): need to write JWT verification

const conf = process.env
const qs = require('qs')

const { Issuer, custom } = require('openid-client') // certified openid client will all checks
const jwtDecode = require('jwt-decode') // decode jwt without validation

const SBBOL_CONFIG = conf.SBBOL_CONFIG ? JSON.parse(conf.SBBOL_CONFIG) : {}
const SBBOL_PFX = conf.SBBOL_PFX ? JSON.parse(conf.SBBOL_PFX) : {}
const JWT_ALG = 'gost34.10-2012'

// When this scope will be added, an error "Invalid scope" will be returned
const SCOPE_FOR_SUBSCRIPTION = 'PAYMENT_SUBSCRIPTION'

// When this scope will be added, an error "Invalid scope" will be returned,
// in case of '/ic/sso/api/v2/oauth/authorize' authorization endpoint
const SCOPE_FOR_SERVICE_ID = SBBOL_CONFIG.service_id

const ADDITIONAL_SCOPES = [
    'ACCOUNTING_EVENTS',
    'ACCOUNTING_EVENT_ORG',
    'ACCOUNTING_NOTIFICATION',
    'ESTATE_FEED',
    'GET_ADVANCE_ACCEPTANCES',
    'PAY_DOC_RU',
    'inn',
    'email',
    'phone_number',
    'orgKpp',
    'orgFullName',
    'OrgName',
    'offerSmartCredit',
    'summOfferSmartCredit',
    'orgLawForm',
    'orgLawFormShort',
    'orgOgrn',
    'orgActualAddress',
    'orgJuridicalAddress',
    'accounts',
    'userPosition',
    'terBank',
    'regDateINN',
    'regDateOGRN',
    'orgBusinessSegmentName',
    'userSignatureType',
    'userCryptoType',
    'userGroups',
    'individualExecutiveAgency',
    'orgOktmo',
    'isIdentified',
    'inquiryOrder',
    'userGuid',
];

const SCOPES = [
    'openid',
    ...ADDITIONAL_SCOPES,
    // SCOPE_FOR_SUBSCRIPTION,
    // SCOPE_FOR_SERVICE_ID,
]

class SbbolOauth2Api {
    constructor () {
        this.host = SBBOL_CONFIG.host
        this.protectedHost = SBBOL_CONFIG.protected_host
        this.port = SBBOL_CONFIG.port
        this.clientSecret = SBBOL_CONFIG.client_secret
        this.clientId = SBBOL_CONFIG.client_id
        this.serviceId = SBBOL_CONFIG.service_id
        this.alg = JWT_ALG
        this.redirectUrl = `${conf.SERVER_URL}/api/sbbol/auth/callback`
        if (SBBOL_PFX.certificate) {
            this.certificate = {
                pfx: Buffer.from(SBBOL_PFX.certificate, 'base64'),
                passphrase: SBBOL_PFX.passphrase,
            }
        }
        this.createClient()
    }

    createClient () {
        if (conf.SBBOL_DEBUG) {
            this.enableDebugMode()
        }
        this.createIssuer()
        const client = new this.issuer.Client({
            client_id: String(this.clientId),
            client_secret: this.clientSecret,
            redirect_uris: [this.redirectUrl],
            response_types: ['code'],
            authorization_signed_response_alg: this.alg,
            id_token_signed_response_alg: this.alg,
            userinfo_signed_response_alg: this.alg,
            token_endpoint_auth_method: 'client_secret_post',
            tls_client_certificate_bound_access_tokens: true,
        })
        client[custom.http_options] = (options) => {
            let withCertificate = { ...options }
            if (this.certificate) {
                const { pfx, passphrase } = this.certificate
                withCertificate = { ...withCertificate, https: { pfx, passphrase } }
            }
            return withCertificate
        }
        // we override standart JWT validation as we do not have JWK from oauth provider
        const _validateJWT = client.validateJWT
        client.validateJWT = async (jwt, expectedAlg, required) => {
            try {
                await _validateJWT.call(client, jwt, expectedAlg, required)
            } catch (error) {
                if (error.message === 'failed to validate JWT signature') {
                    //TODO(zuch): find a way to force jose validate gost algorithm
                } else {
                    // throw error
                    console.log(error)
                }
            }
            return { protected: jwtDecode(jwt, { header: true }), payload: jwtDecode(jwt) }
        }
        this.client = client
    }

    createIssuer () {
        const sbbolIssuer = new Issuer({
            issuer: this.protectedUrl,
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
            scope: SCOPES.join(' '),
            ...checks,
        })
    }

    async fetchTokens (req, sessionKey) {
        const params = this.client.callbackParams(req)
        if (!req.session[sessionKey]) {
            throw new Error('No check fields in user session')
        }
        const { nonce = '', state = '' } = req.session[sessionKey]
        const tokenSet = await this.client.callback(this.redirectUrl, params, {
            nonce,
            state,
        })
        return tokenSet
    }

    async refreshToken ( refreshToken ) {
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
        return `${this.host}:${this.port}`
    }

    get protectedUrl () {
        return `${this.protectedHost}:${this.port}`
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
                        console.log('--> %s %s', options.method.toUpperCase(), options.url.href)
                        console.log('--> HEADERS %o', options.headers)
                        if (options.body) {
                            console.log('--> BODY %s', options.body)
                        }
                    },
                ],
                afterResponse: [
                    (response) => {
                        console.log('<-- %i FROM %s %s', response.statusCode, response.request.options.method.toUpperCase(), response.request.options.url.href)
                        console.log('<-- HEADERS %o', response.headers)
                        if (response.body) {
                            console.log('<-- BODY %s', response.body)
                        }
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