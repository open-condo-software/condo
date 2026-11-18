const { getLogger } = require('@open-condo/keystone/logging')

const logger = getLogger('bulkNormalize')

class BulkNormalizeTimeout extends Error {}

function limitConcurrency (concurrency, signal) {
    let active = 0
    const queue = []

    function next () {
        if (active >= concurrency || !queue.length) return
        active++
        queue.shift()()
    }

    return task => new Promise((resolve, reject) => {
        queue.push(async () => {
            try {
                signal.throwIfAborted()
                resolve(await task())
            } catch (err) {
                reject(err)
            } finally {
                active--
                next()
            }
        })
        next()
    })
}

function memoizeAsync (load, keyOf = key => key) {
    const results = new Map()
    return key => {
        const id = keyOf(key)
        if (!results.has(id)) results.set(id, Promise.resolve().then(() => load(key)))
        return results.get(id)
    }
}

async function providerResult (provider, call) {
    try {
        return { value: await call(), failed: false }
    } catch (err) {
        if (err instanceof BulkNormalizeTimeout) throw err
        // Avoid recording full addresses and URLs in provider failure diagnostics.
        logger.warn({ msg: 'Bulk normalize provider unavailable', entity: provider, data: { errorName: err.name } })
        return { value: null, failed: true }
    }
}

module.exports = { BulkNormalizeTimeout, limitConcurrency, memoizeAsync, providerResult }
