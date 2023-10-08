const path = require('path')

const { getRandomString, prepareKeystoneExpressApp } = require('@open-condo/keystone/test.utils')

const { User } = require('@miniapp/domains/condo/utils/serverSchema')

function getJson (data) {
    try {
        return JSON.parse(data)
    } catch (e) {
        return undefined
    }
}

async function main (args) {
    const [email, options] = args
    let optionsJson = getJson(options)
    if (!email || !email.includes('@')) throw new Error('use: create-user <email> [<options>]')
    if (options && !optionsJson) throw new Error('<options> argument should be a valid json')
    const json = optionsJson || {}

    const { keystone: context } = await prepareKeystoneExpressApp(path.resolve('./index.js'), { excludeApps: ['NextApp', 'AdminUIApp'] })

    console.info(`EMAIL: ${email}`)
    const user = await User.getOne(context, { email })
    if (!json.dv) json.dv = 1
    if (!json.sender) json.sender = { 'dv': 1, 'fingerprint': 'create-user-script' }
    if (!user) {
        if (!json.password) {
            json.password = getRandomString()
            console.info(`PASSWORD: ${json.password}`)
        }
        if (!json.name) json.name = email.split('@')[0]
        await User.create(context, {
            email, ...json,
        })
        console.info('User created!')
    } else {
        await User.update(context, user.id, json)
        console.info('User updated!')
    }
}

main(process.argv.slice(2)).then(
    () => process.exit(),
    (error) => {
        console.error(error)
        process.exit(1)
    },
)
