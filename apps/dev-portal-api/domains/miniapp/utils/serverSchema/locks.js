const { KVLocker } = require('@open-condo/keystone/locks')

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

module.exports = {
    locker,
}
