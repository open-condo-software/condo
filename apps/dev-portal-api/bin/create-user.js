const path = require('path')

const { faker } = require('@faker-js/faker')

const { prepareKeystoneExpressApp } = require('@open-condo/keystone/prepareKeystoneApp')

const { User } = require('@dev-portal-api/domains/user/utils/serverSchema')

const BASIC_PHONE_REGEX = /^\+\d+$/

function getJSON (opts) {
    try {
        return JSON.parse(opts)
    } catch {
        return undefined
    }
}

async function main (args) {
    const [phone, opts] = args
    const parsedOpts = getJSON(opts)
    if (!phone || !BASIC_PHONE_REGEX.test(phone)) throw new Error('use: create-user <phone> [<options>]')
    if (opts && (!parsedOpts || Array.isArray(parsedOpts) || typeof parsedOpts !== 'object')) throw new Error('<options> argument should be a valid json object')

    const { keystone: context } = await prepareKeystoneExpressApp(path.resolve('./index.js'), { excludeApps: ['AdminUIApp'] })
    console.info(`PHONE: ${phone}`)
    const existingUser = await User.getOne(context, { phone })
    parsedOpts.dv ??= 1
    parsedOpts.sender ??= { 'dv': 1, 'fingerprint': 'create-user-script' }
    if (!existingUser) {
        parsedOpts.password ??= faker.internet.password()
        parsedOpts.name ??= 'Default User'
        await User.create(context, {
            phone,
            ...parsedOpts,
        })
    } else {
        await User.update(context, existingUser.id, parsedOpts)
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