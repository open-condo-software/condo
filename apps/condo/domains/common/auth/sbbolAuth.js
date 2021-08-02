// Todo(zuch): need to write JWT verification

const conf = process.env

const { Issuer, custom, generators } = require('openid-client') // certified openid client will all checks
const jwtDecode = require('jwt-decode') // decode jwt without validation
const Ajv = require('ajv')
const faker = require('faker')
const { v4: uuid } = require('uuid')

const { JSON_SCHEMA_VALIDATION_ERROR } = require('@condo/domains/common/constants/errors')
const { RUSSIA_COUNTRY } = require('@condo/domains/common/constants/countries.js')


const SBBOL_CONFIG = conf.SBBOL_CONFIG ? JSON.parse(conf.SBBOL_CONFIG) : {}
const SBBOL_PFX = conf.SBBOL_PFX ? JSON.parse(conf.SBBOL_PFX) : {}
const IMPORT_NAME = 'sbbol'
const { getItems, createItem, updateItem } = require('@keystonejs/server-side-graphql-client')
const { createConfirmedEmployee, createDefaultRoles } = require('@condo/domains/organization/utils/serverSchema/Organization')
const { getSchemaCtx } = require('@core/keystone/schema')



class SbbolApi {
    constructor () {
        this.host = SBBOL_CONFIG.host
        this.protectedHost = SBBOL_CONFIG.protected_host
        this.port = SBBOL_CONFIG.port
        this.clientSecret = SBBOL_CONFIG.client_secret
        this.clientId = SBBOL_CONFIG.client_id
        this.serviceId = SBBOL_CONFIG.service_id
        this.alg = 'gost34.10-2012'
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
        this.createIssuer()
        const client = new this.issuer.Client({
            client_id: this.clientId + '',
            client_secret: this.clientSecret,
            redirect_uris: [this.redirectUrl],
            response_types: ['code'],
            authorization_signed_response_alg: this.alg,
            id_token_signed_response_alg: this.alg,
            userinfo_signed_response_alg: this.alg,
            token_endpoint_auth_method: this.alg,
            tls_client_certificate_bound_access_tokens: true,
        })
        client[custom.http_options] = (options) => {
            let withCertificate = { ...options }
            if (this.certificate) {
                const { pfx, passphrase } = this.certificate
                withCertificate = { ...withCertificate, https: { pfx, passphrase } }
            }
            if (options.form) { // strange behaviour
                withCertificate.form = { ...withCertificate.form, client_id: this.clientId, client_secret: this.clientSecret }
            }
            return withCertificate
        }
        // we override standart JWT validation as we do not have JWK from oauth provider
        client.validateJWT = async (jwt) => {
            const [ header, payload ] = [jwtDecode(jwt, { header: true }), jwtDecode(jwt)]
            return { protected: header, payload }
        }
        this.client = client
    }

    createIssuer () {
        const sbbolIssuer = new Issuer({
            issuer: this._protectedUrl,
            authorization_endpoint: this.authUrl,
            token_endpoint: this.tokenUrl,
            userinfo_endpoint: this.userInfoUrl,
            revocation_endpoint: this.revokeUrl,
        })
        // turn off JWKS storage as it's not workin with sbbol
        sbbolIssuer.keystore = async () => null
        sbbolIssuer.queryKeyStore = async () => null
        this.issuer = sbbolIssuer
    }

