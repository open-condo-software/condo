const path = require('path')

const { faker } = require('@faker-js/faker')

const { prepareKeystoneExpressApp } = require('@open-condo/keystone/test.utils')

const { User } = require('@dev-api/domains/user/utils/serverSchema')

function getJSON (opts) {
    try {
        return JSON.parse(opts)
    } catch {
        return undefined
    }
}

async function main (args) {
    const [email, opts] = args
    const parsedOpts = getJSON(opts)
    if (!email || !email.includes('@')) throw new Error('use: create-user <email> [<options>]')
    if (opts && (!parsedOpts || Array.isArray(parsedOpts) || typeof parsedOpts !== 'object')) throw new Error('<options> argument should be a valid json object')

    const { keystone: context } = await prepareKeystoneExpressApp(path.resolve('./index.js'), { excludeApps: ['AdminUIApp'] })
    console.info(`EMAIL: ${email}`)
    const existingUser = await User.getOne(context, { email })
    parsedOpts.dv ??= 1
    parsedOpts.sender ??= { 'dv': 1, 'fingerprint': 'create-user-script' }
    if (!existingUser) {
        parsedOpts.password ??= faker.internet.password()
        parsedOpts.name ??= email.split('@')['0']
        await User.create(context, {
            email,
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