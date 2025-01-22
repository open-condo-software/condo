const { get } = require('lodash')

const { validateUserCredentials } = require('./validateUserCredentials')

const { RedisGuard } = require('../serverSchema/guards')


const redisGuard = new RedisGuard()

/**
 *
 * @param {{ phone?: string, email?: string, userType: 'staff' | 'resident' | 'service' }} userIdentity
 * @param {{ confirmPhoneToken?: string, confirmEmailToken?: string, password?: string }} authFactors
 * @param context
 * @return {Promise<{success: boolean}|{confirmPhoneAction?: {id: string, phone: string, isPhoneVerified: boolean}, success: boolean, user: Object}>}
 */
async function validateUserCredentialsWithRequestLimit (userIdentity, authFactors, context) {
    if (!context) throw new Error('context cannot be empty')

    const userId = get(context, 'authedItem.id', null)
    const ip = context.req.ip

    const phone = userIdentity?.phone
    const email = userIdentity?.email
    const userType = userIdentity.userType

    // todo(doma-10861): add limit reset
    await redisGuard.checkCustomLimitCounters(
        ['validate-user-credentials', 'ip', ip].join(':'),
        60 * 60, // 1 hour
        20,
        context,
    )

    if (userId) {
        await redisGuard.checkCustomLimitCounters(
            ['validate-user-credentials', 'user', userId].join(':'),
            60 * 60, // 1 hour
            20,
            context,
        )
    }

    if (phone) {
        await redisGuard.checkCustomLimitCounters(
            ['validate-user-credentials', 'phone-and-user-type', userType, phone].join(':'),
            60 * 60, // 1 hour
            20,
            context,
        )
    }

    if (email) {
        await redisGuard.checkCustomLimitCounters(
            ['validate-user-credentials', 'email-and-user-type', userType, email].join(':'),
            60 * 60, // 1 hour
            20,
            context,
        )
    }

    return await validateUserCredentials(userIdentity, authFactors)
}

module.exports = {
    validateUserCredentialsWithRequestLimit,
}
