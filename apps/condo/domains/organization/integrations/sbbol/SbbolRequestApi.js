const https = require('https')
const querystring = require('querystring')
const { URL } = require('url')
const { debugMessage, SBBOL_IMPORT_NAME } = require('./common')
const { getSchemaCtx } = require('@core/keystone/schema')
const { TokenSet: TokenSetApi } = require('@condo/domains/organization/utils/serverSchema')
const conf = process.env
const SBBOL_CONFIG = conf.SBBOL_CONFIG ? JSON.parse(conf.SBBOL_CONFIG) : {}
const SBBOL_PFX = conf.SBBOL_PFX ? JSON.parse(conf.SBBOL_PFX) : {}
const { SbbolOauth2Api } = require('./oauth2')

const REQUEST_TIMEOUT = 10 * 1000
const REQUEST_TIMEOUT_ERROR = '[request:timeout:expires'

const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)
// TODO(zuch): move all constants to constants
const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60 // its real TTL is 180 days bit we need to update it earlier


class SbbolRequestApi {
    constructor (accessToken) {
        const { protected_host: hostname, port } = SBBOL_CONFIG
        let { host } = new URL(hostname)
        this.options = {
            hostname: host,
            port,
            rejectUnauthorized: false,
            requestCert: true,
            timeout: REQUEST_TIMEOUT,
            pfx: Buffer.from(SBBOL_PFX.certificate, 'base64'),
            passphrase: SBBOL_PFX.passphrase,
            agent: null,
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Accept': 'application/json',
                'Accept-Charset': 'UTF-8',
            },
        }
        this.accessToken = accessToken
    }

    static async getServiceOrganizationAccessToken () {
        const accessToken = await SbbolRequestApi.getOrganizationAccessToken(SBBOL_CONFIG.service_organization_id)
        return accessToken
    }

    static async getOrganizationAccessToken (organizationImportId) {
        const { keystone } = await getSchemaCtx('TokenSet')
        const adminContext = await keystone.createContext({ skipAccessControl: true })
        const [tokenSet] = await TokenSetApi.getAll(adminContext, { organization: { importId: organizationImportId, importRemoteSystem: SBBOL_IMPORT_NAME } })
        const tokenExpiredError = new Error(`[tokens:expired] for organization ${organizationImportId}`)
        if (!tokenSet) {
            throw tokenExpiredError
        }
        const isRefreshTokenExpired = dayjs(dayjs()).isAfter(tokenSet.refreshTokenExpiresAt)
        if (isRefreshTokenExpired) {
            throw tokenExpiredError
        }
        const isAccessTokenExpired = dayjs(dayjs()).isAfter(tokenSet.accessTokenExpiresAt)
        if (isAccessTokenExpired) {
            const oauth2 = new SbbolOauth2Api()
            const { access_token, refresh_token, expires_at } = await oauth2.refreshToken(tokenSet.refreshToken)
            await TokenSetApi.update(adminContext, tokenSet.id, {
                accessToken: access_token,
                refreshToken: refresh_token,
                accessTokenExpiresAt: new Date(Date.now() + expires_at).toISOString(),
                refreshTokenExpiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL * 1000).toISOString(),
            })
            return access_token
        } else {
            return tokenSet.accessToken
        }
    }

    async request ({ method, path: basePath, body = null }){
        return new Promise((resolve, reject) => {
            const path = method === 'GET' && body ? `${basePath}?${querystring.stringify(body)}` : basePath
            debugMessage(`fetching ${ path }`)
            debugMessage('with request body', body)
            const requestOptions = {
                ...this.options,
                method,
                path,
            }
            requestOptions.headers.Authorization = `Bearer ${this.accessToken}`
            const request = https.request(requestOptions, response => {
                let answer = ''
                response.on('data', data => {
                    answer += data
                })
                response.on('end', () => {
                    debugMessage('response', answer)
                    return resolve(answer)
                })
            })
            request.on('timeout', () => {
                request.destroy()
                return reject(`${REQUEST_TIMEOUT_ERROR}] sbbol request failed`)
            })
            request.on('error', error => {
                return reject(error)
            })
            if (body && method === 'POST') {
                request.write(querystring.stringify(body))
            }
            request.end()
        })
    }

}

module.exports = {
    SbbolRequestApi,
}