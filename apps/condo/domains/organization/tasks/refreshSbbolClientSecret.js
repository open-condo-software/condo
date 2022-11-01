const faker = require('faker')
const { createCronTask } = require('@condo/keystone/tasks')
const { changeClientSecret } = require('../integrations/sbbol/utils')
const { sbbolSecretStorage } = require('../integrations/sbbol/singletons')

/**
 * Changing of a client secret is performed daily for security reasons
 * Previously we were comparing current time with `clientSecretExpiresAt` and decided, whether change is needed.
 */
const refreshSbbolClientSecret = createCronTask('refreshSbbolClientSecret', '0 1 * * *', async () => {
    await changeClientSecret({
        clientId: sbbolSecretStorage.clientId,
        currentClientSecret: await sbbolSecretStorage.getClientSecret(),
        newClientSecret: faker.random.alphaNumeric(8),
    })
})

module.exports = refreshSbbolClientSecret