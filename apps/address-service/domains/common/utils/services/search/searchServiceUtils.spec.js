const { faker } = require('@faker-js/faker')

const { PULLENTI_PROVIDER } = require('@address-service/domains/common/constants/providers')

const { hashJSON, mergeAddressAndHelpers, createOrUpdateAddressWithSource } = require('./searchServiceUtils')

describe('Search service utils', () => {
    describe('hashJSON()', () => {
        test('hash should equals known value', () => {
            const obj = { a: 1, b: 2 }
            const hash = hashJSON(obj)
            expect(hash).toEqual('608de49a4600dbb5b173492759792e4a')
        })

        test('should return the same hash for objects with the same properties in different order', () => {
            const obj1 = { a: 1, b: 2 }
            const obj2 = { b: 2, a: 1 }
            const hash1 = hashJSON(obj1)
            const hash2 = hashJSON(obj2)
            expect(hash1).toEqual(hash2)
        })

        test('should return a different hash for objects with different properties', () => {
            const obj1 = { a: 1, b: 2 }
            const obj2 = { c: 3, d: 4 }
            const hash1 = hashJSON(obj1)
            const hash2 = hashJSON(obj2)
            expect(hash1).not.toEqual(hash2)
        })

        test('should return a different hash for objects with nested objects with different properties', () => {
            const obj1 = { a: 1, b: { c: 2, d: 3 } }
            const obj2 = { a: 1, b: { c: 3, d: 2 } }
            const hash1 = hashJSON(obj1)
            const hash2 = hashJSON(obj2)
            expect(hash1).not.toEqual(hash2)
        })

        test('should return the same hash for objects with nested objects with the same properties in different order', () => {
            const obj1 = { a: 1, b: { c: 2, d: 3 } }
            const obj2 = { a: 1, b: { d: 3, c: 2 } }
            const hash1 = hashJSON(obj1)
            const hash2 = hashJSON(obj2)
            expect(hash1).toEqual(hash2)
        })
    })

    describe('mergeAddressAndHelpers()', () => {
        test('merge result with given helpers should convert to known result', () => {
            const address = faker.address.streetAddress(true)
            const helpers = { tin: '593940145273' }
            const merged = mergeAddressAndHelpers(address, helpers)

            expect(merged).toEqual(`${address}|helpers:ef6b9990cbb9ed9ea9e3cc4687389e16`)
        })

        test('should return the same hash for helpers with the same properties in different order', () => {
            const helpers1 = { a: 1, b: 2 }
            const helpers2 = { b: 2, a: 1 }
            const address = faker.address.streetAddress(true)

            const merged1 = mergeAddressAndHelpers(address, helpers1)
            const merged2 = mergeAddressAndHelpers(address, helpers2)

            expect(merged1).toEqual(merged2)
        })

        test('should return the same address if there are no helpers', () => {
            const address = faker.address.streetAddress(true)

            const merged1 = mergeAddressAndHelpers(address)
            const merged2 = mergeAddressAndHelpers(address, {})
            const merged3 = mergeAddressAndHelpers(address, [])
            const merged4 = mergeAddressAndHelpers(address, null)
            const merged5 = mergeAddressAndHelpers(address, undefined)
            const merged6 = mergeAddressAndHelpers(address, '')
            const merged7 = mergeAddressAndHelpers(address, 'some string')
            const merged8 = mergeAddressAndHelpers(address, 42)

            expect(merged1).toEqual(address)
            expect(merged2).toEqual(address)
            expect(merged3).toEqual(address)
            expect(merged4).toEqual(address)
            expect(merged5).toEqual(address)
            expect(merged6).toEqual(address)
            expect(merged7).toEqual(address)
            expect(merged8).toEqual(address)
        })
    })

    describe('createOrUpdateAddressWithSource()', () => {
        const context = {}
        const addressServerUtils = {
            getOne: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({ id: 'test-address-id', address: 'test address', key: 'test-key', meta: {} }),
        }
        const addressSourceServerUtils = {
            getOne: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({ id: 'test-source-id' }),
            update: jest.fn().mockResolvedValue({ id: 'test-source-id' }),
        }
        const dvSender = { dv: 1, sender: { dv: 1, fingerprint: 'test' } }
        const addressData = {
            address: 'test address',
            key: 'test-key',
            meta: {
                provider: { name: 'test-provider' },
                helpers: { tin: '12345' },
            },
        }

        beforeEach(() => {
            jest.clearAllMocks()
        })

        test('should not save to database when provider is PULLENTI_PROVIDER', async () => {
            const pullentiAddressData = {
                ...addressData,
                meta: {
                    ...addressData.meta,
                    provider: { name: PULLENTI_PROVIDER },
                },
            }

            const result = await createOrUpdateAddressWithSource(
                context,
                addressServerUtils,
                addressSourceServerUtils,
                pullentiAddressData,
                'test-address',
                dvSender
            )

            expect(result).toEqual({
                id: 'pullenti:test-key',
                overrides: null,
                ...pullentiAddressData,
            })

            // Verify no database operations were performed
            expect(addressServerUtils.getOne).not.toHaveBeenCalled()
            expect(addressServerUtils.create).not.toHaveBeenCalled()
            expect(addressSourceServerUtils.getOne).not.toHaveBeenCalled()
            expect(addressSourceServerUtils.create).not.toHaveBeenCalled()
            expect(addressSourceServerUtils.update).not.toHaveBeenCalled()
        })

        test('should save to database when provider is not PULLENTI_PROVIDER', async () => {
            await createOrUpdateAddressWithSource(
                context,
                addressServerUtils,
                addressSourceServerUtils,
                addressData,
                'test-address',
                dvSender
            )

            // Verify database operations were performed
            expect(addressServerUtils.getOne).toHaveBeenCalled()
            expect(addressServerUtils.create).toHaveBeenCalled()
            expect(addressSourceServerUtils.getOne).toHaveBeenCalled()
            expect(addressSourceServerUtils.create).toHaveBeenCalled()
        })
    })
})
