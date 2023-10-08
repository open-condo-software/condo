const { faker } = require('@faker-js/faker')

const { createCronTask } = require('@open-condo/keystone/tasks')

const { getSbbolSecretStorage, changeClientSecret } = require('@condo/domains/organization/integrations/sbbol/utils')

/**
 * Changing of a client secret is performed daily for security reasons
 * Previously we were comparing current time with `clientSecretExpiresAt` and decided, whether change is needed.
 */
const refreshSbbolClientSecret = createCronTask('refreshSbbolClientSecret', '0 1 * * *', async () => {
    const sbbolSecretStorage = getSbbolSecretStorage()
    await changeClientSecret({
        clientId: sbbolSecretStorage.clientId,
        currentClientSecret: await sbbolSecretStorage.getClientSecret(),
        newClientSecret: faker.random.alphaNumeric(8),
    })
})

module.exports = refreshSbbolClientSecret