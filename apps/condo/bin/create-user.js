const path = require('path')

const { prepareKeystoneExpressApp } = require('@open-condo/keystone/prepareKeystoneApp')
const { getRandomString } = require('@open-condo/keystone/test.utils')

const { User, UserRightsSet } = require('@condo/domains/user/utils/serverSchema')

function getJson (data) {
    try {
        return JSON.parse(data)
    } catch (e) {
        return undefined
    }
}

async function main (args) {
    const [email, userOptions, rightsSet] = args
    if (!email || !email.includes('@')) throw new Error('use: create-user <email> [<options>] [<rightsSet>]')
    const parsedUserOptions = getJson(userOptions)
    if (userOptions && !parsedUserOptions) throw new Error('<options> argument should be a valid json object')
    const parsedRightsSet = getJson(rightsSet)
    if (rightsSet && !parsedRightsSet) throw new Error('<rightsSet> argument should be a valid json object')

    const userPayload = parsedUserOptions || {}

    const { keystone: context } = await prepareKeystoneExpressApp(path.resolve('./index.js'), { excludeApps: ['NextApp', 'AdminUIApp'] })

    const userData = { id: null, email, password: userPayload.password ?? null }

    const existingUser = await User.getOne(context, { email })
    userPayload.dv ??= 1
    userPayload.sender ??= { 'dv': 1, 'fingerprint': 'create-user-script' }
    let rightSetId

    if (!existingUser) {
        if (!userPayload.password) {
            userPayload.password = getRandomString()
            userData.password = userPayload.password
        }
        userPayload.name ??= email.split('@')[0]
        const user = await User.create(context, {
            email,
            ...userPayload,
        }, 'id rightsSet { id }')
        userData.id = user.id
        if (user.rightsSet) {
            rightSetId = user.rightsSet.id
        }
    } else {
        const user = await User.update(context,
            existingUser.id,
            userPayload,
            'id rightsSet { id }'
        )
        userData.id = existingUser.id
        if (user.rightsSet) {
            rightSetId = user.rightsSet.id
        }
    }

    if (parsedRightsSet) {
        const rightSetPayload = {
            dv: 1,
            sender: { dv: 1, fingerprint: 'create-user-script' },
            ...parsedRightsSet,
        }
        if (rightSetId) {
            await UserRightsSet.update(context, rightSetId, rightSetPayload)
        } else {
            await User.update(context, userData.id, {
                dv: 1,
                sender: { dv: 1, fingerprint: 'create-user-script' },
                rightsSet: {
                    create: rightSetPayload,
                },
            })
        }
    }

    // NOTE: DON'T CHANGE OUTPUT OR IT WILL BREAK RELYING PREPARE SCRIPTS
    console.log(JSON.stringify(userData))
}

main(process.argv.slice(2)).then(
    () => process.exit(),
    (error) => {
        console.error(error)
        process.exit(1)
    },
)
