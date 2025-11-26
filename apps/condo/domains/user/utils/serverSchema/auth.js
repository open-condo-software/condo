const conf = require('@open-condo/config')
const { itemsQuery, getSchemaCtx } = require('@open-condo/keystone/schema')

const { normalizeEmail } = require('@condo/domains/common/utils/mail')
const { normalizePhone } = require('@condo/domains/common/utils/phone')
const { AUTH_COUNTER_LIMIT_TYPE } = require('@condo/domains/user/constants/limits')
const { ConfirmPhoneAction, ConfirmEmailAction } = require('@condo/domains/user/utils/serverSchema')
const { RedisGuard } = require('@condo/domains/user/utils/serverSchema/guards')
const { generateSimulatedToken } = require('@condo/domains/user/utils/tokens')


const ERROR_TYPES = {
    NOT_ENOUGH_AUTH_FACTORS: 'NOT_ENOUGH_AUTH_FACTORS',
}

const GUARD_DEFAULT_WINDOW_SIZE_IN_SEC = 60 * 60 // 1 hour in sec
const GUARD_DEFAULT_WINDOW_LIMIT = 10

/**
 * @typedef {Object} GuardQuota
 * @property {number} windowSizeInSec The window size in seconds
 * @property {number} windowLimit Attempts limit during the window
 */

/**
 * @type {{ ip?: Record<string, GuardQuota>, user?: Record<string, GuardQuota>, phone?: Record<string, GuardQuota>, email?: Record<string, GuardQuota>, default?: GuardQuota }}
 *
 * Examples:
 *
 * 1.1 Change only window size for ip
 * { "ip": { "*.*.*.*": { windowSizeInSec: 3600 } } }
 *
 * 1.2 Change only limit for ip
 * { "ip": { "*.*.*.*": { windowLimit: 60 } } }
 *
 * 1.2 Change window size and limit for ip
 * { "ip": { "*.*.*.*": { windowSizeInSec: 3600, windowLimit: 60 } } }
 *
 * 2 Change window size and limit for user id
 * { "user": { "********-****-****-****-************": { windowSizeInSec: 3600, windowLimit: 60 } } }
 *
 * 3 Change window size and limit for user phone
 * { "phone": { "+7**********": { windowSizeInSec: 3600, windowLimit: 60 } } }
 *
 * 4 Change window size and limit for user email
 * { "email": { "example@mail.com": { windowSizeInSec: 3600, windowLimit: 60 } } }
 *
 * 4 Change window size and limit for user email and phone
 * { "phone": { "+7**********": { windowSizeInSec: 3600, windowLimit: 60 } }, "email": { "example@mail.com": { windowSizeInSec: 3600, windowLimit: 60 } } }
 */
const customQuotas = JSON.parse(conf.AUTH_GUARD_CUSTOM_QUOTAS || '{}')

const redisGuard = new RedisGuard()

/**
 *
 * @param {'ip' | 'user'} identityPrefix
 * @param {string} identity
 * @return {string}
 */
function buildQuotaKey (identityPrefix, identity) {
    return [AUTH_COUNTER_LIMIT_TYPE, identityPrefix, identity].join(':')
}

/**
 *
 * @param {'phone' | 'email'} identityPrefix
 * @param {string} identity
 * @param {'staff' | 'resident' | 'service'} userType
 * @return {string}
 */
function buildQuotaKeyByUserType (identityPrefix, identity, userType) {
    return [AUTH_COUNTER_LIMIT_TYPE, 'user_type', userType, identityPrefix, identity].join(':')
}

/**
 * The following guards are activated:
 * 1. Guard by ip (each request)
 * 2. Guard by authed user id (if user authed)
 * 3. Guard by phone (if phone passed)
 * 4. Guard by email (if email passed)
 *
 * @param {{ phone?: string, email?: string, userType: 'staff' | 'resident' | 'service' }} userIdentity
 * @param context
 * @return {Promise<void>}
 */
