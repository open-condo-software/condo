const path = require('path')

const { prepareKeystoneExpressApp } = require('@open-condo/keystone/prepareKeystoneApp')

const { AcquiringIntegration, AcquiringIntegrationAccessRight } = require('@condo/domains/acquiring/utils/serverSchema')
const { SERVICE } = require('@condo/domains/user/constants/common')
const { User } = require('@condo/domains/user/utils/serverSchema')

function getJson (data) {
    try {
        return JSON.parse(data)
    } catch (e) {
        return null
    }
}

async function main (args) {
    const [name, integrationOptions = '{}', accessRightServiceUserEmail = null] = args
    if (!name) throw new Error('use: create-acquiring-integration <name> [<options>] [<accessRightServiceUserEmail>]')
    const parsedIntegrationOptions = getJson(integrationOptions)
    if (integrationOptions && !parsedIntegrationOptions) throw new Error('<options> argument should be a valid json object')

    const integrationPayload = parsedIntegrationOptions || {}

    const { keystone: context } = await prepareKeystoneExpressApp(path.resolve('./index.js'), { excludeApps: ['NextApp', 'AdminUIApp'] })

    const dv = 1
    const sender = { 'dv': 1, 'fingerprint': 'create-acquiring-integration-script' }

    console.info(`NAME: ${name}`)
    const existingIntegration = await AcquiringIntegration.getOne(context, { name })
    integrationPayload.dv ??= dv
    integrationPayload.sender ??= sender

    let integrationId

    if (existingIntegration) {
        await AcquiringIntegration.update(context, existingIntegration.id, integrationPayload, 'id')
        console.info('AcquiringIntegration updated!')
        integrationId = existingIntegration.id
    } else {
        integrationPayload.name = name
        const integration = await AcquiringIntegration.create(context, integrationPayload, 'id')
        console.info('AcquiringIntegration created!')
        integrationId = integration.id
    }

    if (accessRightServiceUserEmail) {
        const integrationUser = await User.getOne(context, { type: SERVICE, email: accessRightServiceUserEmail, deletedAt: null })
        const [integrationAccessRight] = await AcquiringIntegrationAccessRight.getAll(context, { integration: { id: integrationId }, user: { id: integrationUser.id } })

        if (!integrationAccessRight && !!integrationUser) {
            await AcquiringIntegrationAccessRight.create(context, {
                dv,
                sender,
                integration: { connect: { id: integrationId } },
                user: { connect: { id: integrationUser.id } },
            })
        }
    }

    // This output must be the last one
    // Do not delete this output, it is used by the script
    console.log(integrationId)
}

main(process.argv.slice(2)).then(
    () => process.exit(),
    (error) => {
        console.error(error)
        process.exit(1)
    },
)
