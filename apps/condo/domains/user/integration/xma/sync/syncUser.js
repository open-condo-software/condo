const { GQLError } = require('@open-condo/keystone/errors')

const { XMA_IDP_TYPE } = require('@condo/domains/user/constants/identityProviders')
const { ERRORS } = require('@condo/domains/user/integration/xma/utils/errors')
const {
    UserExternalIdentity,
} = require('@condo/domains/user/utils/serverSchema')

const dv = 1
const sender = { dv, fingerprint: 'user-external-identity-router' }

const linkUser = async (context, user, xmaAuthData, userType) => {
    await UserExternalIdentity.create(context, {
        dv,
        sender,
        user: { connect: { id: user.id } },
        identityId: xmaAuthData.id,
        identityType: XMA_IDP_TYPE,
        userType,
        meta: xmaAuthData,
    })

    return user
}

const getIdentity = async (context, userInfo, userType) => {
    return UserExternalIdentity.getOne(context, {
        identityType: XMA_IDP_TYPE,
        identityId: userInfo.id,
        // TODO DOMA-5239 remove this parameter. We should by default have only not deleted objects
        deletedAt: null,
        userType,
    }, 'id user { id } userType')
}

const syncUser = async ({ authenticatedUser, context, userInfo, userType }) => {
    if (authenticatedUser?.deletedAt) {
        throw new GQLError(ERRORS.USER_IS_NOT_REGISTERED, context)
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
            throw new GQLError(ERRORS.ACCESS_DENIED, context)
        }
        return { id }
    }

    // case 3: user is not registered, and we can't register account for him with xma
    if (!authenticatedUser) {
        throw new GQLError(ERRORS.USER_IS_NOT_REGISTERED, context)
    }

    // case 4: user already registered and have no linked identity
    if (authenticatedUser.type !== userType) {
        throw new GQLError(ERRORS.NOT_SUPPORTED_USER_TYPE, context)
    }
    if (authenticatedUser.isAdmin || authenticatedUser.isSupport || authenticatedUser.rightsSet) {
        throw new GQLError(ERRORS.SUPER_USERS_NOT_ALLOWED, context)
    }
    // proceed link & auth
    return await linkUser(context, authenticatedUser, userInfo, userType)
}

module.exports = {
    syncUser,
    getIdentity,
}
