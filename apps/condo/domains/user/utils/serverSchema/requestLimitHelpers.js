const dayjs = require('dayjs')

const conf = require('@open-condo/config')
const { GQLError } = require('@open-condo/keystone/errors')

const {
    MAX_REQUESTS_FOR_IP_PER_DAY,
    MAX_REQUESTS_FOR_PHONE_PER_DAY,
    MAX_REQUESTS_FOR_USER_PER_DAY,
    MAX_REQUESTS_FOR_EMAIL_PER_DAY,
    MAX_TOTAL_REQUESTS_FOR_USER,
    MAX_TOTAL_REQUESTS_FOR_EMAIL,
    MAX_TOTAL_REQUESTS_FOR_PHONE,
} = require('@condo/domains/user/constants/common')
const { GQL_ERRORS } = require('@condo/domains/user/constants/errors')
const { RedisGuard } = require('@condo/domains/user/utils/serverSchema/guards')


const REDIS_GUARD = new RedisGuard()
const MAX_REQUESTS_BY_IP_PER_DAY = Number(conf['MAX_REQUESTS_FOR_IP_PER_DAY']) || MAX_REQUESTS_FOR_IP_PER_DAY
const MAX_REQUESTS_BY_PHONE_PER_DAY = Number(conf['MAX_REQUESTS_FOR_PHONE_PER_DAY']) || MAX_REQUESTS_FOR_PHONE_PER_DAY
const MAX_REQUESTS_BY_EMAIL_PER_DAY = Number(conf['MAX_REQUESTS_FOR_EMAIL_PER_DAY']) || MAX_REQUESTS_FOR_EMAIL_PER_DAY
const MAX_REQUESTS_BY_USER_PER_DAY = Number(conf['MAX_REQUESTS_FOR_USER_PER_DAY']) || MAX_REQUESTS_FOR_USER_PER_DAY
const MAX_TOTAL_REQUESTS_BY_USER = Number(conf['MAX_TOTAL_REQUESTS_FOR_USER']) || MAX_TOTAL_REQUESTS_FOR_USER
const MAX_TOTAL_REQUESTS_BY_EMAIL = Number(conf['MAX_TOTAL_REQUESTS_FOR_EMAIL']) || MAX_TOTAL_REQUESTS_FOR_EMAIL
const MAX_TOTAL_REQUESTS_BY_PHONE = Number(conf['MAX_TOTAL_REQUESTS_FOR_PHONE']) || MAX_TOTAL_REQUESTS_FOR_PHONE
const IP_WHITE_LIST = conf.IP_WHITE_LIST ? JSON.parse(conf.IP_WHITE_LIST) : []
const PHONE_WHITE_LIST = conf.PHONE_WHITE_LIST ? JSON.parse(conf.PHONE_WHITE_LIST) : []
const EMAIL_WHITE_LIST = conf.EMAIL_WHITE_LIST ? JSON.parse(conf.EMAIL_WHITE_LIST) : []
const USER_ID_WHITE_LIST = conf.USER_ID_WHITE_LIST ? JSON.parse(conf.USER_ID_WHITE_LIST) : []

const checkDailyRequestLimitCountersByIp = async (context, prefix, rawIp, maxRequests = MAX_REQUESTS_BY_IP_PER_DAY) => {
    const ip = rawIp.split(':').pop()
    const key = [prefix, 'ip', ip].filter(Boolean).join(':')
    const byIpCounter = await REDIS_GUARD.incrementDayCounter(key)
    if (byIpCounter > maxRequests && !IP_WHITE_LIST.includes(ip)) {
        throw new GQLError(GQL_ERRORS.DAILY_REQUEST_LIMIT_FOR_IP_REACHED, context)
    }
}

const checkDailyRequestLimitCountersByPhone = async (context, prefix, phone, maxRequests = MAX_REQUESTS_BY_PHONE_PER_DAY) => {
    const key = [prefix, 'phone', phone].filter(Boolean).join(':')
    const byPhoneCounter = await REDIS_GUARD.incrementDayCounter(key)
    if (byPhoneCounter > maxRequests && !PHONE_WHITE_LIST.includes(phone)) {
        throw new GQLError(GQL_ERRORS.DAILY_REQUEST_LIMIT_FOR_PHONE_REACHED, context)
    }
}

