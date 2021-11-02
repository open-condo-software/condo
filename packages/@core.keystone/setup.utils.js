const { v5: uuidv5 } = require('uuid')

const { KnexAdapter } = require('@keystonejs/adapter-knex')
const { MongooseAdapter } = require('@keystonejs/adapter-mongoose')
const IORedis = require('ioredis')
const session = require('express-session')
const RedisStore = require('connect-redis')(session)

function _makeid (length) {
    let result = ''
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const charactersLength = characters.length
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength))
    }
    return result
}

function getCookieSecret (cookieSecret) {
    if (!cookieSecret) {
        if (process.env.NODE_ENV === 'production') {
            throw new TypeError('getCookieSecret() call without cookieSecret (check the COOKIE_SECRET environment)')
        }
        return undefined
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

function getAdapter (databaseUrl) {
    if (!databaseUrl) throw new TypeError('getAdapter() call without databaseUrl')
    if (typeof databaseUrl !== 'string') throw new TypeError('getAdapter() databaseUrl is not a string')
    if (databaseUrl.startsWith('mongodb')) {
        return new MongooseAdapter({ mongoUri: databaseUrl })
    } else if (databaseUrl.startsWith('postgres')) {
        return new KnexAdapter({ knexOptions: { connection: databaseUrl } })
    } else if (databaseUrl.startsWith('undefined')) {
        // NOTE: case for build time!
        const adapter = new MongooseAdapter()
        adapter.connect = () => {throw new Error('UndefinedAdapter.connect() call!')}
        adapter.postConnect = () => {throw new Error('UndefinedAdapter.postConnect() call!')}
        adapter.checkDatabaseVersion = () => {throw new Error('UndefinedAdapter.checkDatabaseVersion() call!')}
        return adapter
    } else {
        throw new Error(`getAdapter() call with unknown schema: ${databaseUrl}`)
    }
}

function prepareDefaultKeystoneConfig (conf) {
    const redisClient = new IORedis(conf.REDIS_URL)
    const sessionStore = new RedisStore({ client: redisClient })

    return {
        cookieSecret: getCookieSecret(conf.COOKIE_SECRET),
        cookie: {
            sameSite: false,
            secure: false,
            maxAge: conf.COOKIE_MAX_AGE || 1000 * 60 * 60 * 24 * 130,
        },
        name: conf.PROJECT_NAME,
        adapter: getAdapter(conf.DATABASE_URL),
        defaultAccess: { list: false, field: true, custom: false },
        queryLimits: { maxTotalResults: 1000 },
        sessionStore,
    }
}

module.exports = {
    getCookieSecret,
    getAdapter,
    prepareDefaultKeystoneConfig,
}
