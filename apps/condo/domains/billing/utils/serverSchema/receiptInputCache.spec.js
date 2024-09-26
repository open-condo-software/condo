const { faker } = require('@faker-js/faker')
const uniq = require('lodash/uniq')

const { getRedisClient } = require('@open-condo/keystone/redis')

const { ReceiptInputCache } = require('@condo/domains/billing/utils/serverSchema/receiptInputCache')
const { createJSONReceipt } = require('@condo/domains/billing/utils/testSchema/mixins/billing')


const REDIS_CLIENT_NAME = 'receipt-input-cache-test'
    
describe('receiptInputCache', () => {
    const getRedisKey = (billingContextId, controlSum) => `${REDIS_CLIENT_NAME}:${billingContextId}:${controlSum}`
    const redisClient = getRedisClient(REDIS_CLIENT_NAME, 'cache')
    const billingContextId = faker.random.alphaNumeric(10)

    let cache
    beforeEach(async () => {
        cache = new ReceiptInputCache(redisClient, getRedisKey, billingContextId)
    })
    
    describe('hash', () => {
        it('gives same hash for same receipt', () => {
            const receiptInput = createJSONReceipt()
            const anotherCache = new ReceiptInputCache(redisClient, getRedisKey, billingContextId)

            const controlSums = []
            for (const cacheHelper of [cache, anotherCache]) {
                for (let i = 0; i < 10; i++) {
                    const { controlSum } = cacheHelper.getReceiptCacheKeyData(receiptInput)
                    controlSums.push(controlSum)
                }
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

        describe('order', () => {
            it('calculates same hash if order of fields is different', () => {
                let receiptInput = createJSONReceipt()
                const { controlSum } = cache.getReceiptCacheKeyData(receiptInput)

                let entries = Object.entries(receiptInput)
                entries = faker.helpers.shuffle(entries)
                receiptInput = Object.fromEntries(entries)
                const { controlSum: shuffledControlSum } = cache.getReceiptCacheKeyData(receiptInput)

                expect(shuffledControlSum).toEqual(controlSum)
            })

            it('calculates different hash if order of services is different', () => {
                const receiptInput = createJSONReceipt()
                const { controlSum } = cache.getReceiptCacheKeyData(receiptInput)

                faker.helpers.shuffle(receiptInput.services)
                const { controlSum: shuffledControlSum } = cache.getReceiptCacheKeyData(receiptInput)

                expect(shuffledControlSum).not.toEqual(controlSum)
            })
        })
    })
    
    describe('cache', () => {

        it('stores receipt importId in cache by context and controlSum', async () => {
            const receiptInput = createJSONReceipt()
            const importId = receiptInput.importId

            const { controlSum } = cache.getReceiptCacheKeyData(receiptInput)
            await cache.setReceiptImportId(receiptInput, null)
            const cachedImportIdFromClient = await redisClient.get(getRedisKey(billingContextId, controlSum))
            const cachedImportIdFromCache = await cache.getReceiptImportId(receiptInput)

            expect(cachedImportIdFromClient).toEqual(importId)
            expect(cachedImportIdFromCache).toEqual(importId)
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
            const receiptImportIds = []

            for (let index = 0; index < receiptCount; index++) {
                const receiptInput = createJSONReceipt()
                receiptInputs.push(receiptInput)
                receiptImportIds.push(receiptInput.importId)
                cache.getReceiptCacheKeyData(receiptInput, index)
            }

            for (let index = 0; index < receiptCount; index++) {
                await cache.setReceiptImportId(null, index)
            }

            for (let index = 0; index < receiptCount; index++) {
                const cachedImportId = await cache.getReceiptImportId(receiptInputs[index])
                expect(cachedImportId).toEqual(receiptImportIds[index])
            }
        })

        it('does not store receipts with no importId', async () => {
            const receiptInput = createJSONReceipt()
            receiptInput.importId = null

            const cacheKeyData = cache.getReceiptCacheKeyData(receiptInput)
            expect(cacheKeyData).toBeNull()

            await cache.setReceiptImportId(receiptInput, null)
            const cachedImportIdFromCache = await cache.getReceiptImportId(receiptInput)
            expect(cachedImportIdFromCache).toBeNull()
        })

    })

})