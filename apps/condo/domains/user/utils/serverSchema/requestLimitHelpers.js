const conf = require('@open-condo/config')
const { GQLError } = require('@open-condo/keystone/errors')

const { MAX_ANONYMOUS_REQUESTS_FOR_IP_BY_DAY } = require('@condo/domains/user/constants/common')
const { GQL_ERRORS } = require('@condo/domains/user/constants/errors')
const { RedisGuard } = require('@condo/domains/user/utils/serverSchema/guards')


const REDIS_GUARD = new RedisGuard()
const MAX_ANONYMOUS_REQUESTS_BY_DAY = Number(conf['MAX_ANONYMOUS_REQUESTS_FOR_IP_BY_DAY']) || MAX_ANONYMOUS_REQUESTS_FOR_IP_BY_DAY
const IP_WHITE_LIST = conf.IP_WHITE_LIST ? JSON.parse(conf.IP_WHITE_LIST) : []

const checkDayAnonymousRequestLimitCounters = async (context, prefix, rawIp) => {
    const ip = rawIp.split(':').pop()
    const key = [prefix, 'ip', ip].filter(Boolean).join(':')
    const byIpCounter = await REDIS_GUARD.incrementDayCounter(key)
    if (byIpCounter > MAX_ANONYMOUS_REQUESTS_BY_DAY && !IP_WHITE_LIST.includes(ip)) {
        throw new GQLError(GQL_ERRORS.DAILY_REQUEST_LIMIT_FOR_IP_REACHED, context)
    }
}


module.exports = {
    checkDayAnonymousRequestLimitCounters,
}