async function authGuards (userIdentity, context) {
    if (!context) throw new Error('context cannot be empty')

    const userId = context?.authedItem?.id || null
    const ip = context.req.ip

    const phone = userIdentity?.phone
    const email = userIdentity?.email
    const userType = userIdentity.userType

    /**
     * @type {{key: string, windowSizeInSec: number, windowLimit: number}[]}
     */
    const guards = []

    guards.push({
        key: buildQuotaKey('ip', ip),
        windowSizeInSec: customQuotas?.ip?.[ip]?.windowSizeInSec || customQuotas?.default?.windowSizeInSec || GUARD_DEFAULT_WINDOW_SIZE_IN_SEC,
        windowLimit: customQuotas?.ip?.[ip]?.windowLimit || customQuotas?.default?.windowLimit || GUARD_DEFAULT_WINDOW_LIMIT,
    })

    if (userId) {
        guards.push({
            key: buildQuotaKey('user', userId),
            windowSizeInSec: customQuotas?.user?.[userId]?.windowSizeInSec || customQuotas?.default?.windowSizeInSec || GUARD_DEFAULT_WINDOW_SIZE_IN_SEC,
            windowLimit: customQuotas?.user?.[userId]?.windowLimit || customQuotas?.default?.windowLimit || GUARD_DEFAULT_WINDOW_LIMIT,
        })
    }

    if (phone) {
        guards.push({
            key: buildQuotaKeyByUserType('phone', phone, userType),
            windowSizeInSec: customQuotas?.phone?.[phone]?.windowSizeInSec || customQuotas?.default?.windowSizeInSec || GUARD_DEFAULT_WINDOW_SIZE_IN_SEC,
            windowLimit: customQuotas?.phone?.[phone]?.windowLimit || customQuotas?.default?.windowLimit || GUARD_DEFAULT_WINDOW_LIMIT,
        })
    }

    if (email) {
        guards.push({
            key: buildQuotaKeyByUserType('email', email, userType),
            windowSizeInSec: customQuotas?.email?.[email]?.windowSizeInSec || customQuotas?.default?.windowSizeInSec || GUARD_DEFAULT_WINDOW_SIZE_IN_SEC,
            windowLimit: customQuotas?.email?.[email]?.windowLimit || customQuotas?.default?.windowLimit || GUARD_DEFAULT_WINDOW_LIMIT,
        })
    }

    await redisGuard.checkMultipleCustomLimitCounters(guards, context)
}

/**
 *
 * @param {{ phone?: string, email?: string, userType: 'staff' | 'resident' | 'service' }} userIdentity
 * @param {{ confirmPhoneToken?: string, confirmEmailToken?: string, password?: string }} authFactors
 * @return {Promise<{success: boolean}|{confirmPhoneAction: {id: string, phone: string, isPhoneVerified: boolean}, confirmEmailAction: *, success: boolean, user: *}|{success: boolean, _error: {is2FAEnabled: boolean, errorType: string, authChecks: {confirmEmailToken: ("skip"|"fail"|"success"), password: ("skip"|"fail"|"success"), confirmPhoneToken: ("skip"|"fail"|"success")}}}>}
 * @private
 */
async function validateUserCredentials (userIdentity, authFactors) {
    if (!userIdentity || typeof userIdentity !== 'object') throw new Error('You must provide userIdentity')
    if (!authFactors || typeof authFactors !== 'object') throw new Error('You must provide authFactors')

    const userType = userIdentity.userType

    if (!userType) throw new Error('You must provide a user type')

    // Get user
    const { success, user } = await _getUser(userIdentity, authFactors)
    if (!success) {
        await _preventTimeBasedAttack(authFactors)
        return { success: false }
    }

    // Verify the secret matches
    const match = await _matchUser(user, authFactors)
    if (!match.success) {
        return {
            success: false,
            _error: match._error,
        }
    }

    return {
        success: true,
        user,
        confirmPhoneAction: match.confirmPhoneAction,
        confirmEmailAction: match.confirmEmailAction,
    }
}

/**
 *
 * The function tries to find a user by user type and phone/email.
 * If the phone/email number was not transferred, but the confirmToken was, then we extract the data from it.
 *
 * @param {{ phone?: string, email?: string, userType: 'staff' | 'resident' | 'service' }} userIdentity
 * @param {{ confirmPhoneToken?: string, confirmEmailToken?: string, password?: string }} authFactors
 * @return {Promise<{success: boolean}|{success: boolean, user: *}>}
 * @private
 */
async function _getUser (userIdentity, authFactors) {
    if (!userIdentity || typeof userIdentity !== 'object') throw new Error('You must provide userIdentity')

    let phone = userIdentity.phone
    let email = userIdentity.email
    const userType = userIdentity.userType

    if (!userType) throw new Error('You must provide a user type')

    // NOTE: If password and phone/email were not transferred, but confirm token was,
    // then we try to get phone/email from confirm token to understand who we are trying to verify
    if (!authFactors?.password) {
        const { keystone } = getSchemaCtx('User')

        if (phone === undefined && authFactors?.confirmPhoneToken) {
            const action = await ConfirmPhoneAction.getOne(keystone,
                {
                    token: authFactors.confirmPhoneToken,
                },
                'id phone'
            )

            if (action) {
                phone = action.phone
            }
        }

        if (email === undefined && authFactors?.confirmEmailToken) {
            const action = await ConfirmEmailAction.getOne(keystone,
                {
                    token: authFactors.confirmEmailToken,
                },
                'id email'
            )

            if (action) {
                email = action.email
            }
        }
    }

    const where = { type: userType, deletedAt: null }
    if (phone) {
        where.phone = phone
        // TODO(Alllex202): uncomment when active users phones will be verified
        // where.isPhoneVerified = true
    }
    if (email) {
        where.email = email
        where.isEmailVerified = true
    }

    const users = await itemsQuery('User', {
        where,
        first: 2,
    })

    if (!phone && !email)  {
        return { success: false }
    }

    if (users.length !== 1) {
        return { success: false }
    }

    const user = users[0]
    return { success: true, user }
}

