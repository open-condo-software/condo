const passwordGenerator = require('generate-password')
const get = require('lodash/get')

const conf = require('@open-condo/config')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { createCronTask } = require('@open-condo/keystone/tasks')

const { getSbbolSecretStorage, changeClientSecret } = require('@condo/domains/organization/integrations/sbbol/utils')
const { getAccessTokenForUser } = require('@condo/domains/organization/integrations/sbbol/utils/getAccessTokenForUser')
const { User } = require('@condo/domains/user/utils/serverSchema')


const SBBOL_AUTH_CONFIG = conf.SBBOL_AUTH_CONFIG ? JSON.parse(conf.SBBOL_AUTH_CONFIG) : {}

/**
 * Changing of a client secret is performed daily for security reasons
 * Previously we were comparing current time with `clientSecretExpiresAt` and decided, whether change is needed.
 */
const refreshSbbolClientSecret = createCronTask('refreshSbbolClientSecret', '0 1 * * *', async () => {
    const sbbolSecretStorage = getSbbolSecretStorage()
    const sbbolSecretStorageExtended = getSbbolSecretStorage(true)

    const { keystone: context } = getSchemaCtx('User')

    const serviceUserId = get(SBBOL_AUTH_CONFIG, 'serviceUserId')
    const serviceOrganizationId = get(SBBOL_AUTH_CONFIG, 'serviceOrganizationId')

    if (!serviceUserId) throw new Error('changeClientSecret: no SBBOL_AUTH_CONFIG.serviceUserId')
    if (!serviceOrganizationId) throw new Error('changeClientSecret: no SBBOL_AUTH_CONFIG.serviceOrganizationId')

    const user = await User.getOne(context, { id: serviceUserId })
    if (!user) {
        throw new Error(`Not found service User with id=${serviceUserId} to change Client Secret for SBBOL integration`)
    }

    const { accessToken } = await getAccessTokenForUser(user.id, serviceOrganizationId)

    await changeClientSecret({
        clientId: sbbolSecretStorage.clientId,
        currentClientSecret: await sbbolSecretStorage.getClientSecret(),
        newClientSecret: passwordGenerator.generate({
            length: 8,
            numbers: true,
        }),
        accessToken,
        useExtendedConfig: false,
    })
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
