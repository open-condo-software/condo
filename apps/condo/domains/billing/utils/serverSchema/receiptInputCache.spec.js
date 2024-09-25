const { faker } = require('@faker-js/faker')
const uniq = require('lodash/uniq')

const { getRedisClient } = require('@open-condo/keystone/redis')

const { ReceiptInputCache } = require('@condo/domains/billing/utils/serverSchema/receiptInputCache')
const { createJSONReceipt } = require('@condo/domains/billing/utils/testSchema/mixins/billing')


const REDIS_CLIENT_NAME = 'receipt-input-cache-test'
    
describe('receiptInputCache', () => {
    const getRedisKey = (billingContextId, importId, controlSum) => `${REDIS_CLIENT_NAME}:${billingContextId}:${importId}:${controlSum}`
    const redisClient = getRedisClient(REDIS_CLIENT_NAME, 'cache')
    const billingContextId = faker.random.alphaNumeric(10)

    let cache
    beforeEach(async () => {
        cache = new ReceiptInputCache(redisClient, getRedisKey, billingContextId)
    })
    
    describe('hash', () => {
        it('gives same hash for same receipt', () => {
            const receiptInput = createJSONReceipt()

            const controlSums = []
            for (let i = 0; i < 10; i++) {
                const { controlSum } = cache.getReceiptCacheKeyData(receiptInput)
                controlSums.push(controlSum)
            }
            const uniqueControlSums = uniq(controlSums)
            expect(uniqueControlSums).toHaveLength(1)
        })

        it('calculates different hash for different receipts', () => {
            const receiptInput = createJSONReceipt()
            const changedReceiptInput = createJSONReceipt({
                ...receiptInput,
                toPay: receiptInput.toPay + '0',
            })
            const anotherReceiptInput = createJSONReceipt()

            const { controlSum } = cache.getReceiptCacheKeyData(receiptInput)
            const { controlSum: changedControlSum } = cache.getReceiptCacheKeyData(changedReceiptInput)
            const { controlSum: anotherControlSum } = cache.getReceiptCacheKeyData(anotherReceiptInput)

            expect(controlSum).not.toEqual(changedControlSum)
            expect(controlSum).not.toEqual(anotherControlSum)
            expect(changedControlSum).not.toEqual(anotherControlSum)
        })
    })
    
    describe('cache', () => {

        it('stores receipt id in cache by context, importId and controlSum', async () => {
            const receiptInput = createJSONReceipt()
            const receiptId = faker.random.alphaNumeric(10)
            const importId = receiptInput.importId

            const { controlSum } = cache.getReceiptCacheKeyData(receiptInput)
            await cache.setReceiptControlSum(receiptInput, null, receiptId)
            const cachedIdFromClient = await redisClient.get(getRedisKey(billingContextId, importId, controlSum))
            const cachedIdFromCache = await cache.getReceiptId(receiptInput)

            expect(cachedIdFromClient).toEqual(receiptId)
            expect(cachedIdFromCache).toEqual(receiptId)
        })

        it('stores checkSum and importId by index', () => {
            const receiptInputs = [1, 2, 3, 4, 5].map(() => createJSONReceipt())
            const cacheKeyDatas = receiptInputs.map((receiptInput, index) => cache.getReceiptCacheKeyData(receiptInput, index))

            for (let index = 0; index < receiptInputs.length; index++) {
                const receiptInput = receiptInputs[index]
                const cacheKeyData = cacheKeyDatas[index]
                const storedCacheKeyData = cache.getReceiptCacheKeyData(null, index)

                expect(cacheKeyData).toMatchObject(storedCacheKeyData)

                const newCacheKeyData = cache.getReceiptCacheKeyData(receiptInput)
                expect(newCacheKeyData).toMatchObject(storedCacheKeyData)
            }
        })

        it('can save stored data by index', async () => {
            const receiptCount = 10
            const receiptInputs = []
            const receiptIds = []


            for (let index = 0; index < receiptCount; index++) {
                const receiptInput = createJSONReceipt()
                receiptInputs.push(receiptInput)
                receiptIds.push(faker.random.alphaNumeric(10))
                cache.getReceiptCacheKeyData(receiptInput, index)
            }

            for (let index = 0; index < receiptCount; index++) {
                await cache.setReceiptControlSum(null, index, receiptIds[index])
            }

            for (let index = 0; index < receiptCount; index++) {
                const cachedId = await cache.getReceiptId(receiptInputs[index])
                expect(cachedId).toEqual(receiptIds[index])
            }
        })

    })

})