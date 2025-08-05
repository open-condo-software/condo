const { get, isNil } = require('lodash')

const { APPLE_ID_IDP_TYPE } = require('@condo/domains/user/constants/identityProviders')
const {
    User,
    UserExternalIdentity,
} = require('@condo/domains/user/utils/serverSchema')

const dv = 1
const sender = { dv, fingerprint: 'user-external-identity-router' }

const linkUser = async (context, user, userInfo, userType) => {
    await UserExternalIdentity.create(context, {
        dv,
        sender,
        user: { connect: { id: user.id } },
        identityId: userInfo.id,
        identityType: APPLE_ID_IDP_TYPE,
        userType,
        meta: userInfo,
    })

    return user
}

const syncUser = async ({ context, userInfo, userType, authedUserId }) => {
    // try to find linked identities
    const userIdentity = await UserExternalIdentity.getOne(context, {
        identityType: APPLE_ID_IDP_TYPE,
        identityId: userInfo.id,
        userType,
        deletedAt: null,
    }, 'id user { id }')

    // now we have the following cases:
    // 1. user already registered and have linked identity
    // 2. user already registered and have no linked identity (linking case)
    // 3. user not registered - do nothing

    // case 1: user already registered and have linked identity
    if (isNil(authedUserId) && userIdentity) {
        const { user: { id } } = userIdentity
        return { id }
    } else if (!isNil(authedUserId)
        && userIdentity
        && get(userIdentity, 'user.id') !== authedUserId) {
        throw new Error('AppleId already linked to another user')
    } else if (!isNil(authedUserId) && userIdentity) {
        const { user: { id } } = userIdentity
        return { id }
    }

    // case 2: user already registered and have no linked identity
    if (!isNil(authedUserId)) {
        const existed = await User.getOne(context, {
            id: authedUserId, type: userType, deletedAt: null,
        })
        if (!isNil(existed)) {
            // proceed link & auth
            return await linkUser(context, existed, userInfo, userType)
        }
    }
}

module.exports = {
    syncUser,
}