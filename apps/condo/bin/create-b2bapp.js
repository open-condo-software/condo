const path = require('path')

const { faker } = require('@faker-js/faker')

const { prepareKeystoneExpressApp } = require('@open-condo/keystone/prepareKeystoneApp')

const { B2BApp } = require('@condo/domains/miniapp/utils/serverSchema')

function getJson (data) {
    try {
        return JSON.parse(data)
    } catch (e) {
        return undefined
    }
}

async function main (args) {
    const [name, options] = args
    let optionsJson = getJson(options)
    if (!name) throw new Error('use: create-b2bapp <name> [<options>]')
    if (options && !optionsJson) throw new Error('<options> argument should be a valid json')
    if (options && !optionsJson.appUrl) throw new Error('<options> argument should have appUrl key')
    const json = optionsJson || {}

    const { keystone: context } = await prepareKeystoneExpressApp(path.resolve('./index.js'), { excludeApps: ['NextApp', 'AdminUIApp'] })

    console.info(`NAME: ${name}`)
    const [b2bapp] = await B2BApp.getAll(context, { name }, { first: 1, sortBy: ['createdAt_DESC'] })
    if (!json.dv) json.dv = 1
    if (!json.sender) json.sender = { 'dv': 1, 'fingerprint': 'create-b2bapp-script' }
    if (!b2bapp) {
        if (!json.contextDefaultStatus) json.contextDefaultStatus = 'Finished'
        if (!json.category) json.category = 'OTHER'
        if (!json.developer) json.developer = 'InternalDeveloper'
        if (!json.shortDescription) json.shortDescription = faker.commerce.productDescription()
        if (!json.detailedDescription) json.detailedDescription = faker.lorem.paragraphs(5)

        await B2BApp.create(context, {
            name, ...json,
        })
        console.info('B2BApp created!')
    } else {
        await B2BApp.update(context, b2bapp.id, json)
        console.info('B2BApp updated!')
    }
}

main(process.argv.slice(2)).then(
    () => process.exit(),
    (error) => {
        console.error(error)
        process.exit(1)
    },
)
