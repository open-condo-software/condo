// The RedisAdapter is based on: https://github.com/panva/node-oidc-provider/blob/main/example/adapters/redis.js

const { isEmpty } = require('lodash')

const { getRedisClient } = require('@open-condo/keystone/redis')

const OIDC_REDIS_KEY_PREFIX = 'oidc'

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
    return `${OIDC_REDIS_KEY_PREFIX}:grant:${id}`
}

function userCodeKeyFor (userCode) {
    return `${OIDC_REDIS_KEY_PREFIX}:userCode:${userCode}`
}

function uidKeyFor (uid) {
    return `${OIDC_REDIS_KEY_PREFIX}:uid:${uid}`
}

class RedisAdapter {
    get redis () {
        if (!this._redis) this._redis = getRedisClient('oidc')
        return this._redis
    }

    constructor (name) {
        this.name = name
    }

    key (id) {
        return `${OIDC_REDIS_KEY_PREFIX}:${this.name}:${id}`
    }

    async destroy (id) {
        const key = this.key(id)
        await this.redis.del(key)
    }

    async consume (id) {
        await this.redis.hset(this.key(id), 'consumed', Math.floor(Date.now() / 1000))
    }

    async find (id) {
        const data = CONSUMABLE.has(this.name)
            ? await this.redis.hgetall(this.key(id))
            : await this.redis.get(this.key(id))

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
        const id = await this.redis.get(uidKeyFor(uid))
        return this.find(id)
    }

    async findByUserCode (userCode) {
        const id = await this.redis.get(userCodeKeyFor(userCode))
        return this.find(id)
    }

    async upsert (id, payload, expiresIn) {
        const key = this.key(id)
        const store = CONSUMABLE.has(this.name)
            ? { payload: JSON.stringify(payload) } : JSON.stringify(payload)

        const multi = this.redis.multi()
        multi[CONSUMABLE.has(this.name) ? 'hmset' : 'set'](key, store)

        if (expiresIn) {
            multi.expire(key, expiresIn)
        }

        if (GRANTABLE.has(this.name) && payload.grantId) {
            const grantKey = grantKeyFor(payload.grantId)
            multi.rpush(grantKey, key)
            // if you're seeing grant key lists growing out of acceptable proportions consider using LTRIM
            // here to trim the list to an appropriate length
            const ttl = await this.redis.ttl(grantKey)
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
        const multi = this.redis.multi()
        const tokens = await this.redis.lrange(grantKeyFor(grantId), 0, -1)
        tokens.forEach((token) => multi.del(token))
        multi.del(grantKeyFor(grantId))
        await multi.exec()
    }

}

module.exports = {
    RedisAdapter,
}
