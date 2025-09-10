const { CHANGE_OR_VERIFY_USER_EMAIL_TYPE } = require('@condo/domains/user/constants/limits')

const { RedisGuard } = require('./guards')


const DAY_IN_SEC = 60 * 60 * 24


const redisGuard = new RedisGuard()

async function changeOrVerifyUserEmailGuard (context, newEmail = null) {
    const ip = context.req.ip
    const userId = context?.authedItem?.id
    const userEmail = context?.authedItem?.email

    const guards = [{
        key: [CHANGE_OR_VERIFY_USER_EMAIL_TYPE, 'daily', 'ip', ip].join(':'),
        windowLimit: 10,
        windowSizeInSec: DAY_IN_SEC,
    }, {
        key: [CHANGE_OR_VERIFY_USER_EMAIL_TYPE, 'daily', 'userId', userId].join(':'),
        windowLimit: 10,
        windowSizeInSec: DAY_IN_SEC,
    }]

    if (userEmail) {
        guards.push({
            key: [CHANGE_OR_VERIFY_USER_EMAIL_TYPE, 'daily', 'email', userEmail].join(':'),
            windowLimit: 10,
            windowSizeInSec: DAY_IN_SEC,
        })
    }

    if (newEmail) {
        guards.push({
            key: [CHANGE_OR_VERIFY_USER_EMAIL_TYPE, 'daily', 'email', newEmail].join(':'),
            windowLimit: 10,
            windowSizeInSec: DAY_IN_SEC,
        })
    }

    await redisGuard.checkMultipleCustomLimitCounters(guards, context)
}

module.exports = {
    changeOrVerifyUserEmailGuard,
}
