const get = require('lodash/get')
const { z } = require('zod')

const { GQLError } = require('@open-condo/keystone/errors')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { normalizeEmail } = require('@condo/domains/common/utils/mail')
const { RESIDENT, STAFF } = require('@condo/domains/user/constants/common')
const { ERRORS } = require('@condo/domains/user/integration/passport/errors')
const {
    User,
    UserExternalIdentity,
} = require('@condo/domains/user/utils/serverSchema')

const { fieldMappingSchema } = require('./config')

const DV_AND_SENDER = { dv: 1, sender: { dv: 1, fingerprint: 'passport' } }
const ALLOWED_USER_TYPES = [RESIDENT, STAFF]

/**
 * That's the most common naming practices in OAuth 2.0 / OIDC world:
 * SRC: [
 *     'https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims',
 *     'https://developer.okta.com/docs/api/oauth2',
 *     'https://community.auth0.com/t/how-to-get-phone-number-verified/32740',
 *     'https://learn.microsoft.com/en-us/entra/identity-platform/scopes-oidc',
 * ]
 */
const DEFAULT_USER_FIELDS_MAPPING = {
    id: 'sub',
    name: 'name',
    phone: 'phone_number',
    isPhoneVerified: 'phone_number_verified',
    email: 'email',
    isEmailVerified: 'email_verified',
}

const USER_FIELDS = 'id type name phone isPhoneVerified email isEmailVerified deletedAt meta isAdmin isSupport rightsSet { id }'

const userSchema = z.object({
    id: z.union([z.string(), z.int().nonnegative()]).transform(val => String(val)),
    name: z.string().optional().default(null),
    phone: z.e164().optional().default(null),
    isPhoneVerified: z.boolean().optional().default(true),
    email: z.email().optional().default(null),
    isEmailVerified: z.boolean().optional().default(true),
}).strict()

const providerInfoSchema = z.object({
    name: z.string(),
    trustEmail: z.boolean(),
    trustPhone: z.boolean(),
})

function _ensureUser (foundUser, userType, errorContext) {
    if (!foundUser) return
    // NOTE: hard coded fields used a strong guard!
    for (const field of [
        'id',
        'type',
        'deletedAt',
        'name',
        'phone',
        'isPhoneVerified',
        'email',
        'isEmailVerified',
        'isSupport',
        'isAdmin',
        'rightsSet',
        'meta',
    ]) {
        if (!Object.hasOwn(foundUser, field)) {
            throw new GQLError(ERRORS.INVALID_USER_SHAPE, errorContext, [new Error(`field ${field} was not requested`)])
        }
    }
    if (foundUser.deletedAt) {
        throw new GQLError(ERRORS.INVALID_USER_SHAPE, errorContext, [new Error('user is deleted')])
    }
    if (userType !== foundUser.type) {
        throw new GQLError(ERRORS.INVALID_USER_SHAPE, errorContext, [new Error(`user type mismatch. requested: ${userType}, got: ${foundUser.type}`)])
    }
}

function _isSuperUser (user) {
    return user.isSupport || user.isAdmin || user.rightsSet
}