const AUTH_CHECK_STATUSES = {
    SUCCESS: 'success',
    FAIL: 'fail',
    SKIP: 'skip',
}

/**
 *
 * Function check that the correct password/confirmToken was specified during authorization
 *
 * @param {Object} user
 * @param {{ confirmPhoneToken?: string, confirmEmailToken?: string, password?: string }} authFactors
 * @return {Promise<{success: boolean}|{confirmPhoneAction: {id: string, phone: string, isPhoneVerified: boolean}, confirmEmailAction, success: boolean}|{success: boolean, _error: {is2FAEnabled: boolean, errorType: string, authChecks: {confirmEmailToken: ("skip"|"fail"|"success"), password: ("skip"|"fail"|"success"), confirmPhoneToken: ("skip"|"fail"|"success")}}}>}
 * @private
 */
async function _matchUser (user, authFactors) {
    if (!authFactors || typeof authFactors !== 'object') throw new Error('You must provide a user type authFactors')

    /**
     * @type {{confirmEmailToken: 'skip' | 'fail' | 'success', password: 'skip' | 'fail' | 'success', confirmPhoneToken: 'skip' | 'fail' | 'success'}}
     */
    const authChecks = {
        password: authFactors.password === undefined ? AUTH_CHECK_STATUSES.SKIP : AUTH_CHECK_STATUSES.FAIL,
        confirmPhoneToken: authFactors.confirmPhoneToken === undefined ? AUTH_CHECK_STATUSES.SKIP : AUTH_CHECK_STATUSES.FAIL,
        confirmEmailToken: authFactors.confirmEmailToken === undefined ? AUTH_CHECK_STATUSES.SKIP : AUTH_CHECK_STATUSES.FAIL,
    }

    const is2FAEnabled = user.isTwoFactorAuthenticationEnabled

    const numberOfChecksRequiredForAuth = is2FAEnabled ? 2 : 1

    if (authChecks.password !== AUTH_CHECK_STATUSES.SKIP) {
        const { success } = await _matchUserPassword(user, authFactors.password)
        authChecks.password = success === true ? AUTH_CHECK_STATUSES.SUCCESS : AUTH_CHECK_STATUSES.FAIL
    }

    let confirmPhoneAction
    if (authChecks.confirmPhoneToken !== AUTH_CHECK_STATUSES.SKIP) {
        const { success, confirmPhoneAction: action } = await _matchUserConfirmPhoneToken(user, authFactors.confirmPhoneToken)
        authChecks.confirmPhoneToken = success === true ? AUTH_CHECK_STATUSES.SUCCESS : AUTH_CHECK_STATUSES.FAIL
        confirmPhoneAction = action
    }

    let confirmEmailAction
    if (authChecks.confirmEmailToken !== AUTH_CHECK_STATUSES.SKIP) {
        const { success, confirmEmailAction: action } = await _matchUserConfirmEmailToken(user, authFactors.confirmEmailToken)
        authChecks.confirmEmailToken = success === true ? AUTH_CHECK_STATUSES.SUCCESS : AUTH_CHECK_STATUSES.FAIL
        confirmEmailAction = action
    }

    /** @type {string[]} */
    const failedChecks = Object.entries(authChecks).filter(([key, value]) => value === AUTH_CHECK_STATUSES.FAIL).map(([key]) => key)
    /** @type {string[]} */
    const successfulChecks = Object.entries(authChecks).filter(([key, value]) => value === AUTH_CHECK_STATUSES.SUCCESS).map(([key]) => key)
    /** @type {string[]} */
    const nonSkippedChecks = Object.entries(authChecks).filter(([key, value]) => value !== AUTH_CHECK_STATUSES.SKIP).map(([key]) => key)

    if (nonSkippedChecks.length < numberOfChecksRequiredForAuth) {
        return {
            success: false,
            // NOTE: In general we don't return any detailed errors
            // But we should know that we don't have enough data for validation
            _error: { errorType: ERROR_TYPES.NOT_ENOUGH_AUTH_FACTORS, authChecks, is2FAEnabled },
        }
    }

    if (failedChecks.length === 0 && successfulChecks.length >= numberOfChecksRequiredForAuth) {
        return {
            success: true,
            confirmPhoneAction,
            confirmEmailAction,
        }
    }

    return { success: false }
}

