const conf = require('@condo/config')
const faker = require('faker')
const { createCronTask } = require('@condo/keystone/tasks')
const { getSchemaCtx } = require('@condo/keystone/schema')
const { changeClientSecret, getOrganizationAccessToken } = require('../integrations/sbbol/utils')

const SBBOL_AUTH_CONFIG = conf.SBBOL_AUTH_CONFIG ? JSON.parse(conf.SBBOL_AUTH_CONFIG) : {}
const SBBOL_FINTECH_CONFIG = conf.SBBOL_FINTECH_CONFIG ? JSON.parse(conf.SBBOL_FINTECH_CONFIG) : {}

/**
 * Changing of a client secret is performed daily for security reasons
 * Previously we were comparing current time with `clientSecretExpiresAt` and decided, whether change is needed.
 */
const refreshSbbolClientSecret = createCronTask('refreshSbbolClientSecret', '0 1 * * *', async () => {
    const { keystone } = await getSchemaCtx('Organization')
    const context = await keystone.createContext({ skipAccessControl: true })

    // `service_organization_hashOrgId` is a `userInfo.HashOrgId` from SBBOL, that used to obtain accessToken
    // for organization, that will be queried in SBBOL using `SbbolFintechApi`.
    // Assume, that we have once logged in using SBBOl and got a `TokenSet` record for our organization
    const { tokenSet } = await getOrganizationAccessToken(context, SBBOL_FINTECH_CONFIG.service_organization_hashOrgId)

    // Actually, a value of client secret is set for `TokenSet` record in `syncTokens` after first logging in,
    // but, this auto-refresh task will be deployed, having existing record in `TokenSet` table, that missing
    // the value. To be sure that we have a current value of client secret, fallback to environment variable
    const currentClientSecret = tokenSet.clientSecret || SBBOL_AUTH_CONFIG.client_secret

    await changeClientSecret(context, {
        clientId: SBBOL_AUTH_CONFIG.client_id,
        currentClientSecret,
        newClientSecret: faker.random.alphaNumeric(8),
    })
})

module.exports = refreshSbbolClientSecret