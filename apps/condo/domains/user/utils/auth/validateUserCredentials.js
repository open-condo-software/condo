const { itemsQuery, getSchemaCtx } = require('@open-condo/keystone/schema')

const { normalizePhone } = require('@condo/domains/common/utils/phone')
const { ConfirmPhoneAction } = require('@condo/domains/user/utils/serverSchema')
const { generateSimulatedToken } = require('@condo/domains/user/utils/tokens')


/**
 *
 * @param {{ phone?: string, email?: string, userType?: 'staff' | 'resident' | 'service' }} userIdentity
 * @param {{ confirmPhoneToken?: string, confirmEmailToken?: string, password?: string }} authFactors
 * @return {Promise<{success: boolean}|{success: boolean, authChecks: {confirmEmailToken: ("skip"|"fail"|"success"), password: ("skip"|"fail"|"success"), confirmPhoneToken: ("skip"|"fail"|"success")}, user: Object}>}
 */
async function validateUserCredentials (userIdentity, authFactors) {
    if (typeof userIdentity !== 'object') throw new Error('You must provide userIdentity')
    if (typeof authFactors !== 'object') throw new Error('You must provide authFactors')

    // TODO(DOMA-00000): check ConfirmEmailToken
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

    return { ...match, success: true, user }
}

/**
 *
 * @param {{ phone?: string, email?: string, userType: 'staff' | 'resident' | 'service' }} userIdentity
 * @return {Promise<{success: boolean, user: Object}|{success: boolean}>}
 */
async function _getUser (userIdentity) {
    if (typeof userIdentity !== 'object') throw new Error('You must provide userIdentity')

    const phone = userIdentity.phone
    const email = userIdentity.email
    const userType = userIdentity.userType

    if (!phone && !email) throw new Error('You must provide a phone number or email')
    if (!userType) throw new Error('You must provide a user type')

    const users = await itemsQuery('User', {
        where: {
            userType, phone, email,
            deletedAt: null,
        },
        first: 2,
    })

    if (users.length !== 1) {
        // TODO(DOMA-10861): prevent a time based attack
        return { success: false }
    }

    const user = users[0]
    return { success: true, user }
}

/**
 *
 * @param {Object} user
 * @param {{ confirmPhoneToken?: string, confirmEmailToken?: string, password?: string }} authFactors
 */
async function _matchUser (user, authFactors) {
    if (typeof authFactors !== 'object') throw new Error('You must provide a user type authFactors')

    /**
     * @type {{confirmEmailToken: 'skip' | 'fail' | 'success', password: 'skip' | 'fail' | 'success', confirmPhoneToken: 'skip' | 'fail' | 'success'}}
     */
    const authChecks = {
        password: authFactors.password === undefined ? 'skip' : 'fail',
        confirmPhoneToken: authFactors.confirmPhoneToken === undefined ? 'skip' : 'fail',
        // TODO(DOMA-00000): check ConfirmEmailToken
        // confirmEmailToken: authFactors.confirmEmailToken === undefined ? 'skip' : 'fail',
    }

    const is2FAEnabled = false // TODO(DOMA-00000): add logic for 2FA

    const numberOfChecksRequiredForAuth = is2FAEnabled ? 2 : 1

    if (authChecks.password !== 'skip') {
        const { success } = await _matchUserPassword(user, authFactors.password)
        authChecks.password = success === true ? 'success' : 'fail'
    }

    let confirmPhoneAction
    if (authChecks.confirmPhoneToken !== 'skip') {
        const { success, confirmPhoneAction: action } = await _matchUserConfirmPhoneToken(user, authFactors.confirmPhoneToken)
        authChecks.confirmPhoneToken = success === true ? 'success' : 'fail'
        confirmPhoneAction = action
    }

    // TODO(DOMA-00000): check ConfirmEmailToken
    // let confirmEmailAction
    // if (authChecks.confirmEmailToken !== 'skip') {
    //     const { success, confirmEmailAction: action } = await matchUserConfirmEmailToken(user, authFactors.confirmEmailToken)
    //     authChecks.confirmEmailToken = success === true ? 'success' : 'fail'
    //     confirmEmailAction = action
    // }

    /** @type {string[]} */
    const failedChecks = Object.entries(authChecks).filter(([key, value]) => value === 'failed').map(([key]) => key)
    /** @type {string[]} */
    const successfulChecks = Object.entries(authChecks).filter(([key, value]) => value === 'success').map(([key]) => key)

    if (failedChecks.length === 0 && successfulChecks.length >= numberOfChecksRequiredForAuth) {
        return {
            success: true, authChecks, confirmPhoneAction,

            // TODO(DOMA-00000): check ConfirmEmailToken
            // confirmEmailAction,
        }
    }

    return { success: false, authChecks }
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

// TODO(DOMA-00000): check ConfirmEmailToken
// async function _matchUserConfirmEmailToken (user, confirmEmailToken) {
//     return { success: false }
// }

/**
 *
 * @param {{ confirmPhoneToken?: string, confirmEmailToken?: string, password?: string }} authFactors
 * @return {Promise<void>}
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

    // TODO(DOMA-00000): check ConfirmEmailToken
    // if (authFactors.confirmEmailToken !== undefined) {
    //
    // }
}

module.exports = {
    validateUserCredentials,
}