/**
 *
 * @param {Object} user
 * @param {string} password
 * @return {Promise<{success: boolean}>}
 * @private
 */
async function _matchUserPassword (user, password) {
    if (password === null) {
        await _preventTimeBasedAttack({ password: '' })
        return { success: false }
    }

    const { keystone } = getSchemaCtx('User')
    const { auth: { User: { password: PasswordStrategy } } } = keystone
    const list = PasswordStrategy.getList()
    const { success } = await PasswordStrategy._matchItem(user, { password: password }, list.fieldsByPath['password'] )
    return { success }
}

/**
 *
 * @param {*} user
 * @param {string} confirmPhoneToken
 * @return {Promise<{success: boolean}|{confirmPhoneAction: { id: string, phone: string, isPhoneVerified: boolean }, success: boolean}>}
 * @private
 */
async function _matchUserConfirmPhoneToken (user, confirmPhoneToken) {
    if (!confirmPhoneToken) {
        await _preventTimeBasedAttack({ confirmPhoneToken })
        return { success: false }
    }

    const { keystone } = getSchemaCtx('User')
    const action = await ConfirmPhoneAction.getOne(keystone,
        {
            token: confirmPhoneToken,
            expiresAt_gte: new Date().toISOString(),
            completedAt: null,
            isPhoneVerified: true,
        },
        'id phone isPhoneVerified'
    )
    if (!action) return { success: false }

    const userPhone = normalizePhone(user.phone)
    const actionPhone = normalizePhone(action.phone)
    if (userPhone && actionPhone && userPhone === actionPhone) {
        return { success: true, confirmPhoneAction: action }
    }

    return { success: false }
}

/**
 *
 * @param {*} user
 * @param {string} confirmEmailToken
 * @return {Promise<{success: boolean}|{confirmEmailAction: { id: string, email: string, isEmailVerified: boolean }, success: boolean}>}
 * @private
 */
async function _matchUserConfirmEmailToken (user, confirmEmailToken) {
    if (!confirmEmailToken) {
        await _preventTimeBasedAttack({ confirmEmailToken })
        return { success: false }
    }

    const { keystone } = getSchemaCtx('User')
    const action = await ConfirmEmailAction.getOne(keystone,
        {
            token: confirmEmailToken,
            expiresAt_gte: new Date().toISOString(),
            completedAt: null,
            isEmailVerified: true,
        },
        'id email isEmailVerified'
    )
    if (!action) return { success: false }

    const userEmail = normalizeEmail(user.email)
    const actionEmail = normalizeEmail(action.email)
    if (userEmail && actionEmail && userEmail === actionEmail) {
        return { success: true, confirmEmailAction: action }
    }

    return { success: false }
}

/**
 *
 * This function performs a fake password comparison or a fake search for confirmToken to prevent time-based attacks.
 *
 * For example, if the user is not found, then we do not check the password or confirmToken.
 * This means that such a request will complete earlier than a request with an existing user, whose password/confirmToken will be checked.
 * To prevent this, we make fake password/confirmToken checks.
 *
 * @param {{ confirmPhoneToken?: string, confirmEmailToken?: string, password?: string }} authFactors
 * @return {Promise<void>}
 * @private
 */
async function _preventTimeBasedAttack (authFactors) {
    const { keystone } = getSchemaCtx('User')

    if (authFactors.password !== undefined) {
        const { auth: { User: { password: PasswordStrategy } } } = keystone
        const list = PasswordStrategy.getList()
        const secretFieldInstance = list.fieldsByPath['password']
        const hash = await secretFieldInstance.generateHash(
            'simulated-password-to-counter-timing-attack'
        )
        await secretFieldInstance.compare(authFactors.password, hash)
    }

    if (authFactors.confirmPhoneToken !== undefined) {
        const token = authFactors.confirmPhoneToken || generateSimulatedToken()
        await ConfirmPhoneAction.getOne(keystone,
            {
                token,
                expiresAt_gte: new Date().toISOString(),
                completedAt: null,
                isPhoneVerified: true,
            },
            'id phone isPhoneVerified'
        )
    }

    if (authFactors.confirmEmailToken !== undefined) {
        const token = authFactors.confirmEmailToken || generateSimulatedToken()
        await ConfirmEmailAction.getOne(keystone,
            {
                token,
                expiresAt_gte: new Date().toISOString(),
                completedAt: null,
                isEmailVerified: true,
            },
            'id email isEmailVerified'
        )
    }
}

module.exports = {
    validateUserCredentials,
    authGuards,
    buildQuotaKey,
    buildQuotaKeyByUserType,
}
