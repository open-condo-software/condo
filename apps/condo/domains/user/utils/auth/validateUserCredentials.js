const { itemsQuery, getSchemaCtx } = require('@open-condo/keystone/schema')

const { normalizePhone } = require('@condo/domains/common/utils/phone')
const { ConfirmPhoneAction } = require('@condo/domains/user/utils/serverSchema')
const { generateSimulatedToken } = require('@condo/domains/user/utils/tokens')


/**
 *
 * @param userIdentity
 * @param authFactors
 * @return {Promise<{success: boolean}|{confirmPhoneAction?: {id: string, phone: string, isPhoneVerified: boolean}, success: boolean, user: Object}>}
 */
async function validateUserCredentials (userIdentity, authFactors) {
    if (!userIdentity || typeof userIdentity !== 'object') throw new Error('You must provide userIdentity')
    if (!authFactors || typeof authFactors !== 'object') throw new Error('You must provide authFactors')

    // TODO(DOMA-9890): remove this error when added ConfirmEmailToken
    if (authFactors.confirmEmailToken !== undefined) throw new Error('confirmEmailToken is not supported yet')

    const phone = userIdentity.phone
    const email = userIdentity.email
    const userType = userIdentity.userType

    if (!phone && !email) throw new Error('You must provide a phone number or email')
    if (!userType) throw new Error('You must provide a user type')

    // Get user
    const { user, success } = await _getUser(userIdentity)
    if (!success) {
        await _preventTimeBasedAttack(authFactors)
        return { success: false }
    }

    // Verify the secret matches
    const match = await _matchUser(user, authFactors)
    if (!match.success) {
        return { success: false }
    }

    return { success: true, user, confirmPhoneAction: match.confirmPhoneAction }
}

/**
 *
 * @param {{ phone?: string, email?: string, userType: 'staff' | 'resident' | 'service' }} userIdentity
 * @return {Promise<{success: boolean, user: Object}|{success: boolean}>}
 * @private
 */
async function _getUser (userIdentity) {
    if (!userIdentity || typeof userIdentity !== 'object') throw new Error('You must provide userIdentity')

    const phone = userIdentity.phone
    const email = userIdentity.email
    const userType = userIdentity.userType

    if (!phone && !email) throw new Error('You must provide a phone number or email')
    if (!userType) throw new Error('You must provide a user type')

    const where = { type: userType, deletedAt: null }
    if (phone) {
        where.phone = phone
        // TODO(DOMA-00000): uncomment when active users phones will be verified
        // where.isPhoneVerified = true
    }
    if (email) {
        where.email = email
        // TODO(DOMA-9890): uncomment when add ConfirmEmailToken and all integrations will be have verified emails
        // where.isEmailVerified = true
    }

    const users = await itemsQuery('User', {
        where,
        first: 2,
    })

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
 * @param {Object} user
 * @param {{ confirmPhoneToken?: string, confirmEmailToken?: string, password?: string }} authFactors
 * @return {Promise<{confirmPhoneAction: {id: string, phone: string, isPhoneVerified: boolean}, success: boolean}|{success: boolean}>}
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
        // TODO(DOMA-9890): uncomment when added ConfirmEmailToken
        // confirmEmailToken: authFactors.confirmEmailToken === undefined ? AUTH_CHECK_STATUSES.SKIP : AUTH_CHECK_STATUSES.FAIL,
    }

    const is2FAEnabled = false // TODO(DOMA-10969): add logic for 2FA

    const numberOfChecksRequiredForAuth = is2FAEnabled ? 2 : 1

    if (authChecks.password !== 'skip') {
        const { success } = await _matchUserPassword(user, authFactors.password)
        authChecks.password = success === true ? AUTH_CHECK_STATUSES.SUCCESS : AUTH_CHECK_STATUSES.FAIL
    }

    let confirmPhoneAction
    if (authChecks.confirmPhoneToken !== 'skip') {
        const { success, confirmPhoneAction: action } = await _matchUserConfirmPhoneToken(user, authFactors.confirmPhoneToken)
        authChecks.confirmPhoneToken = success === true ? AUTH_CHECK_STATUSES.SUCCESS : AUTH_CHECK_STATUSES.FAIL
        confirmPhoneAction = action
    }

    // TODO(DOMA-9890): uncomment when added ConfirmEmailToken
    // let confirmEmailAction
    // if (authChecks.confirmEmailToken !== 'skip') {
    //     const { success, confirmEmailAction: action } = await matchUserConfirmEmailToken(user, authFactors.confirmEmailToken)
    //     authChecks.confirmEmailToken = success === true ? 'success' : 'fail'
    //     confirmEmailAction = action
    // }

    /** @type {string[]} */
    const failedChecks = Object.entries(authChecks).filter(([key, value]) => value === AUTH_CHECK_STATUSES.FAIL).map(([key]) => key)
    /** @type {string[]} */
    const successfulChecks = Object.entries(authChecks).filter(([key, value]) => value === AUTH_CHECK_STATUSES.SUCCESS).map(([key]) => key)

    if (failedChecks.length === 0 && successfulChecks.length >= numberOfChecksRequiredForAuth) {
        return {
            success: true, confirmPhoneAction,

            // TODO(DOMA-9890): uncomment when added ConfirmEmailToken
            // confirmEmailAction,
        }
    }

    return { success: false }
}

/**
 *
 * @param {Object} user
 * @param {string} password
 * @return {Promise<{success: *}>}
 * @private
 */
async function _matchUserPassword (user, password) {
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

// TODO(DOMA-9890): uncomment and implement when added ConfirmEmailToken
// async function _matchUserConfirmEmailToken (user, confirmEmailToken) {
//     return { success: false }
// }


/**
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

    // TODO(DOMA-9890): uncomment and implement when added ConfirmEmailToken
    // if (authFactors.confirmEmailToken !== undefined) {
    //
    // }
}

module.exports = {
    validateUserCredentials,
}