async function _findOrCreateUser (req, userData, userType, providerInfo, userMeta) {
    const errorContext = { req }
    const { keystone } = getSchemaCtx('User')
    const context = await keystone.createContext({ skipAccessControl: true })

    let userFoundByPhone
    let userFoundByEmail
    let targetUser

    // NOTE: In some cases we need to remove unverified phone / email from existing condo user
    // if it's conflicting with provider data (provider's ones are verified)
    // to avoid type + constraint error
    if (userData.phone) {
        userFoundByPhone = await User.getOne(context, {
            type: userType,
            // NOTE: We don't need to normalize phone here, since zod will ensure its e164
            phone: userData.phone,
            deletedAt: null,
        }, USER_FIELDS)
        _ensureUser(userFoundByPhone, userType, errorContext)
    }
    if (userData.email && normalizeEmail(userData.email)) {
        userFoundByEmail = await User.getOne(context, {
            type: userType,
            // NOTE: We need to find a target with normalization to avoid domain / dot duplication
            email: normalizeEmail(userData.email),
            deletedAt: null,
        }, USER_FIELDS)
        _ensureUser(userFoundByEmail, userType, errorContext)
    }

    // Step 1. If:
    // - we trust provider
    // - provider gives us phone
    // - provider tells us, that on his side phone is verified (if not specified, zod will fallback to true, assuming its always verified)
    // - found user is not super-user
    // then we should use this user instead of creating new one
    if (
        providerInfo.trustPhone &&
        userData.isPhoneVerified &&
        userFoundByPhone &&
        userFoundByPhone.isPhoneVerified &&
        !_isSuperUser(userFoundByPhone)
    ) {
        targetUser = userFoundByPhone
    }

    // Step 2. If we cannot link user by phone, try to link by email following the same principles
    if (
        !targetUser &&
        providerInfo.trustEmail &&
        userData.isEmailVerified &&
        userFoundByEmail &&
        userFoundByEmail.isEmailVerified &&
        !_isSuperUser(userFoundByEmail)
    ) {
        targetUser = userFoundByEmail
    }

    // Step 3. If there's no existing user we should create new one...
    if (!targetUser) {
        const createPayload = {
            ...DV_AND_SENDER,
            type: userType,
            name: userData.name,
            externalPhone: userData.phone,
            // NOTE: providerInfo.trustPhone should not affect this property
            isExternalPhoneVerified: Boolean(userData.phone && userData.isPhoneVerified),
            externalEmail: userData.email,
            // NOTE: providerInfo.trustEmail should not affect this property
            isExternalEmailVerified: Boolean(userData.email && userData.isEmailVerified),
            externalSystemName: providerInfo.name,
            meta: {
                [providerInfo.name]: userMeta,
            },
        }

        // That's necessary condition to store phone inside user
        if (userData.phone && providerInfo.trustPhone) {
            // We can also set user.phone if there's no conflict, or other user's phone is not verified
            if (!userFoundByPhone || !userFoundByPhone.isPhoneVerified) {
                if (userFoundByPhone) {
                    // Move phone to newly created user to avoid constraints errors
                    await User.update(context, userFoundByPhone.id, {
                        ...DV_AND_SENDER,
                        phone: null,
                        isPhoneVerified: false,
                        // NOTE: not moved to external, because it might be not external
                        meta: { ...userFoundByPhone.meta, phone: userFoundByPhone.phone },
                    }, USER_FIELDS)
                }

                // NOTE: externalPhone is kept and not omitted because "why not?)"
                createPayload.phone = userData.phone
                createPayload.isPhoneVerified = userData.isPhoneVerified
            }
        } else if (userData.phone && !userFoundByPhone) {
            // We can also store data in user if there's no conflicts, even for untrusted providers
            // so user can sign in via GQL and receive profile
            // TODO: approve this lines
            createPayload.phone = userData.phone
            createPayload.isPhoneVerified = false
        }

        // That's necessary condition to store email inside user
        if (userData.email && providerInfo.trustEmail) {
            // We can also set user.email if there's no conflict, or other user's email is not verified
            if (!userFoundByEmail || !userFoundByEmail.isEmailVerified) {
                if (userFoundByEmail) {
                    // Move email to newly created user to avoid constraints errors
                    await User.update(context, userFoundByEmail.id, {
                        ...DV_AND_SENDER,
                        email: null,
                        isEmailVerified: false,
                        // NOTE: not moved to external, because it might be not external
                        meta: { ...userFoundByEmail.meta, email: userFoundByEmail.email },
                    }, USER_FIELDS)
                }

                // NOTE: externalEmail is kept and not omitted because "why not?)"
                createPayload.email = userData.email
                createPayload.isEmailVerified = userData.isEmailVerified
            }
        } else if (userData.email && !userFoundByEmail) {
            // We can also store data in user if there's no conflicts, even for untrusted providers
            // so user can sign in via GQL and receive profile
            // TODO: approve this lines
            createPayload.email = userData.email
            createPayload.isEmailVerified = false
        }

        return await User.create(context, createPayload, USER_FIELDS)
    }

    // Step 4. At this point there's target non-super user (matched by phone or email + verification)
    // We can enhance it with data if no conflicts...
    const updatePayload = {
        ...DV_AND_SENDER,
        meta: {
            ...targetUser.meta,
            [providerInfo.name]: userMeta,
        },
    }

    // By adding missing name
    if (!targetUser.name && userData.name) {
        updatePayload.name = userData.name
    }

    // By adding email if found by phone and no conflict
    if (userData.email && (userFoundByPhone && targetUser.id === userFoundByPhone.id)) {
        // if user has verified email inside providers app
        // chance of owning it is more than just typing it in condo during auth
        // so that's why we're prioritizing targetUser
        if (userFoundByEmail) {
            if (!userFoundByEmail.isEmailVerified && userFoundByEmail.id !== targetUser.id) {
                await User.update(context, userFoundByEmail.id, {
                    ...DV_AND_SENDER,
                    email: null,
                    isEmailVerified: false,
                    // NOTE: not moved to external, because it might be not external
                    meta: { ...userFoundByEmail.meta, email: userFoundByEmail.email },
                }, USER_FIELDS)
                updatePayload.email = userData.email
                updatePayload.isEmailVerified = providerInfo.trustEmail && userData.isEmailVerified
            }
        } else {
            updatePayload.email = userData.email
            updatePayload.isEmailVerified = providerInfo.trustEmail && userData.isEmailVerified
        }
    }

    // By adding phone if found by email and no conflict
    if (userData.phone && (userFoundByEmail && targetUser.id === userFoundByEmail.id)) {
        // if user has verified phone inside providers app
        // chance of owning it is more than just typing it in condo without verification
        // so that's why we're prioritizing targetUser
        if (userFoundByPhone) {
            if (!userFoundByPhone.isPhoneVerified && userFoundByPhone.id !== targetUser.id) {
                await User.update(context, userFoundByPhone.id, {
                    ...DV_AND_SENDER,
                    phone: null,
                    isPhoneVerified: false,
                    // NOTE: not moved to external, because it might be not external
                    meta: { ...userFoundByPhone.meta, phone: userFoundByPhone.phone },
                }, USER_FIELDS)
                updatePayload.phone = userData.phone
                updatePayload.isPhoneVerified = providerInfo.trustPhone && userData.isPhoneVerified
            }
        } else {
            updatePayload.phone = userData.phone
            updatePayload.isPhoneVerified = providerInfo.trustPhone && userData.isPhoneVerified
        }
    }

    return await User.update(context, targetUser.id, updatePayload, USER_FIELDS)
}

