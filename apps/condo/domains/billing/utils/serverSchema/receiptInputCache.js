const { CONTROL_SUM_TTL_IN_MS } = require('@condo/domains/billing/constants/registerBillingReceiptService')
const { md5 } = require('@condo/domains/common/utils/crypto')
const { canonicalize } = require('@condo/domains/common/utils/object.utils')

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
        return JSON.parse(canonicalize(obj))
    }
}

module.exports = {
    ReceiptInputCache,
}