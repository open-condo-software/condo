const conf = require('@open-condo/config')
const { GQLError } = require('@open-condo/keystone/errors')

const { MAX_REQUESTS_FOR_IP_PER_DAY, MAX_REQUESTS_FOR_PHONE_PER_DAY } = require('@condo/domains/user/constants/common')
const { GQL_ERRORS } = require('@condo/domains/user/constants/errors')
const { RedisGuard } = require('@condo/domains/user/utils/serverSchema/guards')


const REDIS_GUARD = new RedisGuard()
const MAX_REQUESTS_BY_API_PER_DAY = Number(conf['MAX_REQUESTS_FOR_IP_PER_DAY']) || MAX_REQUESTS_FOR_IP_PER_DAY
const MAX_REQUESTS_BY_PHONE_PER_DAY = Number(conf['MAX_REQUESTS_FOR_PHONE_PER_DAY']) || MAX_REQUESTS_FOR_PHONE_PER_DAY
const IP_WHITE_LIST = conf.IP_WHITE_LIST ? JSON.parse(conf.IP_WHITE_LIST) : []
const PHONE_WHITE_LIST = Object.keys(conf.PHONE_WHITE_LIST ? JSON.parse(conf.PHONE_WHITE_LIST) : {})

const checkDailyRequestLimitCountersByIp = async (context, prefix, rawIp) => {
    const ip = rawIp.split(':').pop()
    const key = [prefix, 'ip', ip].filter(Boolean).join(':')
    const byIpCounter = await REDIS_GUARD.incrementDayCounter(key)
    if (byIpCounter > MAX_REQUESTS_BY_API_PER_DAY && !IP_WHITE_LIST.includes(ip)) {
        throw new GQLError(GQL_ERRORS.DAILY_REQUEST_LIMIT_FOR_IP_REACHED, context)
    }
}

const checkDailyRequestLimitCountersByPhone = async (context, prefix, phone) => {
    const key = [prefix, 'phone', phone].filter(Boolean).join(':')
    const byPhoneCounter = await REDIS_GUARD.incrementDayCounter(key)
    if (byPhoneCounter > MAX_REQUESTS_BY_PHONE_PER_DAY && !PHONE_WHITE_LIST.includes(phone)) {
        throw new GQLError(GQL_ERRORS.DAILY_REQUEST_LIMIT_FOR_PHONE_REACHED, context)
    }
}

module.exports = {
    checkDailyRequestLimitCountersByIp,
    checkDailyRequestLimitCountersByPhone,
}