/**
 * Gets or creates a user and their external identity.
 *
 * This function first attempts to find a user's external identity.
 * If found, it returns the associated user.
 * If not found, it proceeds to find an existing user by their verified and trusted
 * phone number or email. If no existing user is found, a new user is created.
 * Finally, it creates the external identity and links it to the user.
 * @param {import('http').IncomingMessage} req - keystone instance object
 * @param {object} userProfile - The profile of the user from the external provider.
 * @param {string} userType - The type of the user (e.g., 'staff', 'resident').
 * @param {object} providerInfo - information about identity provider (name / trustPhone / trustEmail).
 * @param {object} fieldMapping - userInfo json remap options. For example { id: 'sub' } converts oidc default "sub" field "id"
 * @returns {Promise<object>} The resolved user object.
 */
async function syncUser (
    req,
    userProfile,
    userType,
    providerInfo,
    fieldMapping = {}
) {
    const errorContext = { req }

    // Step 0. Sanity checks
    if (!ALLOWED_USER_TYPES.includes(userType)) {
        throw new GQLError({
            ...ERRORS.INVALID_USER_TYPE,
            messageInterpolation: { allowedTypes: ALLOWED_USER_TYPES.join(', ') },
        }, errorContext)
    }
    const { success: isValidProviderInfo, error: providerInfoError, data: providerInfoData } = providerInfoSchema.safeParse(providerInfo)
    if (!isValidProviderInfo) {
        throw new GQLError(ERRORS.INVALID_IDENTITY_PROVIDER_INFO, errorContext, [new Error(z.prettifyError(providerInfoError))])
    }

    const { success: isValidFieldMapping, error: fieldMappingError, data: fieldMappingData } = fieldMappingSchema.safeParse(fieldMapping)
    if (!isValidFieldMapping) {
        throw new GQLError(ERRORS.INVALID_FIELD_MAPPING, errorContext, [new Error(z.prettifyError(fieldMappingError))])
    }

    // Step 1. Convert provider shape to condo shape
    const combinedMapping = { ...DEFAULT_USER_FIELDS_MAPPING, ...fieldMappingData }
    const mappedProfile = Object.fromEntries(
        Object.entries(combinedMapping)
            .map(([fieldName, fieldPath]) => [fieldName, get(userProfile, fieldPath)])
    )

    // Step 2. Verify shape and do transforms
    const { success, error, data: userData } = userSchema.safeParse(mappedProfile)
    if (!success) {
        throw new GQLError(ERRORS.INVALID_USER_DATA, errorContext, [new Error(z.prettifyError(error))])
    }

    // Step 3. Try to find existing identity to authenticate
    // NOTE: does not add user.deletedAt filter, since it's the way to ban user (delete their profile with linked identity)
    const { keystone } = getSchemaCtx('User')
    const context = await keystone.createContext({ skipAccessControl: true })
    const userExternalIdentity = await UserExternalIdentity.getOne(context, {
        identityId: userData.id,
        userType,
        identityType: providerInfo.name,
        deletedAt: null,
    }, 'user { id deletedAt }')


    // Step 4 If identity found -> return its user
    if (userExternalIdentity) {
        // NOTE: If identity linked to deleted user = user is probably banned
        if (userExternalIdentity.user.deletedAt) {
            throw new GQLError(ERRORS.EXTERNAL_IDENTITY_BLOCKED, errorContext)
        }

        return userExternalIdentity.user
    }

    // Step 5. If no external identity, we need to create find or create user and create identity
    const user = await _findOrCreateUser(req, userData, userType, providerInfoData, userProfile)

    await UserExternalIdentity.create(context, {
        identityId: userData.id,
        user: { connect: { id: user.id } },
        identityType: providerInfo.name,
        userType,
        meta: userData,
        ...DV_AND_SENDER,
    })

    return user
}

