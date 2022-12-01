const { CREATE_ONBOARDING_MUTATION } = require('@condo/domains/onboarding/gql.js')
const { getItems, createItem, updateItem } = require('@keystonejs/server-side-graphql-client')
const { MULTIPLE_ACCOUNTS_MATCHES } = require('@condo/domains/user/constants/errors')
const { SBBOL_IDP_TYPE } = require('@condo/domains/user/constants/common')
const { registerUserExternalIdentity } = require('@condo/domains/user/utils/serverSchema')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { REGISTER_NEW_USER_MESSAGE_TYPE } = require('@condo/domains/notification/constants/constants')
const { COUNTRIES, RUSSIA_COUNTRY } = require('@condo/domains/common/constants/countries')
const { dvSenderFields } = require('../constants')

const createOnboarding = async ({ keystone, user }) => {
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
 * If another user will be found with given email, it will get email to null to avoid unique email violation constraint
 * It will be issue of inconvenience for that user, but since we does't have
 * a email validation, it will be not critical. We assume, that found user
 * representing the same person.
 * @param {String} email - search already existing user with this email
 * @param {String} userIdToExclude - ignore found user, that matches this id
 * @param context - Keystone context
 */
const cleanEmailForAlreadyExistingUserWithGivenEmail = async ({ email, userIdToExclude, context }) => {
    if (!email) throw new Error('email argument is not specified')
    const [ existingUser ] = await getItems({
        ...context,
        listKey: 'User',
        where: { email, id_not: userIdToExclude },
        returnFields: 'id type name email phone importId importRemoteSystem',
    })
    if (existingUser && existingUser.id !== userIdToExclude) {
        await updateItem({
            listKey: 'User',
            item: {
                id: existingUser.id,
                data: {
                    email: null,
                    ...dvSenderFields,
                },
            },
            returnFields: 'id',
            ...context,
        })
    }
}

const registerIdentity = async ({ context, user, userInfo }) => {
    await registerUserExternalIdentity(context.context, {
        ...dvSenderFields,
        user: { id: user.id },
        identityId: userInfo.importId,
        identityType: SBBOL_IDP_TYPE,
        meta: {},
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
const syncUser = async ({ context, userInfo }) => {
    const returnFields = 'id phone email name'
    const identityWhereStatement = {
        user: { type: 'staff' },
        identityId: userInfo.importId,
        identityType: SBBOL_IDP_TYPE,
    }
    const userWhereStatement = {
        type: 'staff',
        phone: userInfo.phone,
    }

    // let's search users by UserExternalIdentity and phone
    const importedUsers = (await getItems({
        ...context,
        listKey: 'UserExternalIdentity',
        where: identityWhereStatement,
        returnFields: `id user { ${returnFields} }`,
    })).map(identity => identity.user)
    const notImportedUsers = await getItems({
        ...context,
        listKey: 'User',
        where: {
            ...userWhereStatement,
            id_not_in: importedUsers.map(identity => identity.user.id),
        },
        returnFields,
    })
    const existingUsers = [...notImportedUsers, ...importedUsers]
    const existingUsersCount = existingUsers.length

    if (existingUsersCount > 1) {
        throw new Error(`${MULTIPLE_ACCOUNTS_MATCHES}] importId and phone conflict on user import`)
    }

    // no users found by external identity and phone number
    if (existingUsersCount === 0) {
        // user not exists case
        if (userInfo.email) {
            await cleanEmailForAlreadyExistingUserWithGivenEmail({ email: userInfo.email, context })
        }

        // create a user
        const user = await createItem({
            listKey: 'User',
            item: { ...userInfo, ...dvSenderFields },
            returnFields,
            ...context,
        })

        // register a UserExternalIdentity
        await registerIdentity({
            context, user, userInfo,
        })

        // SBBOL works only in Russia, another languages does not need t
        const lang = COUNTRIES[RUSSIA_COUNTRY].locale
        await sendMessage(context.context, {
            lang,
            to: {
                user: {
                    id: user.id,
                },
                phone: userInfo.phone,
            },
            type: REGISTER_NEW_USER_MESSAGE_TYPE,
            meta: {
                userPassword: userInfo.password,
                userPhone: userInfo.phone,
                dv: 1,
            },
            ...dvSenderFields,
        })

        await createOnboarding({ keystone: context.keystone, user, dvSenderFields })
        return user
    }

    const [user] = existingUsers

    // user already registered by phone number, but not imported
    if (notImportedUsers.length > 0) {
        const { email, phone } = userInfo
        const update = {}
        if (email) {
            await cleanEmailForAlreadyExistingUserWithGivenEmail({ email: userInfo.email, userIdToExclude: user.id, context })
            if (!user.isEmailVerified && user.email === email) {
                update.isEmailVerified = true
            }
            if (!user.email || user.email !== email) {
                update.email = email
            }
        }
        if (!user.isPhoneVerified && user.phone === phone) {
            update.isPhoneVerified = true
        }
        const updatedUser = await updateItem({
            listKey: 'User',
            item: {
                id: user.id,
                data: {
                    ...update,
                    ...dvSenderFields,
                },
            },
            returnFields,
            ...context,
        })

        // create a UserExternalIdentity - since user wasn't imported - no identity was saved in db
        await registerIdentity({
            context, user, userInfo,
        })

        return updatedUser
    }
    return user
}

module.exports = {
    syncUser,
}