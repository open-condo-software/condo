const { generateUUIDv4 } = require('@open-condo/miniapp-utils')

const { normalizeEmail } = require('@condo/domains/common/utils/mail')
const { normalizePhone } = require('@condo/domains/common/utils/phone')
const { SBER_ID_IDP_TYPE } = require('@condo/domains/user/constants/identityProviders')
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
        identityType: SBER_ID_IDP_TYPE,
        userType,
        meta: userInfo,
    })

    return user
}

const registerUser = async (context, userInfo, userType) => {
    // prepare data
    const normalizedPhone = normalizePhone(userInfo.phoneNumber)
    const normalizedEmail = normalizeEmail(userInfo.email)
    const password = generateUUIDv4()

    // validate that email is not picked up
    if (normalizedEmail) {
        const existed = await User.getOne(context, { email: normalizedEmail, type: userType })
        if (existed) {
            throw new Error(`User with email ${normalizedEmail} already exists`)
        }
    }

    // prepare userData
    const userData = {
        password,
        email: normalizedEmail,
        phone: normalizedPhone,
        isPhoneVerified: Boolean(normalizedPhone),
        isEmailVerified: Boolean(normalizedEmail),
        type: userType,
        sender,
        dv,
    }

    // create user
    const user = await User.create(context, userData)

    // proceed link
    return await linkUser(context, user, userInfo, userType)
}

const syncUser = async ({ context, userInfo, userType }) => {
    // try to find linked identities
    const userIdentity = await UserExternalIdentity.getOne(context, {
        identityType: SBER_ID_IDP_TYPE,
        identityId: userInfo.id,
        userType,
        // TODO DOMA-5239 remove this parameter. We should by default have only not deleted objects
        deletedAt: null,
    }, 'id user { id }')

    // now we have the following cases:
    // 1. user already registered and have linked identity
    // 2. user already registered and have no linked identity
    // 3. user not registered

    // case 1: user already registered and have linked identity
    if (userIdentity) {
        const { user: { id } } = userIdentity
        return { id }
    }

    // case 2: user already registered and have no linked identity
    const existed = await User.getOne(context, {
        phone: normalizePhone(userInfo.phoneNumber), type: userType,
    })
    if (existed) {
        // proceed link & auth
        return await linkUser(context, existed, userInfo, userType)
    }

    // 3. user not registered
    return await registerUser(context, userInfo, userType)
}

module.exports = {
    syncUser,
}