    authorizationUrlWithParams (checks) {
        return this.client.authorizationUrl({
            response_type: 'code',
            scope: `openid ${this.serviceId}`,
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

    async fetchUserInfo (accessToken) {
        const userInfo = await this.client.userinfo(accessToken)
        return userInfo
    }

    async fetchOrganizationInfo (accessToken) {
        const orgInfo = await this.client.requestResource(this.organizationInfoUrl, accessToken)
        return orgInfo
    }

    get userInfoUrl () {
        return `${this._protectedUrl}/ic/sso/api/v1/oauth/user-info`
    }

    get organizationInfoUrl () {
        return `${this._protectedUrl}/fintech/api/v1/client-info`
    }

    get tokenUrl () {
        return `${this._protectedUrl}/ic/sso/api/v2/oauth/token`
    }

    get authUrl () {
        return `${this._url}/ic/sso/api/oauth/authorize`
    }

    get revokeUrl () {
        return `${this._protectedUrl}/v1/oauth/revoke`
    }

    get _url () {
        return `${this.host}:${this.port}`
    }

    get _protectedUrl () {
        return `${this.protectedHost}:${this.port}`
    }
}
/*
Example user info
{
    sub: 'f164e8c81fa7b5cd43d5d03164cf74764b2402d6314c67daa0964d8e691fd543',
    iss: 'https://edupirfintech.sberbank.ru:9443',
    inn: '7784523718',
    orgJuridicalAddress: '121222, Россия, г.Москва, г. Москва, ул.Космонавтов, д.1, корп./стр.1, кв.1',
    orgFullName: 'Общество с ограниченной ответственностью ТО-Партнер-626-01"',
    OrgName: 'ООО "ТО-Партнер-626-01"',
    tbIdentCode: '38',
    userGuid: 'c429a86d-38fc-3ac3-e054-00144ffb59b5',
    individualExecutiveAgency: 0,
    terBank: 'Московский Банк Сбербанка РФ',
    userSignatureType: 'Единственная подпись',
    aud: '111286',
    userCryptoType: 'SMS',
    userGroups: 'Руководитель',
    summOfferSmartCredit: 0,
    orgLawFormShort: 'ООО',
    HashOrgId: '8c80ef870028888bc444c27ba90873619cc7a6c99febd89f0e9fee155219b752',
    offerSmartCredit: false,
    orgOgrn: '1137746216261',
    isIdentified: false,
    inquiryOrder: true,
    phone_number: '79057362611',
    orgLawForm: 'Общество с ограниченной ответственностью',
    email: 'Client_Test62611@test.ru'
}
*/

const userInfoValidationSchema = {
    type: 'object',
    properties: {
        // Organization's field
        OrgName: { type: 'string' },
        orgOgrn: { type: 'string' },
        orgLawFormShort: { type: 'string' },
        // Organization's meta fields
        inn: { type: 'string' },
        orgKpp: { type: 'string' },
        orgJuridicalAddress: { type: 'string' },
        orgFullName: { type: 'string' },
        terBank: { type: 'string' },
        // Organization's admin user fields
        userGuid: { type: 'string' },
        email: { type: 'string' },
        phone_number: { type: 'string' },
    },
    required: ['inn', 'OrgName', 'orgJuridicalAddress', 'email', 'userGuid', 'phone_number'],
    additionalProperties: true,
}
const userInfoValidator = new Ajv().compile(userInfoValidationSchema)



class AuthRoutes {
    constructor () {
        this.helper = new SbbolApi()
    }

    startAuth () {
        const route = async (req, res, next) => {
            // nonce: to prevent several callbacks from same request
            // state: to validate user browser on callback
            const checks = { nonce: generators.nonce(), state: generators.state() }
            req.session[IMPORT_NAME] = checks
            await req.session.save()
            try {
                const redirectUrl = this.helper.authorizationUrlWithParams(checks)
                return res.redirect(redirectUrl)
            } catch (error) {
                return next(error)
            }
        }
        return route
    }

    completeAuth (onComplete) {
        const route = async (req, res, next) => {
            try {
                const tokenSet = await this.helper.fetchTokens(req, IMPORT_NAME)
                const { access_token } = tokenSet
                const userInfo = await this.helper.fetchUserInfo(access_token)
                // not working for now as we do not have access to fintech api
                // const orgInfo = await helper.fetchOrganizationInfo(access_token)
                if (!userInfoValidator(userInfo)) {
                    throw new Error(`${JSON_SCHEMA_VALIDATION_ERROR}] invalid json structure for userInfo`)
                }
                await onComplete(req, userInfo)
                delete req.session[IMPORT_NAME]
                await req.session.save()
                return res.redirect('/')
            } catch (error) {
                return next(error)
            }
        }
        return route
    }
}
class SyncSbbolUser {
    constructor ({ keystone, userInfo }){
        this.keystone = keystone
        this.organization = null
        this.user = null
        this.commonFields = {
            dv: 1,
            sender: { dv: 1, fingerprint: `import-${IMPORT_NAME}` },
        }
        this.organizationInfo = {
            ...this.commonFields,
            name: userInfo.OrgName,
            country: RUSSIA_COUNTRY,
            meta: {
                inn: userInfo.inn,
                kpp: userInfo.orgKpp,
                ogrn: userInfo.orgOgrn,
                address: userInfo.orgJuridicalAddress,
                fullname: userInfo.orgFullName,
                bank: userInfo.terBank,
            },
            importRemoteSystem: IMPORT_NAME,
            importId: userInfo.HashOrgId, // TODO(zuch) we have no access to orgId field from sbbol
        }
        this.userInfo = {
            ...this.commonFields,
            name: userInfo.OrgName, // TODO(zuch) we have no access to name field from sbbol
            importId: userInfo.userGuid,
            importRemoteSystem: IMPORT_NAME,
            email: userInfo.email,
            phone: userInfo.phone_number,
            isPhoneVerified: true,
            isEmailVerified: true,
            password: faker.internet.password(),
        }
    }

    async connect () {
        this.adminContext = await this.keystone.createContext({ skipAccessControl: true })
    }

    async createUser () {
        const existedUsers = await getItems({ ...this.context, listKey: 'User', where: {
            OR: [
                {
                    phone: this.userInfo.phone,
                },
                {
                    importId: this.userInfo.importId,
                    importRemoteSystem: this.userInfo.importRemoteSystem,
                },
            ],
        } })
        if (existedUsers > 1) {
            throw new Error('Multiple matching users found')
        }
        if (existedUsers.length === 0) {
            this.user = await createItem({ listKey: 'User', item: this.userInfo, returnFields: 'id', ...this.context })
            return
        }
        const existed = existedUsers[0]
        // User first register and then logIn through sbbol
        if (!existed.importId) {
            this.user = await updateItem({ listKey: 'User', item: {
                importId: this.userInfo.importId,
                importRemoteSystem: this.userInfo.importRemoteSystem,
            }, returnFields: 'id', ...this.context })
            return
        }
        this.user = {
            id: existed.id,
        }
    }

    async getAllUserOrganizations () {
        const links = await getItems({ ...this.context, listKey: 'OrganizationEmployee', where: {
            user: { id: this.user.id },
        }, returnFields: 'organization { id }' })
        const organizationIds = links.map(link => link.organization.id)
        if (organizationIds.length === 0) {
            return []
        }
        const organizations = await getItems({ ...this.context, listKey: 'Organization', where: {
            id_in: organizationIds,
        }, returnFields: 'id meta importId importRemoteSystem' })
        return organizations
    }

    async createOrganization () {
        const existedOrganization = await getItems({ ...this.context, listKey: 'Organization', where: {
            importId: this.organizationInfo.importId,
            importRemoteSystem: this.organizationInfo.importRemoteSystem,
        } })
        if (existedOrganization.length > 1) {
            throw new Error('Multiple matching organizations found')
        }
        if (existedOrganization.length === 0) {
            const userOrganizations = await this.getAllUserOrganizations()
            const theSameOrganization = userOrganizations.find(organization => organization.meta.inn === this.organizationInfo.inn)
            if (theSameOrganization) {
                const { id } = await updateItem({ listKey: 'Organization', id: theSameOrganization.id, item: {
                    importId: this.organizationInfo.importId,
                    importRemoteSystem: this.organizationInfo.importRemoteSystem,
                    meta: this.organizationInfo.meta,
                }, returnFields: 'id', ...this.context })
                this.organization = { id }
            } else {
                const { id } = await createItem({ listKey: 'Organization', item: this.organizationInfo, returnFields: 'id', ...this.context })
                this.organization = { id }
                await createDefaultRoles(this.adminContext, {
                    id,
                    country: this.organizationInfo.country,
                })

            }
            return
        }
        this.organization = {
            id: existedOrganization[0].id,
        }
    }

    async bindUserToOrganization () {
        if (!this.user.id && !this.organization.id) {
            throw new Error('No user or organization')
        }
        const existedOrganizations = await this.getAllUserOrganizations()
        const alreadyBinded = existedOrganizations.find(organization => organization.id === this.organization.id)
        if (!alreadyBinded) {
            await createItem({ listKey: 'OrganizationEmployee', item: {
                ...this.commonFields,
                inviteCode: uuid(),
                email: this.userInfo.email,
                phone: this.userInfo.phone,
                name:  this.userInfo.name,
                isAccepted: true,

            }, returnFields: 'id', ...this.context })
        }

    }

    get context () {
        return ({
            keystone: this.keystone,
            context: this.adminContext,
        })
    }


}


const sigInSbbolUser = async (req, userInfo, keystone) => {
    const sync = new SyncSbbolUser({ keystone, userInfo })
    await sync.connect()
    await sync.createUser()
    await sync.createOrganization()
    await sync.bindUserToOrganization()
    // 6. Login user
    // const { keystone } = await getSchemaCtx('User')
    // const sessionToken = await context.startAuthedSession({ item: user, list: keystone.lists['User'] })
}


module.exports = {
    AuthRoutes,
    SbbolApi,
    sigInSbbolUser,
}
