const path = require('path')
const querystring = require('querystring')
const conf = require('@core/config')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const { getOrganizationAccessToken } = require('./accessToken')
const { SbbolRequestApi } = require('./SbbolRequestApi')
const { Organization, TokenSet } = require('@condo/domains/organization/utils/serverSchema')
const { SBBOL_IMPORT_NAME } = require('./common')

const SBBOL_FINTECH_CONFIG = conf.SBBOL_FINTECH_CONFIG ? JSON.parse(conf.SBBOL_FINTECH_CONFIG) : {}
const SBBOL_PFX = conf.SBBOL_PFX ? JSON.parse(conf.SBBOL_PFX) : {}

class SbbolCredentials {

    context = null

    async connect () {
        const resolved = path.resolve('apps/condo/index.js')
        const { distDir, keystone, apps } = require(resolved)
        const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
        // we need only apollo
        await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
        await keystone.connect()
        this.context = await keystone.createContext({ skipAccessControl: true })
    }

    async getAccessToken () {
        // `service_organization_hashOrgId` is a `userInfo.HashOrgId` from SBBOL, that used to obtain accessToken
        // for organization, that will be queried in SBBOL using `SbbolFintechApi`.
        const result = await getOrganizationAccessToken(SBBOL_FINTECH_CONFIG.service_organization_hashOrgId)
        return result
    }

    async refreshClientSecret ({ clientId, currentClientSecret, newClientSecret }) {
        const { accessToken, tokenSet } = await this.getAccessToken()
        const requestApi = new SbbolRequestApi({
            accessToken,
            host: SBBOL_FINTECH_CONFIG.host,
            port: SBBOL_FINTECH_CONFIG.port,
            certificate: SBBOL_PFX.certificate,
            passphrase: SBBOL_PFX.passphrase,
        })

        const body = {
            access_token: accessToken,
            client_id: clientId,
            client_secret: currentClientSecret || tokenSet.clientSecret,
            new_client_secret: newClientSecret,
        }

        // SBBOL does not accepts parameters from body of the POST-request, as it usually should be implemented.
        // It accepts parameters from URL query string
        const queryParams = querystring.stringify(body)

        const { data, statusCode } = await requestApi.request({
            method: 'POST',
            path: `/ic/sso/api/v1/change-client-secret?${queryParams}`,
            headers: {
                'Content-Type': 'application/json',
            },
        })
        if (statusCode !== 200) {
            throw new Error('Something went wrong, SBBOL sent not successful response.')
        } else {
            if (data) {
                let jsonData
                try {
                    jsonData = JSON.parse(data)
                    const { new_client_secret } = jsonData
                    if (!new_client_secret) {
                        throw new Error('New client secret is not obtained from SBBOL')
                    }
                    await TokenSet.update(this.context, tokenSet.id, {
                        clientSecret: new_client_secret,
                    })
                } catch (e) {
                    throw new Error('Unable to parse response as JSON')
                }
            }
        }
    }

    async refreshAllTokens () {
        // we need to refresh all tokens once per month
        const organizations = await Organization.getAll(this.context, { importRemoteSystem: SBBOL_IMPORT_NAME })
        await Promise.all(organizations.map(async organization => {
            console.log('Updating tokens for ', organization.name)
            try {
                await getOrganizationAccessToken(organization.importId)
            } catch (error) {
                console.log(error)
            }
        }))
    }
}

module.exports = {
    SbbolCredentials,
}