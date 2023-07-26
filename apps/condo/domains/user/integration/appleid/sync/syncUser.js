const { get, isNil } = require('lodash')

const { APPLE_ID_IDP_TYPE } = require('@condo/domains/user/constants/common')
const {
    User,
    UserExternalIdentity,
} = require('@condo/domains/user/utils/serverSchema')

const dv = 1
const sender = { dv, fingerprint: 'user-external-identity-router' }

const linkUser = async (context, user, userInfo) => {
    await UserExternalIdentity.create(context, {
        dv,
        sender,
        user: { connect: { id: user.id } },
        identityId: userInfo.id,
        identityType: APPLE_ID_IDP_TYPE,
        meta: userInfo,
    })

    return user
}

const syncUser = async ({ context, userInfo, userType, authedUserId }) => {
    // try to find linked identities
    const userIdentities = await UserExternalIdentity.getAll(context, {
        identityType: APPLE_ID_IDP_TYPE,
        identityId: userInfo.id,
        deletedAt: null,
    })

    // now we have the following cases:
    // 1. user already registered and have linked identity
    // 2. user already registered and have no linked identity (linking case)
    // 3. user not registered - do nothing

    // case 1: user already registered and have linked identity
    if (isNil(authedUserId) && userIdentities.length > 0) {
        const [identity] = userIdentities
        const { user: { id } } = identity
        return { id }
    } else if (!isNil(authedUserId)
        && userIdentities.length > 0
        && get(userIdentities, '[0].user.id') !== authedUserId) {
        throw new Error('AppleId already linked to another user')
    } else if (!isNil(authedUserId) && userIdentities.length > 0) {
        const [identity] = userIdentities
        const { user: { id } } = identity
        return { id }
    }

    // case 2: user already registered and have no linked identity
    if (!isNil(authedUserId)) {
        const existed = await User.getOne(context, {
            id: authedUserId, type: userType, deletedAt: null,
        })
        if (!isNil(existed)) {
            // proceed link & auth
            return await linkUser(context, existed, userInfo)
        }
    }
}

module.exports = {
    syncUser,
}