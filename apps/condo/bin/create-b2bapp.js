/**
 * Arguments:
 * yarn workspace @app/condo node ./bin/create-b2bapp.js <name> <options> <appName> <accessRight>
 * 
 * <name> - String. Name of the b2bapp
 * <options> - JSON. Options for the b2bapp
 * <appName> - String. Name of the app to update CONDO_B2B_APP_ID
 * <accessRight> - JSON. Access right for the b2bapp
 */

const path = require('path')

const { faker } = require('@faker-js/faker')

const { updateAppEnvFile } = require('@open-condo/cli')
const { prepareKeystoneExpressApp } = require('@open-condo/keystone/prepareKeystoneApp')

const { B2BApp, B2BAppAccessRightSet, B2BAppAccessRight } = require('@condo/domains/miniapp/utils/serverSchema')
const { SERVICE } = require('@condo/domains/user/constants/common')
const { User } = require('@condo/domains/user/utils/serverSchema')

function getJson (data) {
    try {
        return JSON.parse(data)
    } catch (e) {
        return undefined
    }
}

async function main (args) {
    const [b2bAppName, options, appName, accessRight] = args
    let optionsJson = getJson(options)
    if (!b2bAppName) throw new Error('use: create-b2bapp <name> [<options>]')
    if (options && !optionsJson) throw new Error('<options> argument should be a valid json')
    if (options && !optionsJson.appUrl) throw new Error('<options> argument should have appUrl key')
    const json = optionsJson || {}

    const { keystone: context } = await prepareKeystoneExpressApp(path.resolve('./index.js'), { excludeApps: ['NextApp', 'AdminUIApp'] })

    console.info(`NAME: ${b2bAppName}`)
    let b2bAppId
    const [b2bApp] = await B2BApp.getAll(
        context,
        { name: b2bAppName },
        'id',
        { first: 1, sortBy: ['createdAt_DESC'] }
    )
    if (!json.dv) json.dv = 1
    if (!json.sender) json.sender = { 'dv': 1, 'fingerprint': 'create-b2bapp-script' }
    if (!b2bApp) {
        if (!json.contextDefaultStatus) json.contextDefaultStatus = 'Finished'
        if (!json.category) json.category = 'OTHER'
        if (!json.developer) json.developer = 'InternalDeveloper'
        if (!json.shortDescription) json.shortDescription = faker.commerce.productDescription()
        if (!json.detailedDescription) json.detailedDescription = faker.lorem.paragraphs(5)

        const b2bApp = await B2BApp.create(context, {
            name: b2bAppName, ...json,
        })
        b2bAppId = b2bApp.id
        console.info('B2BApp created!')
    } else {
        await B2BApp.update(context, b2bApp.id, json)
        b2bAppId = b2bApp.id
        console.info('B2BApp updated!')
    }

    if (appName) {
        await updateAppEnvFile(appName, 'CONDO_B2B_APP_ID', b2bAppId)
    }

    if (accessRight) {
        const accessRightJson = getJson(accessRight)

        const { serviceUserEmail, serviceUserAccessRightSetData } = accessRightJson
        if (!!serviceUserEmail && !!serviceUserAccessRightSetData) {
            const dvSender = {
                dv: 1,
                sender: { dv: 1, fingerprint: json.sender.fingerprint },
            }

            const serviceUser = await User.getOne(context, { type: SERVICE, email: serviceUserEmail, deletedAt: null })
            if (!serviceUser) throw new Error(`Service user with email ${serviceUserEmail} not found`)

            let accessRightSetId
            const accessRightSet = await B2BAppAccessRightSet.getOne(context, { app: { id: b2bAppId } })
            if (accessRightSet) {
                await B2BAppAccessRightSet.update(context, accessRightSet.id, {
                    ...serviceUserAccessRightSetData,
                    ...dvSender,
                })
                accessRightSetId = accessRightSet.id
            } else {
                const createdAccessRightSet = await B2BAppAccessRightSet.create(context, {
                    app: { connect: { id: b2bAppId } },
                    name: `${b2bAppName} access right set`,
                    ...serviceUserAccessRightSetData,
                    ...dvSender,
                })
                accessRightSetId = createdAccessRightSet.id
                console.info(`B2BAppAccessRightSet created! id=${accessRightSetId}`)
            }

            const accessRight = await B2BAppAccessRight.getOne(context, { app: { id: b2bAppId }, user: { id: serviceUser.id } })
            if (accessRight) {
                await B2BAppAccessRight.update(context, accessRight.id, {
                    ...dvSender,
                    accessRightSet: { connect: { id: accessRightSetId } },
                })
            } else {
                const { id } = await B2BAppAccessRight.create(context, {
                    ...dvSender,
                    user: { connect: { id: serviceUser.id } },
                    app: { connect: { id: b2bAppId } },
                    accessRightSet: { connect: { id: accessRightSetId } },
                })
                console.info(`B2BAppAccessRight created! id=${id}`)
            }
        }
    }
}

main(process.argv.slice(2)).then(
    () => process.exit(),
    (error) => {
        console.error(error)
        process.exit(1)
    },
)
