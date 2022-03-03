const conf = require('@core/config')
const faker = require('faker')
const { createCronTask } = require('@core/keystone/tasks')
const { SbbolCredentialsHelper } = require('@condo/domains/organization/integrations/sbbol/SbbolCredentialsHelper')

const SBBOL_AUTH_CONFIG = conf.SBBOL_AUTH_CONFIG ? JSON.parse(conf.SBBOL_AUTH_CONFIG) : {}

/**
 * Changing of a client secret is performed daily for security reasons
 * Previously we were comparing current time with `clientSecretExpiresAt` and decided, whether change is needed.
 */
const refreshSbbolClientSecret = createCronTask('refreshSbbolClientSecret', '0 1 * * *', async () => {
    const credentialsManager = new SbbolCredentialsHelper()
    await credentialsManager.connect()

    // Assume, that we have once logged in using SBBOl and got a `TokenSet` record for our organization
    const { tokenSet } = await credentialsManager.getAccessToken()

    // Actually, a value of client secret is set for `TokenSet` record in `syncTokens` after first logging in,
    // but, this auto-refresh task will be deployed, having existing record in `TokenSet` table, that missing
    // the value. To be sure that we have a current value of client secret, fallback to environment variable
    const currentClientSecret = tokenSet.clientSecret || SBBOL_AUTH_CONFIG.client_secret

    await credentialsManager.changeClientSecret({
        clientId: SBBOL_AUTH_CONFIG.client_id,
        currentClientSecret,
        newClientSecret: faker.random.alphaNumeric(8),
    })
})

module.exports = refreshSbbolClientSecret