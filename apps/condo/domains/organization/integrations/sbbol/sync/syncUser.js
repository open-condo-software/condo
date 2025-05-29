const { SBBOL_IDP_TYPE, STAFF } = require('@condo/domains/user/constants/common')
const { MULTIPLE_ACCOUNTS_MATCHES } = require('@condo/domains/user/constants/errors')
const { User, UserExternalIdentity } = require('@condo/domains/user/utils/serverSchema')

const { dvSenderFields } = require('../constants')


/**
 * If another user will be found with given email, it will get email to null to avoid unique email violation constraint
 * It will be an issue of inconvenience for that user, but since we do not have
 * an email validation, it will be not critical. We assume, that found user
 * is the same person.
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

const USER_FIELDS = 'id name phone'

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
    const identityWhereStatement = {
        identityId,
        identityType: SBBOL_IDP_TYPE,
        deletedAt: null,
    }
    const userWhereStatement = {
        type: STAFF,
        phone: userInfo.phone,
        deletedAt: null,
    }

    // let's search users by UserExternalIdentity and phone
    const importedUsers = (await UserExternalIdentity.getAll(context,
        identityWhereStatement,
        'id user { id email isEmailVerified isPhoneVerified phone }'
    )).map(identity => identity.user)

    const notImportedUsers = await User.getAll(context, {
        ...userWhereStatement,
        id_not_in: importedUsers.map(identity => identity.id),
    }, 'id email isEmailVerified isPhoneVerified phone')

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
        const user = await User.getOne(context, { id: createdUser.id }, USER_FIELDS)
        
        // register a UserExternalIdentity
        await registerIdentity({
            context, user, identityId,
        })

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
        }, USER_FIELDS)

        // create a UserExternalIdentity - since user wasn't imported - no identity was saved in db
        await registerIdentity({
            context, user, identityId,
        })

        return updatedUser
    }

    return await User.getOne(context, { id: user.id }, USER_FIELDS)
}

module.exports = {
    syncUser,
}
