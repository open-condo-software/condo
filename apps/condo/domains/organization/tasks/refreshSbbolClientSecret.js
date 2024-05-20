const dayjs = require('dayjs')
const passwordGenerator = require('generate-password')

const { createCronTask } = require('@open-condo/keystone/tasks')

const { getSbbolSecretStorage, changeClientSecret } = require('@condo/domains/organization/integrations/sbbol/utils')

/**
 * Changing of a client secret is performed daily for security reasons
 * Previously we were comparing current time with `clientSecretExpiresAt` and decided, whether change is needed.
 */
const refreshSbbolClientSecret = createCronTask('refreshSbbolClientSecret', '0 1 * * *', async () => {
    const sbbolSecretStorage = getSbbolSecretStorage()
    const sbbolSecretStorageExtended = getSbbolSecretStorage(true)

    const { newClientSecret, clientSecretExpiration } = await changeClientSecret({
        clientId: sbbolSecretStorage.clientId,
        currentClientSecret: await sbbolSecretStorage.getClientSecret(),
        newClientSecret: passwordGenerator.generate({
            length: 8,
            numbers: true,
        }),
        useExtendedConfig: false,
    })

    if (sbbolSecretStorage.clientId === sbbolSecretStorageExtended.clientId) {
        await sbbolSecretStorageExtended.setClientSecret(newClientSecret, { expiresAt: dayjs().add(clientSecretExpiration, 'days').unix() })
        return
    }

    await changeClientSecret({
        clientId: sbbolSecretStorageExtended.clientId,
        currentClientSecret: await sbbolSecretStorageExtended.getClientSecret(),
        newClientSecret: passwordGenerator.generate({
            length: 8,
            numbers: true,
        }),
        useExtendedConfig: true,
    })
})

module.exports = refreshSbbolClientSecret
