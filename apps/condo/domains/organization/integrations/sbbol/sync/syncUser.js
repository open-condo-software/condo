const { CREATE_ONBOARDING_MUTATION } = require('@condo/domains/onboarding/gql.js')
const { getItems, createItem, updateItem } = require('@keystonejs/server-side-graphql-client')
const { MULTIPLE_ACCOUNTS_MATCHES } = require('@condo/domains/user/constants/errors')

const createOnboarding = async ({ keystone, user, dvSenderFields }) => {
    const userContext = await keystone.createContext({
        authentication: {
            item: user,
            listKey: 'User',
        },
    })
    await userContext.executeGraphQL({
        context: userContext,
        query: CREATE_ONBOARDING_MUTATION,
        variables: {
            data: {
                ...dvSenderFields,
                type: 'ADMINISTRATOR',
                userId: user.id,
            },
        },
    })
}

/**
 * Creates or updates user, according to data from SBBOL
 *
 * @param {KeystoneContext} context
 * @param {UserInfo} userInfo
 * @param dvSenderFields
 * @return {Promise<{importId}|*>}
 */
const syncUser = async ({ context, userInfo, dvSenderFields }) => {
    const returnFields = 'id phone name importId importRemoteSystem'
    const importFields = {
        importId: userInfo.importId,
        importRemoteSystem: userInfo.importRemoteSystem,
    }
    const existingUsers = await getItems({
        ...context,
        listKey: 'User',
        where: {
            OR: [
                { phone: userInfo.phone },
                { AND: importFields },
            ],
        },
        returnFields,
    })

    if (existingUsers.length > 1) {
        throw new Error(`${MULTIPLE_ACCOUNTS_MATCHES}] importId and phone conflict on user import`)
    }

    if (existingUsers.length === 0) {
        const user = await createItem({
            listKey: 'User',
            item: userInfo,
            returnFields,
            ...context,
        })
        await createOnboarding({ keystone: context.keystone, user, dvSenderFields })
        return user
    }

    const [user] = existingUsers

    if (!user.importId) {
        const { email, phone } = userInfo
        const update = {}
        if (!user.isEmailVerified && user.email === email) {
            update.isEmailVerified = true
        }
        if (!user.isPhoneVerified && user.phone === phone) {
            update.isPhoneVerified = true
        }
        if (!user.email) {
            user.email = email
        }
        const updatedUser = await updateItem({
            listKey: 'User',
            item: {
                id: user.id,
                data: {
                    ...update,
                    ...importFields,
                },
            },
            returnFields: returnFields,
            ...context,
        })
        return updatedUser
    }
    await createOnboarding( { keystone: context.keystone, user, dvSenderFields })
    return user
}

module.exports = {
    syncUser,
}