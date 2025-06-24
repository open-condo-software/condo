const { KnexAdapter } = require('@open-keystone/adapter-knex')
const { MongooseAdapter } = require('@open-keystone/adapter-mongoose')
const connectRedis = require('connect-redis')
const session = require('express-session')
const { v5: uuidv5 } = require('uuid')

const conf = require('@open-condo/config')
const { getKVClient } = require('@open-condo/keystone/kv')

const { FakeDatabaseAdapter, BalancingReplicaKnexAdapter } = require('./databaseAdapters')

const IS_BUILD = conf['DATABASE_URL'] === 'undefined'

const RedisStore = connectRedis(session)

const HTTPS_REGEXP = /^https:/

function _makeid (length) {
    let result = ''
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const charactersLength = characters.length
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength))
    }
    return result
}

/** @deprecated use prepareKeystone */
function getCookieSecret (cookieSecret) {
    if (!cookieSecret) {
        if (IS_BUILD) return undefined
        throw new TypeError('getCookieSecret() call without cookieSecret (check the COOKIE_SECRET environment)')
    }
    if (typeof cookieSecret !== 'string') throw new TypeError('getCookieSecret() cookieSecret is not a string')
    if (cookieSecret.startsWith('undefined')) {
        // NOTE: case for build time!
        return uuidv5(_makeid(10), uuidv5.DNS)
    } else if (cookieSecret.startsWith('random')) {
        // NOTE: some production-ready secret! but it will change every time and expire sessions!
        return uuidv5(_makeid(10), uuidv5.DNS)
    } else {
        if (cookieSecret.length < 10) return uuidv5(cookieSecret, uuidv5.DNS)
        return cookieSecret
    }
}

/** @deprecated use prepareKeystone */
function getAdapter (databaseUrl) {
    if (!databaseUrl) throw new TypeError('getAdapter() call without databaseUrl')
    if (typeof databaseUrl !== 'string') throw new TypeError('getAdapter() databaseUrl is not a string')
    if (databaseUrl.startsWith('mongodb')) {
        return new MongooseAdapter({ mongoUri: databaseUrl })
    } else if (databaseUrl.startsWith('postgres')) {
        return new KnexAdapter({ knexOptions: { connection: databaseUrl, pool: { min: 0, max: 3 } } })
    } else if (databaseUrl.startsWith('undefined')) {
        // NOTE: case for build time!
        return new FakeDatabaseAdapter()
    } else if (databaseUrl.startsWith('custom')) {
        return new BalancingReplicaKnexAdapter({ databaseUrl })
    } else {
        throw new Error(`getAdapter() call with unknown schema: ${databaseUrl}`)
    }
}

function getCookieOptions (conf) {
    return {
        sameSite: HTTPS_REGEXP.test(conf.SERVER_URL) && conf.NODE_ENV === 'production' ? 'None' : 'Lax',
        // NOTE(pahaz): Apollo server client doesn't work with secure=true! Need to research why
        secure: HTTPS_REGEXP.test(conf.SERVER_URL) && conf.NODE_ENV === 'production',
        httpOnly: conf.DISABLE_HTTP_ONLY_COOKIE !== 'true',
        // 1000 * (Math.pow(2, 31) - 1) IS APPROXIMATELY 68 YEARS IN MILLISECONDS :)
        maxAge: conf.COOKIE_MAX_AGE || 1000 * (Math.pow(2, 31) - 1),
    }
}

/** @deprecated use prepareKeystone */
function prepareDefaultKeystoneConfig (conf) {
    const config = {
        cookieSecret: getCookieSecret(conf.COOKIE_SECRET),
        cookie: getCookieOptions(conf),
        name: conf.PROJECT_NAME,
        defaultAccess: { list: false, field: true, custom: false },
        queryLimits: { maxTotalResults: 1000 },
        appVersion: {
            version: '1.0.0',
            addVersionToHttpHeaders: false,
            access: true,
        },
    }

    if (!IS_BUILD && (conf.VALKEY_URL || conf.REDIS_URL)) {
        const client = getKVClient()
        config.sessionStore = new RedisStore({ client })
    }

    config.adapter = getAdapter(conf.DATABASE_URL || 'undefined')

    return config
}

module.exports = {
    getCookieSecret,
    getAdapter,
    prepareDefaultKeystoneConfig,
    getCookieOptions,
}
