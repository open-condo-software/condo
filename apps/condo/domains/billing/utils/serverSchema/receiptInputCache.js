const { get } = require('lodash')
const pick = require('lodash/pick')

const { CONTROL_SUM_TTL_IN_MS } = require('@condo/domains/billing/constants/registerBillingReceiptService')
const { md5 } = require('@condo/domains/common/utils/crypto')

const RECEIPT_INPUT_FIELDS_FOR_CACHE = {
    common: ['address', 'accountNumber', 'toPay', 'toPayDetails', 'services', 'category', 'month', 'year', 'tin', 'routingNumber', 'bankAccount'],
    addressMeta: ['globalId', 'unitName', 'unitType'],
    accountMeta: ['globalId', 'unitName', 'fullName', 'isClosed', 'ownerType'],
}

class ReceiptInputCache {

    /**
     * @param redisClient
     * @param getRedisKey {function(billingContextId:string, importId:string, controlSum:string):string}
     * @param billingContextId
     */
    constructor (redisClient, getRedisKey, billingContextId) {
        this.cacheKeyDatas = {}
        this.redisClient = redisClient
        this.redisKey = getRedisKey
        this.billingContextId = billingContextId
    }

    getReceiptId (receiptInput, index) {
        const cacheKeyData = this.getReceiptCacheKeyData(receiptInput, index)
        if (!cacheKeyData) {
            return Promise.resolve(null)
        }
        const { controlSum, importId } = cacheKeyData
        return this.redisClient.get(this.redisKey(this.billingContextId, importId, controlSum))
    }

    setReceiptControlSum (receiptInput, index, id) {
        const cacheKeyData = this.getReceiptCacheKeyData(receiptInput, index)
        if (!cacheKeyData) {
            return Promise.resolve(null)
        }
        const { controlSum, importId } = cacheKeyData
        return this.redisClient.set(this.redisKey(this.billingContextId, importId, controlSum), id, 'EX', CONTROL_SUM_TTL_IN_MS)
    }

    getReceiptCacheKeyData (receiptInput, index) {
        if ((typeof index === 'number' || typeof index === 'string') && this.cacheKeyDatas[index]) {
            return this.cacheKeyDatas[index]
        }
        if (!receiptInput || !receiptInput.importId) {
            return null
        }
        const importId = receiptInput.importId
        receiptInput = this.pickReceiptInputFieldsForCache(receiptInput)
        const controlSum = md5(JSON.stringify(receiptInput))

        const cacheKeyData = { controlSum, importId }
        if (typeof index === 'number' || typeof index === 'string') {
            this.cacheKeyDatas[index] = cacheKeyData
            return this.cacheKeyDatas[index]
        }
        return cacheKeyData
    }

    pickReceiptInputFieldsForCache (receiptInput) {
        const addressMeta = get(receiptInput, 'addressMeta')
        const accountMeta = get(receiptInput, 'accountMeta')
        return {
            ...pick(receiptInput, RECEIPT_INPUT_FIELDS_FOR_CACHE.common),
            addressMeta: pick(addressMeta, RECEIPT_INPUT_FIELDS_FOR_CACHE.addressMeta),
            accountMeta: pick(accountMeta, RECEIPT_INPUT_FIELDS_FOR_CACHE.accountMeta),
        }
    }
}

module.exports = {
    ReceiptInputCache,
}