const { COUNTRIES, RUSSIA_COUNTRY } = require('@condo/domains/common/constants/countries')
const { REGISTER_NEW_USER_MESSAGE_TYPE } = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { CREATE_ONBOARDING_MUTATION } = require('@condo/domains/onboarding/gql.js')
const { SBBOL_IDP_TYPE, STAFF } = require('@condo/domains/user/constants/common')
const { MULTIPLE_ACCOUNTS_MATCHES } = require('@condo/domains/user/constants/errors')
const { User, UserExternalIdentity } = require('@condo/domains/user/utils/serverSchema')
const { UserAdmin } = require('@condo/domains/user/utils/serverSchema')

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

    const [ existingUser ] = await User.getAll(context, { email, id_not: userIdToExclude })

    if (existingUser && existingUser.id !== userIdToExclude) {
        await User.update(context, existingUser.id, {
            email: null,
            ...dvSenderFields,
        })
    }
}

const registerIdentity = async ({ context, user, identityId }) => {
    await UserExternalIdentity.create(context, {
        ...dvSenderFields,
        user: { connect: { id: user.id } },
        identityId,
        identityType: SBBOL_IDP_TYPE,
        meta: {},
    })
}

/**
 * Creates or updates user, according to data from SBBOL
 *
 * @param {KeystoneContext} context
 * @param {UserInfo} userInfo
 * @param {identityId} identityId
 * @param dvSenderFields
 * @return {Promise<{user}|*>}
 */
const syncUser = async ({ context: { context, keystone }, userInfo, identityId }) => {
    // TODO(VKislov): DOMA-5239 Should not receive deleted instances with admin context
    const identityWhereStatement = {
        identityId,
        identityType: SBBOL_IDP_TYPE,
        deletedAt: null,
    }
    const userWhereStatement = {
        type: STAFF,
        phone: userInfo.phone,
    }

    // let's search users by UserExternalIdentity and phone
    const importedUsers = (await UserExternalIdentity.getAll(context, identityWhereStatement))
        .map(identity => identity.user)
    const notImportedUsers = await User.getAll(context, {
        ...userWhereStatement,
        id_not_in: importedUsers.map(identity => identity.id),
    })

    const existingUsers = [...notImportedUsers, ...importedUsers]
    const existingUsersCount = existingUsers.length

    if (existingUsersCount > 1) {
        throw new Error(`${MULTIPLE_ACCOUNTS_MATCHES}] identityId and phone conflict on user import`)
    }

    // no users found by external identity and phone number
    if (existingUsersCount === 0) {
        // user not exists case
        if (userInfo.email) {
            await cleanEmailForAlreadyExistingUserWithGivenEmail({ email: userInfo.email, context })
        }

        // create a user
        const createdUser = await User.create(context, { ...userInfo, ...dvSenderFields })
        const user = await UserAdmin.getOne(context, { id: createdUser.id })
        
        // register a UserExternalIdentity
        await registerIdentity({
            context, user, identityId,
        })

        // SBBOL works only in Russia, another languages does not need t
        const lang = COUNTRIES[RUSSIA_COUNTRY].locale
        await sendMessage(context, {
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

        await createOnboarding({ keystone, user, dvSenderFields })

        return user
    }

    const [user] = existingUsers

    // user already registered by phone number, but not imported
    if (notImportedUsers.length > 0) {
        const { email, phone } = userInfo
        const updateInput = {}

        if (email) {
            await cleanEmailForAlreadyExistingUserWithGivenEmail({ email: userInfo.email, userIdToExclude: user.id, context })

            if (!user.isEmailVerified && user.email === email) {
                updateInput.isEmailVerified = true
            }

            if (!user.email || user.email !== email) {
                updateInput.email = email
            }
        }

        if (!user.isPhoneVerified && user.phone === phone) {
            updateInput.isPhoneVerified = true
        }

        const updatedUser = await User.update(context, user.id, {
            ...updateInput,
            ...dvSenderFields,
        })

        // create a UserExternalIdentity - since user wasn't imported - no identity was saved in db
        await registerIdentity({
            context, user, identityId,
        })

        return updatedUser
    }

    return await UserAdmin.getOne(context, { id: user.id })
}

module.exports = {
    syncUser,
}
