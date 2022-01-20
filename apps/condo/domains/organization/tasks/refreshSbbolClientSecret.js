const conf = require('@core/config')
const faker = require('faker')
const dayjs = require('dayjs')
const { logger: baseLogger } = require('../integrations/sbbol/common')
const { createCronTask } = require('@core/keystone/tasks')
const { SbbolCredentials } = require('@condo/domains/organization/integrations/sbbol/SbbolCredentials')

const SBBOL_AUTH_CONFIG = conf.SBBOL_AUTH_CONFIG ? JSON.parse(conf.SBBOL_AUTH_CONFIG) : {}

const logger = baseLogger.child({ module: 'refreshSbbolClientSecret' })


/**
 * Syncs new and cancelled subscriptions
 */
const refreshSbbolClientSecret = createCronTask('refreshSbbolClientSecret', '0 9 * * *', async () => {
    const credentialsManager = new SbbolCredentials()
    await credentialsManager.connect({
        condoEntryPoint: './index.js',
    })

    // Assume, that we have once logged in using SBBOl and got a `TokenSet` record for our organization
    const { tokenSet } = await credentialsManager.getAccessToken()

    // Actually, a value of client secret is set for `TokenSet` record in `syncTokens` after first logging in,
    // but, this auto-refresh task will be deployed, having existing record in `TokenSet` table, that missing
    // the value. To be sure that we have a current value of client secret, fallback to environment variable
    const currentClientSecret = tokenSet.clientSecret || SBBOL_AUTH_CONFIG.client_secret

    const now = dayjs()
    if (now.isBefore(dayjs(tokenSet.clientSecretExpiresAt))) {
        logger.info('No need to change client secret', { clientSecretExpiresAt: tokenSet.clientSecretExpiresAt } )
    } else {
        await credentialsManager.changeClientSecret({
            clientId: SBBOL_AUTH_CONFIG.client_id,
            currentClientSecret,
            newClientSecret: faker.random.alphaNumeric(8),
        })
    }
})

module.exports = refreshSbbolClientSecret