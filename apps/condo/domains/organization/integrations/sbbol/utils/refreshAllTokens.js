const { Organization } = require('@condo/domains/organization/utils/serverSchema')
const { SBBOL_IMPORT_NAME } = require('../common')
const { getOrganizationAccessToken } = require('./getOrganizationAccessToken')

async function refreshAllTokens (context) {
    // we need to refresh all tokens once per month
    const organizations = await Organization.getAll(context, { importRemoteSystem: SBBOL_IMPORT_NAME })
    await Promise.all(organizations.map(async organization => {
        console.log('Updating tokens for ', organization.name)
        try {
            await getOrganizationAccessToken(context, organization.importId)
        } catch (error) {
            console.log(error)
        }
    }))
}

module.exports = {
    refreshAllTokens,
}