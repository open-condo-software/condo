/**
 * Manages credentials through SBBOL API
 *
 * Example:
 *      yarn workspace @app/condo sbbol:credentials refresh-all-tokens
 *      yarn workspace @app/condo sbbol:credentials refresh-client-secret 1234 a1b2c3d4
 */
const path = require('path')
const { values } = require('lodash')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const { SBBOL_IMPORT_NAME } = require('@condo/domains/organization/integrations/sbbol/common')
const { SbbolRequestApi } = require('@condo/domains/organization/integrations/sbbol/SbbolRequestApi')
const { TokenSet, Organization: OrganizationApi } = require('@condo/domains/organization/utils/serverSchema')
const conf = require('@core/config')
const { getOrganizationAccessToken } = require('@condo/domains/organization/integrations/sbbol/accessToken')

const SBBOL_FINTECH_CONFIG = conf.SBBOL_FINTECH_CONFIG ? JSON.parse(conf.SBBOL_FINTECH_CONFIG) : {}
const SBBOL_PFX = conf.SBBOL_PFX ? JSON.parse(conf.SBBOL_PFX) : {}

const COMMAND = {
    REFRESH_ALL_TOKENS: 'refresh-all-tokens',
    REFRESH_CLIENT_SECRET: 'refresh-client-secret',
}


class SbbolCredentials {

    context = null

    async connect () {
        const resolved = path.resolve('./index.js')
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

    async refreshClientSecret ({ clientId, clientSecret }) {
        const { accessToken, tokenSet } = this.getAccessToken()
        const requestApi = new SbbolRequestApi({
            accessToken,
            host: SBBOL_FINTECH_CONFIG.host,
            port: SBBOL_FINTECH_CONFIG.port,
            certificate: SBBOL_PFX.certificate,
            passphrase: SBBOL_PFX.passphrase,
        })

        const { data, statusCode } = await requestApi.request({
            method: 'GET',
            path: 'ic/sso/api/v1/change-client-secret',
            headers: {
                'Content-Type': 'application/json',
            },
            body: {
                client_id: clientId,
                client_secret: clientSecret,
            },
        })
        if (statusCode !== 200) {
            throw new Error('Something went wrong')
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
        const organizations = await OrganizationApi.getAll(this.context, { importRemoteSystem: SBBOL_IMPORT_NAME })
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

const workerJob = async () => {
    const [command] = process.argv.slice(2)
    if (!values(COMMAND).includes(command)) {
        throw new Error('Wrong command.')
    }

    const credentialsManager = new SbbolCredentials()
    await credentialsManager.connect()

    if (command === COMMAND.REFRESH_ALL_TOKENS) {
        await credentialsManager.refreshAllTokens()
    }

    if (command === COMMAND.REFRESH_CLIENT_SECRET) {
        const [clientId, clientSecret] = process.argv.slice(3)
        if (!clientId) {
            throw new Error('cliendId should be specified as a first argument of the command')
        }
        if (!clientSecret) {
            throw new Error('Old clientSecret is not specified as a second argument of the command')
        }

        await credentialsManager.refreshClientSecret({ clientId, clientSecret })
    }
}

workerJob().then(() => {
    console.log('All done')
    process.exit(0)
}).catch(err => {
    console.error(err)
    process.exit(1)
})
