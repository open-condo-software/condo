const conf = require('@core/config')
const { createCronTask } = require('@core/keystone/tasks')
const { SbbolCredentials } = require('@condo/domains/organization/integrations/sbbol/SbbolCredentials')

const SBBOL_AUTH_CONFIG = conf.SBBOL_AUTH_CONFIG ? JSON.parse(conf.SBBOL_AUTH_CONFIG) : {}

/**
 * Syncs new and cancelled subscriptions
 */
const refreshSbbolClientSecret = createCronTask('refreshSbbolClientSecret', '0 0 1 * *', async () => {
    const credentialsManager = new SbbolCredentials()
    await credentialsManager.connect()

    await credentialsManager.refreshClientSecret({
        clientId: String(SBBOL_AUTH_CONFIG.client_id),
    })
})

module.exports = refreshSbbolClientSecret