function captureUserType (req, res, next) {
    const errorContext = { req }
    const { user_type } = req.query
    if (!user_type) {
        return next(
            new GQLError({
                ...ERRORS.MISSING_QUERY_PARAMETER,
                messageInterpolation: { parameter: 'user_type' },
            }, errorContext)
        )
    }

    if (!ALLOWED_USER_TYPES.includes(user_type)) {
        return next(
            new GQLError({
                ...ERRORS.INVALID_USER_TYPE,
                messageInterpolation: { allowedTypes: ALLOWED_USER_TYPES.join(', ') },
            }, errorContext)
        )
    }

    req.session.userType = user_type
    next()
}

function ensureUserType (req, res, next) {
    const errorContext = { req }
    const { user_type } = req.query
    if (user_type) {
        if (!ALLOWED_USER_TYPES.includes(user_type)) {
            return next(
                new GQLError({
                    ...ERRORS.INVALID_USER_TYPE,
                    messageInterpolation: { allowedTypes: ALLOWED_USER_TYPES.join(', ') },
                }, errorContext)
            )
        }
        req.session.userType = user_type
    }

    if (!req.session.userType) {
        const { provider } = req.params
        const messageInterpolation = {
            provider,
        }
        return next(new GQLError({ ...ERRORS.NO_USER_TYPE_IN_CALLBACK, messageInterpolation }, errorContext))
    } else if (!ALLOWED_USER_TYPES.includes(req.session.userType)) {
        return next(new GQLError({ ...ERRORS.INVALID_USER_TYPE, messageInterpolation: { allowedTypes: ALLOWED_USER_TYPES.join(', ') } }, errorContext))
    }

    next()
}

module.exports = {
    syncUser,
    captureUserType,
    ensureUserType,
}