const checkTotalRequestLimitCountersByPhone = async (context, prefix, phone, maxRequests = MAX_TOTAL_REQUESTS_BY_PHONE) => {
    if (!Number.isSafeInteger(maxRequests)) throw new Error('"maxRequests" should be number')
    if (maxRequests < 0) throw new Error('"maxRequests" should be greater than 0')

    const key = [prefix, 'total', 'phone', phone].filter(Boolean).join(':')
    const ttl = Math.ceil(dayjs().add(100, 'years').diff(dayjs(), 'seconds', true))
    const byPhoneCounter = await REDIS_GUARD.incrementCustomCounter(key, ttl)
    if (byPhoneCounter > maxRequests && !PHONE_WHITE_LIST.includes(phone)) {
        throw new GQLError(GQL_ERRORS.TOTAL_REQUEST_LIMIT_FOR_PHONE_REACHED, context)
    }
}

const checkDailyRequestLimitCountersByEmail = async (context, prefix, email, maxRequests = MAX_REQUESTS_BY_EMAIL_PER_DAY) => {
    const key = [prefix, 'email', email].filter(Boolean).join(':')
    const byEmailCounter = await REDIS_GUARD.incrementDayCounter(key)
    if (byEmailCounter > maxRequests && !EMAIL_WHITE_LIST.includes(email)) {
        throw new GQLError(GQL_ERRORS.DAILY_REQUEST_LIMIT_FOR_EMAIL_REACHED, context)
    }
}

const checkTotalRequestLimitCountersByEmail = async (context, prefix, email, maxRequests = MAX_TOTAL_REQUESTS_BY_EMAIL) => {
    if (!Number.isSafeInteger(maxRequests)) throw new Error('"maxRequests" should be number')
    if (maxRequests < 0) throw new Error('"maxRequests" should be greater than 0')

    const key = [prefix, 'total', 'email', email].filter(Boolean).join(':')
    const ttl = Math.ceil(dayjs().add(100, 'years').diff(dayjs(), 'seconds', true))
    const byEmailCounter = await REDIS_GUARD.incrementCustomCounter(key, ttl)
    if (byEmailCounter > maxRequests && !EMAIL_WHITE_LIST.includes(email)) {
        throw new GQLError(GQL_ERRORS.TOTAL_REQUEST_LIMIT_FOR_EMAIL_REACHED, context)
    }
}

const checkDailyRequestLimitCountersByUser = async (context, prefix, userId, maxRequests = MAX_REQUESTS_BY_USER_PER_DAY) => {
    const key = [prefix, 'userId', userId].filter(Boolean).join(':')
    const byUserIdCounter = await REDIS_GUARD.incrementDayCounter(key)
    if (byUserIdCounter > maxRequests && !USER_ID_WHITE_LIST.includes(userId)) {
        throw new GQLError(GQL_ERRORS.DAILY_REQUEST_LIMIT_FOR_USER_REACHED, context)
    }
}

const checkTotalRequestLimitCountersByUser = async (context, prefix, userId, maxRequests = MAX_TOTAL_REQUESTS_BY_USER) => {
    if (!Number.isSafeInteger(maxRequests)) throw new Error('"maxRequests" should be number')
    if (maxRequests < 0) throw new Error('"maxRequests" should be greater than 0')

    const key = [prefix, 'total', 'userId', userId].filter(Boolean).join(':')
    const ttl = Math.ceil(dayjs().add(100, 'years').diff(dayjs(), 'seconds', true))
    const byUserIdCounter = await REDIS_GUARD.incrementCustomCounter(key, ttl)
    if (byUserIdCounter > maxRequests && !USER_ID_WHITE_LIST.includes(userId)) {
        throw new GQLError(GQL_ERRORS.TOTAL_REQUEST_LIMIT_FOR_USER_REACHED, context)
    }
}

module.exports = {
    checkDailyRequestLimitCountersByIp,
    checkDailyRequestLimitCountersByPhone,
    checkDailyRequestLimitCountersByEmail,
    checkDailyRequestLimitCountersByUser,
    checkTotalRequestLimitCountersByUser,
    checkTotalRequestLimitCountersByPhone,
    checkTotalRequestLimitCountersByEmail,
}
