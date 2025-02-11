const { v4: uuid } = require('uuid')

const { normalizePhone } = require('@condo/domains/common/utils/phone')
const { TELEGRAM_IDP_TYPE } = require('@condo/domains/user/constants/common')
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
        identityId: String(userInfo.userId),
        identityType: TELEGRAM_IDP_TYPE,
        meta: userInfo,
    })

    return user
}

const registerUser = async (context, userInfo, userType) => {
    const normalizedPhone = normalizePhone(userInfo.phoneNumber)
    const password = uuid()

    const userData = {
        password,
        phone: normalizedPhone,
        isPhoneVerified: Boolean(normalizedPhone),
        type: userType,
        name: userInfo.firstName,
        sender,
        dv,
    }

    const user = await User.create(context, userData)

    return await linkUser(context, user, userInfo)
}

const syncUser = async ({ context, userInfo, userType }) => {
    const userIdentities = await UserExternalIdentity.getAll(context, {
        identityType: TELEGRAM_IDP_TYPE,
        identityId: String(userInfo.userId),
        deletedAt: null,
    }, 'id user { id }')

    if (userIdentities.length > 0) {
        const [identity] = userIdentities
        const { user: { id } } = identity
        return { id }
    }

    const existed = await User.getOne(context, {
        phone: normalizePhone(userInfo.phoneNumber), type: userType,
    })

    if (existed) {
        return await linkUser(context, existed, userInfo)
    }

    return await registerUser(context, userInfo, userType)
}

module.exports = {
    syncUser,
}