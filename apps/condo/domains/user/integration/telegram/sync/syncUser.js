const { TELEGRAM_IDP_TYPE } = require('@condo/domains/user/constants/common')
const { ERRORS, HttpError } = require('@condo/domains/user/integration/telegram/utils/errors')
const {
    UserExternalIdentity,
} = require('@condo/domains/user/utils/serverSchema')

const dv = 1
const sender = { dv, fingerprint: 'user-external-identity-router' }

const linkUser = async (context, user, tgAuthData, userType) => {
    await UserExternalIdentity.create(context, {
        dv,
        sender,
        user: { connect: { id: user.id } },
        identityId: tgAuthData.id,
        identityType: TELEGRAM_IDP_TYPE,
        userType,
        meta: tgAuthData,
    })

    return user
}

const registerUser = async (context, userInfo, userType) => {
    throw new Error('YOU CAN\'T REGISTER USER USING TELEGRAM ')
}

const getIdentity = async (context, userInfo, userType) => {
    return await UserExternalIdentity.getOne(context, {
        identityType: TELEGRAM_IDP_TYPE,
        identityId: userInfo.id,
        // TODO DOMA-5239 remove this parameter. We should by default have only not deleted objects
        deletedAt: null,
        userType,
    }, 'id user { id } userType')
}

const syncUser = async ({ authenticatedUser, context, userInfo, userType }) => {
    if (authenticatedUser?.deletedAt) {
        throw new HttpError(ERRORS.USER_IS_NOT_REGISTERED)
    }

    // try to find linked identities
    const userIdentity = await getIdentity(context, userInfo, userType)

    // now we have the following cases:
    // 1. user already registered and have linked identity
    // 2. user already registered, but identity linked to another user
    // 3. user already registered and have no linked identity
    // 4. user not registered

    // case 1: user already registered and have linked identity
    if (userIdentity) {
        const { user: { id } } = userIdentity
        if (authenticatedUser && (authenticatedUser.id !== id || authenticatedUser.type !== userIdentity.userType)) {
            throw new HttpError(ERRORS.ACCESS_DENIED)
        }
        return { id }
    }

    // case 3: user is not registered, and we can't register account for him with telegram
    if (!authenticatedUser) {
        throw new HttpError(ERRORS.USER_IS_NOT_REGISTERED)
    }

    // case 4: user already registered and have no linked identity
    if (authenticatedUser.type !== userType) {
        throw new HttpError(ERRORS.NOT_SUPPORTED_USER_TYPE)
    }
    if (authenticatedUser.isAdmin || authenticatedUser.isSupport || authenticatedUser.rightsSet) {
        throw new HttpError(ERRORS.SUPER_USERS_NOT_ALLOWED)
    }
    // proceed link & auth
    return await linkUser(context, authenticatedUser, userInfo, userType)
}

module.exports = {
    syncUser,
    getIdentity,
}