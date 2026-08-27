const { KVLocker } = require('@open-condo/keystone/locks')

const { AVAILABLE_ENVIRONMENTS } = require('@dev-portal-api/domains/miniapp/constants/publishing')

class AppLocker {
    constructor () {
        this.locker = new KVLocker({
            retryCount: 10,
            retryDelay: 500,
            retryJitter: 100,
            lockDuration: 60_000,
        })
    }

    async acquireAppLock (appId, environment) {
        const lockKey = `app:${appId}:${environment}`
        return await this.locker.acquire(lockKey)
    }
}

const locker = new AppLocker()

function wrapResolverWithEnvironmentLock (originalResolver) {
    return async function (parent, args, contextValue, info) {
        const { data: { app: { id }, environment } } = args
        const lock = await locker.acquireAppLock(id, environment)

        try {
            return await originalResolver(parent, args, contextValue, info)
        } finally {
            await lock.release()
        }
    }
}

function wrapResolverWithAllEnvironmentLock (originalResolver) {
    return async function (parent, args, contextValue, info) {
        const { data: { to: { app: { id: appId } } } } = args
        const locks = []

        try {
            // NOTE: need to acquire lock for all environments to prevent concurrent publishing from happening
            for (const env of AVAILABLE_ENVIRONMENTS) {
                const envLock = await locker.acquireAppLock(appId, env)
                locks.push(envLock)
            }
            return await originalResolver(parent, args, contextValue, info)
        } finally {
            await Promise.all(locks.map(lock => lock.release()))
        }
    }
}

module.exports = {
    locker,
    wrapResolverWithEnvironmentLock,
    wrapResolverWithAllEnvironmentLock,
}
