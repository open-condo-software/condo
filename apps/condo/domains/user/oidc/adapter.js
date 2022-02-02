// npm i ioredis@^4.0.0
const Redis = require('ioredis') // eslint-disable-line import/no-unresolved
const isEmpty = require('lodash/isEmpty')

const DEBUG = false
let REDIS = null
const GRANTABLE = new Set([
    'AccessToken',
    'AuthorizationCode',
    'RefreshToken',
    'DeviceCode',
    'BackchannelAuthenticationRequest',
])

const CONSUMABLE = new Set([
    'AuthorizationCode',
    'RefreshToken',
    'DeviceCode',
    'BackchannelAuthenticationRequest',
])

function grantKeyFor (id) {
    return `grant:${id}`
}

function userCodeKeyFor (userCode) {
    return `userCode:${userCode}`
}

function uidKeyFor (uid) {
    return `uid:${uid}`
}

class AdapterFactory {
    constructor (name) {
        // TODO(pahaz): store Client inside keystone gql and others models inside Redis!
        return new RedisAdapter(name)
    }
}

class RedisAdapter {
    constructor (name) {
        if (DEBUG) console.log(name)
        this.name = name

        if (REDIS === null) REDIS = new Redis(process.env.OIDC_REDIS_URL, { keyPrefix: 'oidc:' })
        this.client = REDIS
    }

    key (id) {
        return `${this.name}:${id}`
    }

    async destroy (id) {
        const key = this.key(id)
        await this.client.del(key)
    }

    async consume (id) {
        await this.client.hset(this.key(id), 'consumed', Math.floor(Date.now() / 1000))
    }

    async find (id) {
        if (DEBUG) console.log('find', this.name, id)

        const data = CONSUMABLE.has(this.name)
            ? await this.client.hgetall(this.key(id))
            : await this.client.get(this.key(id))

        if (isEmpty(data)) {
            return undefined
        }

        if (typeof data === 'string') {
            return JSON.parse(data)
        }
        const { payload, ...rest } = data
        return {
            ...rest,
            ...JSON.parse(payload),
        }
    }

    async findByUid (uid) {
        const id = await this.client.get(uidKeyFor(uid))
        return this.find(id)
    }

    async findByUserCode (userCode) {
        const id = await this.client.get(userCodeKeyFor(userCode))
        return this.find(id)
    }

    async upsert (id, payload, expiresIn) {
        if (DEBUG) console.log('upsert', this.name, id)
        const key = this.key(id)
        const store = CONSUMABLE.has(this.name)
            ? { payload: JSON.stringify(payload) } : JSON.stringify(payload)

        const multi = this.client.multi()
        multi[CONSUMABLE.has(this.name) ? 'hmset' : 'set'](key, store)

        if (expiresIn) {
            multi.expire(key, expiresIn)
        }

        if (GRANTABLE.has(this.name) && payload.grantId) {
            const grantKey = grantKeyFor(payload.grantId)
            multi.rpush(grantKey, key)
            // if you're seeing grant key lists growing out of acceptable proportions consider using LTRIM
            // here to trim the list to an appropriate length
            const ttl = await this.client.ttl(grantKey)
            if (expiresIn > ttl) {
                multi.expire(grantKey, expiresIn)
            }
        }

        if (payload.userCode) {
            const userCodeKey = userCodeKeyFor(payload.userCode)
            multi.set(userCodeKey, id)
            multi.expire(userCodeKey, expiresIn)
        }

        if (payload.uid) {
            const uidKey = uidKeyFor(payload.uid)
            multi.set(uidKey, id)
            multi.expire(uidKey, expiresIn)
        }

        await multi.exec()
    }

    async revokeByGrantId (grantId) { // eslint-disable-line class-methods-use-this
        if (DEBUG) console.log('revokeByGrantId', this.name, grantId)
        const multi = this.client.multi()
        const tokens = await this.client.lrange(grantKeyFor(grantId), 0, -1)
        tokens.forEach((token) => multi.del(token))
        multi.del(grantKeyFor(grantId))
        await multi.exec()
    }

}

module.exports = AdapterFactory
