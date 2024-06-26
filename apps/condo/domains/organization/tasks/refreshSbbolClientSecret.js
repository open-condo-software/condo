const dayjs = require('dayjs')
const passwordGenerator = require('generate-password')
const get = require('lodash/get')

const conf = require('@open-condo/config')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { createCronTask } = require('@open-condo/keystone/tasks')

const { getSbbolSecretStorage, changeClientSecret } = require('@condo/domains/organization/integrations/sbbol/utils')
const { getAccessTokenForUser } = require('@condo/domains/organization/integrations/sbbol/utils/getAccessTokenForUser')
const { User } = require('@condo/domains/user/utils/serverSchema')


const SBBOL_AUTH_CONFIG = conf.SBBOL_AUTH_CONFIG ? JSON.parse(conf.SBBOL_AUTH_CONFIG) : {}
const SBBOL_AUTH_CONFIG_EXTENDED = conf.SBBOL_AUTH_CONFIG_EXTENDED ? JSON.parse(conf.SBBOL_AUTH_CONFIG_EXTENDED) : {}

/**
 * Changing of a client secret is performed daily for security reasons
 * Previously we were comparing current time with `clientSecretExpiresAt` and decided, whether change is needed.
 */
const refreshSbbolClientSecret = createCronTask('refreshSbbolClientSecret', '0 1 * * *', async () => {
    const sbbolSecretStorage = getSbbolSecretStorage()
    const sbbolSecretStorageExtended = getSbbolSecretStorage(true)

    const { keystone: context } = getSchemaCtx('User')

    const serviceUserId = get(SBBOL_AUTH_CONFIG, 'serviceUserId')
    const serviceUserIdFromExtendedConfig = get(SBBOL_AUTH_CONFIG_EXTENDED, 'serviceUserId')

    if (!serviceUserId) throw new Error('changeClientSecret: no SBBOL_AUTH_CONFIG.serviceUserId')
    if (!serviceUserIdFromExtendedConfig) throw new Error('changeClientSecret: no SBBOL_AUTH_CONFIG_EXTENDED.serviceUserId')
    if (serviceUserId !== serviceUserIdFromExtendedConfig) throw new Error('changeClientSecret: users from SBBOL_AUTH_CONFIG and SBBOL_AUTH_CONFIG_EXTENDED must be same')

    const user = await User.getOne(context, { id: serviceUserId })
    if (!user) {
        throw new Error(`Not found service User with id=${serviceUserId} to change Client Secret for SBBOL integration`)
    }

    const { accessToken } = await getAccessTokenForUser(user.id)

    const { newClientSecret, clientSecretExpiration } = await changeClientSecret({
        clientId: sbbolSecretStorage.clientId,
        currentClientSecret: await sbbolSecretStorage.getClientSecret(),
        newClientSecret: passwordGenerator.generate({
            length: 8,
            numbers: true,
        }),
        accessToken,
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
        accessToken,
        useExtendedConfig: true,
    })
})

module.exports = refreshSbbolClientSecret
