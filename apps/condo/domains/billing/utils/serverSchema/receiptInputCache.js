const get = require('lodash/get')
const set = require('lodash/set')

const { CONTROL_SUM_TTL_IN_MS } = require('@condo/domains/billing/constants/registerBillingReceiptService')
const { md5 } = require('@condo/domains/common/utils/crypto')

class ReceiptInputCache {

    /**
     * @param redisClient
     * @param getRedisKey {function(billingContextId:string, controlSum:string):string}
     * @param billingContextId
     */
    constructor (redisClient, getRedisKey, billingContextId) {
        this.cacheKeyDatas = {}
        this.redisClient = redisClient
        this.redisKey = getRedisKey
        this.billingContextId = billingContextId
    }

    getReceiptImportId (receiptInput, index) {
        const cacheKeyData = this.getReceiptCacheKeyData(receiptInput, index)
        if (!cacheKeyData) {
            return Promise.resolve(null)
        }
        const { controlSum } = cacheKeyData
        return this.redisClient.get(this.redisKey(this.billingContextId, controlSum))
    }

    setReceiptImportId (receiptInput, index) {
        const cacheKeyData = this.getReceiptCacheKeyData(receiptInput, index)
        if (!cacheKeyData) {
            return Promise.resolve(null)
        }
        const { controlSum, importId } = cacheKeyData
        return this.redisClient.set(this.redisKey(this.billingContextId, controlSum), importId, 'EX', CONTROL_SUM_TTL_IN_MS)
    }

    getReceiptCacheKeyData (receiptInput, index) {
        if ((typeof index === 'number' || typeof index === 'string') && this.cacheKeyDatas[index]) {
            return this.cacheKeyDatas[index]
        }
        if (!receiptInput || !receiptInput.importId) {
            return null
        }
        const importId = receiptInput.importId
        
        // if receipt json will have fields in different order
        receiptInput = this.normalizeReceiptInput(receiptInput)
        
        const controlSum = md5(JSON.stringify(receiptInput))

        const cacheKeyData = { controlSum, importId }
        if (typeof index === 'number' || typeof index === 'string') {
            this.cacheKeyDatas[index] = cacheKeyData
        }
        return cacheKeyData
    }

    normalizeReceiptInput (obj) {
        const normalized = Array.isArray(obj) ? [] : {}
        const stack = []

        Object.keys(obj).sort().forEach(key => stack.push([key]))

        while (stack.length > 0) {
            const path = stack.pop()
            const value = get(obj, path)

            if (typeof value !== 'object' || value === null || value === undefined) {
                set(normalized, path, value)
                continue
            }

            // do not sort array as they can change order of items
            if (Array.isArray(value)) {
                set(normalized, path, [])
                value.forEach((item, index) => stack.push([...path, index]))
                continue
            }

            set(normalized, path, {})
            const keys = Object.keys(value).sort()
            keys.forEach(key => stack.push([...path, key]))
        }
        return normalized
    }

}

module.exports = {
    ReceiptInputCache,
}