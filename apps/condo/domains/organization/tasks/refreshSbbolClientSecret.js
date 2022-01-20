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
    await credentialsManager.connect()

    // Assume, that we have once logged in using SBBOl and got a `TokenSet` record for our organization
    const { tokenSet } = await credentialsManager.getAccessToken()

    const now = dayjs()
    if (now.isBefore(dayjs(tokenSet.clientSecretExpiresAt))) {
        logger.info('No need to change client secret', { clientSecretExpiresAt: tokenSet.clientSecretExpiresAt } )
    } else {
        await credentialsManager.changeClientSecret({
            clientId: SBBOL_AUTH_CONFIG.client_id,
            currentClientSecret: tokenSet.clientSecret,
            newClientSecret: faker.random.alphaNumeric(8),
        })
    }
})

module.exports = refreshSbbolClientSecret