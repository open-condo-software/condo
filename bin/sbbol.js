const path = require('path')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const { SBBOL_IMPORT_NAME } = require('@condo/domains/organization/integrations/sbbol/common')
const { SbbolRequestApi } = require('@condo/domains/organization/integrations/sbbol/SbbolRequestApi')
const { TokenSet: TokenSetApi, Organization: OrganizationApi } = require('@condo/domains/organization/utils/serverSchema')

class SbbolTokenManager {

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

    async getAccessToken ( organizationImportId = null ) {
        const serviceToken = await SbbolRequestApi.getServiceOrganizationAccessToken()
        return serviceToken
    }

    async updateSecret () {
        // we need to update secret of application once in a 2 weeks
    }

    async refreshAllTokens () {
        // we need to refresh all tokens once per month
        const organizations = await OrganizationApi.getAll(this.context, { importRemoteSystem: SBBOL_IMPORT_NAME })
        await Promise.all(organizations.map(async organization => {
            console.log('Updating tokens for ', organization.name)
            try {
                await SbbolRequestApi.getOrganizationAccessToken(organization.importId)
            } catch (error) {
                console.log(error)
            }
        }))
    }


}

const workerJob = async () => {
    const tokensJob = new SbbolTokenManager()
    await tokensJob.connect()
    await tokensJob.refreshAllTokens()
}

workerJob().then(() => {
    console.log('All done')
    process.exit(0)
}).catch(err => {
    console.error('Failed to done', err)
})
