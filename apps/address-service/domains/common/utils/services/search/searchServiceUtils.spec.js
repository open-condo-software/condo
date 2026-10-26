const { faker } = require('@faker-js/faker')

const { PULLENTI_PROVIDER } = require('@address-service/domains/common/constants/providers')
const { DadataSearchProvider } = require('@address-service/domains/common/utils/services/search/providers/DadataSearchProvider')

jest.mock('./heuristicMatcher', () => ({
    findAddressByHeuristics: jest.fn(),
    upsertHeuristics: jest.fn(),
}))

const { findAddressByHeuristics, upsertHeuristics } = require('./heuristicMatcher')
const {
    hashJSON,
    mergeAddressAndHelpers,
    createOrUpdateAddressWithSource,
    upsertAddressSource,
} = require('./searchServiceUtils')

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
            findAddressByHeuristics.mockReset()
            upsertHeuristics.mockReset()
            addressServerUtils.getOne.mockReset().mockResolvedValue(null)
            addressServerUtils.create.mockReset().mockResolvedValue({ id: 'test-address-id', address: 'test address', key: 'test-key', meta: {} })
            addressSourceServerUtils.getOne.mockReset().mockResolvedValue(null)
            addressSourceServerUtils.create.mockReset().mockResolvedValue({ id: 'test-source-id' })
            addressSourceServerUtils.update.mockReset().mockResolvedValue({ id: 'test-source-id' })
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

        test('should use heuristic match when heuristics are provided and match exists', async () => {
            const matchedAddressId = faker.datatype.uuid()
            const existingAddress = { id: matchedAddressId, address: 'existing', key: 'existing-key', meta: {} }
            const heuristics = [{ type: 'fias_id', value: faker.datatype.uuid(), reliability: 95 }]

            findAddressByHeuristics.mockResolvedValueOnce({
                addressId: matchedAddressId,
                matchedHeuristic: { type: 'fias_id', value: heuristics[0].value },
            })
            addressServerUtils.getOne.mockResolvedValueOnce(existingAddress)

            const result = await createOrUpdateAddressWithSource(
                context,
                addressServerUtils,
                addressSourceServerUtils,
                addressData,
                'test-address',
                dvSender,
                heuristics,
            )

            expect(findAddressByHeuristics).toHaveBeenCalledWith(heuristics)
            expect(addressServerUtils.getOne).toHaveBeenCalledWith(
                context,
                { id: matchedAddressId, deletedAt: null },
                expect.any(String),
            )
            expect(addressServerUtils.getOne).not.toHaveBeenCalledWith(
                context,
                { key: addressData.key, deletedAt: null },
                expect.any(String),
            )
            expect(addressServerUtils.create).not.toHaveBeenCalled()
            expect(upsertHeuristics).toHaveBeenCalledWith(
                context,
                existingAddress.id,
                heuristics,
                'test-provider',
                dvSender,
            )
            expect(result).toEqual(existingAddress)
        })

        test.each(['house_fias_id', 'stead_fias_id'])('matches and upserts all generated heuristics for %s', async (fiasField) => {
            process.env.DADATA_SUGGESTIONS = '{"url":"https://example.com", "token":"test-token"}'
            const provider = new DadataSearchProvider({ req: { id: 'test-request-id' } })
            const meta = {
                provider: { name: 'dadata' },
                data: { [fiasField]: 'leaf-id', city: 'Moscow', house: '10', geo_lat: '55.75', geo_lon: '37.61', qc_geo: '0' },
            }
            const key = provider.generateAddressKey(meta)
            const heuristics = provider.extractHeuristics(meta)
            const existing = { id: 'matched-address', address: 'existing', key, meta }
            findAddressByHeuristics.mockResolvedValueOnce({ addressId: existing.id })
            addressServerUtils.getOne.mockResolvedValueOnce(existing)

            const result = await createOrUpdateAddressWithSource(context, addressServerUtils, addressSourceServerUtils, { ...addressData, key, meta }, 'source', dvSender, heuristics)

            expect(heuristics.map(({ type }) => type)).toEqual(['fias_id', 'coordinates', 'fallback'])
            expect(findAddressByHeuristics).toHaveBeenCalledWith(heuristics)
            expect(upsertHeuristics).toHaveBeenCalledWith(context, existing.id, heuristics, 'dadata', dvSender)
            expect(result).toBe(existing)
            expect(addressServerUtils.create).not.toHaveBeenCalled()
        })

        test.each(['house_fias_id', 'stead_fias_id'])('recovers %s by its exact FIAS key and upserts its FIAS heuristic', async (fiasField) => {
            const steadId = 'stead-recovery'
            const key = `fias_id:${steadId}`
            const existing = { id: 'stead-address', address: 'existing stead', key, meta: {} }
            const fiasHeuristic = { type: 'fias_id', value: steadId, reliability: 95 }
            const dadataStead = {
                ...addressData,
                key,
                meta: { ...addressData.meta, provider: { name: 'dadata' }, data: { [fiasField]: steadId } },
            }
            findAddressByHeuristics.mockResolvedValueOnce(null)
            addressServerUtils.getOne.mockResolvedValueOnce(existing)

            const result = await createOrUpdateAddressWithSource(
                context,
                addressServerUtils,
                addressSourceServerUtils,
                dadataStead,
                'stead',
                dvSender,
                [fiasHeuristic],
            )

            expect(addressServerUtils.getOne).toHaveBeenCalledWith(
                context,
                { key, deletedAt: null },
                expect.any(String),
            )
            expect(result).toBe(existing)
            expect(addressServerUtils.create).not.toHaveBeenCalled()
            expect(upsertHeuristics).toHaveBeenCalledWith(context, existing.id, [fiasHeuristic], 'dadata', dvSender)
        })

        test.each([
            { house_fias_id: 'house-id' },
            { stead_fias_id: 'stead-id' },
            { house_fias_id: 'house-id', stead_fias_id: 'stead-id' },
        ])('Dadata leaf FIAS retains coordinate matching for %j', async (data) => {
            const coordinates = { type: 'coordinates', value: '55.75,37.61', reliability: 50 }
            const existing = { id: 'house-by-coordinate', address: 'existing house', key: 'old-key', meta: {} }
            findAddressByHeuristics.mockResolvedValueOnce({ addressId: existing.id })
            addressServerUtils.getOne.mockResolvedValueOnce(existing)
            const dadataHouse = { ...addressData, meta: { ...addressData.meta, provider: { name: 'dadata' }, data } }
            const heuristics = [coordinates]

            const result = await createOrUpdateAddressWithSource(context, addressServerUtils, addressSourceServerUtils, dadataHouse, 'house', dvSender, heuristics)

            expect(findAddressByHeuristics).toHaveBeenCalledWith(heuristics)
            expect(result).toBe(existing)
            expect(addressServerUtils.create).not.toHaveBeenCalled()
        })

        test.each([
            [{ house_fias_id: 'house-id' }, 'test-key', 'house-id'],
            [{ stead_fias_id: 'stead-id' }, 'test-key', 'stead-id'],
            [{ house_fias_id: 'house-id', stead_fias_id: 'stead-id' }, 'test-key', 'house-id'],
            [{ house_fias_id: 'house-id', stead_fias_id: 'stead-id' }, 'fias_id:house-id', 'house-id'],
        ])('Dadata leaf FIAS retains key lookup for %j and key %s', async (data, key, fiasId) => {
            const existing = { id: 'house-by-key', address: 'existing house', key, meta: {} }
            addressServerUtils.getOne.mockResolvedValueOnce(existing)
            const dadataHouse = { ...addressData, key, meta: { ...addressData.meta, provider: { name: 'dadata' }, data } }
            const heuristics = [
                { type: 'fias_id', value: fiasId, reliability: 95 },
                { type: 'fallback', value: 'moscow~10', reliability: 10 },
            ]

            const result = await createOrUpdateAddressWithSource(context, addressServerUtils, addressSourceServerUtils, dadataHouse, 'house', dvSender, heuristics)

            expect(findAddressByHeuristics).toHaveBeenCalledWith(heuristics)
            expect(addressServerUtils.getOne).toHaveBeenCalledWith(context, { key, deletedAt: null }, expect.any(String))
            expect(result).toBe(existing)
            expect(addressServerUtils.create).not.toHaveBeenCalled()
            expect(upsertHeuristics).toHaveBeenCalledWith(context, existing.id, heuristics, 'dadata', dvSender)
        })

        test('preserves building and empty stead FIAS fallback matching', async () => {
            const fallback = { type: 'fallback', value: 'moscow~10', reliability: 10 }
            const building = [fallback]
            const emptyStead = [{ type: 'fias_id', value: '', reliability: 95 }, fallback]

            await createOrUpdateAddressWithSource(context, addressServerUtils, addressSourceServerUtils, addressData, 'building', dvSender, building)
            await createOrUpdateAddressWithSource(context, addressServerUtils, addressSourceServerUtils, addressData, 'empty-stead', dvSender, emptyStead)

            expect(findAddressByHeuristics).toHaveBeenNthCalledWith(1, building)
            expect(findAddressByHeuristics).toHaveBeenNthCalledWith(2, emptyStead)
        })

        test('should fall back to key lookup when heuristics are provided but no match found', async () => {
            const heuristics = [{ type: 'fallback', value: 'test-fallback', reliability: 10 }]
            const existingByKey = { id: 'existing-by-key', address: 'existing by key', key: 'test-key', meta: {} }

            findAddressByHeuristics.mockResolvedValueOnce(null)
            addressServerUtils.getOne
                .mockResolvedValueOnce(existingByKey)

            const result = await createOrUpdateAddressWithSource(
                context,
                addressServerUtils,
                addressSourceServerUtils,
                addressData,
                'test-address',
                dvSender,
                heuristics,
            )

            expect(findAddressByHeuristics).toHaveBeenCalledWith(heuristics)
            expect(addressServerUtils.getOne).toHaveBeenCalledWith(
                context,
                { key: addressData.key, deletedAt: null },
                expect.any(String),
            )
            expect(addressServerUtils.create).not.toHaveBeenCalled()
            expect(upsertHeuristics).toHaveBeenCalledWith(
                context,
                existingByKey.id,
                heuristics,
                'test-provider',
                dvSender,
            )
            expect(result).toEqual(existingByKey)
        })
    })

    describe('upsertAddressSource()', () => {
        const context = {}
        const dvSender = { dv: 1, sender: { dv: 1, fingerprint: 'test' } }

        let addressSourceServerUtils

        beforeEach(() => {
            addressSourceServerUtils = {
                getOne: jest.fn().mockResolvedValue(null),
                create: jest.fn().mockResolvedValue({ id: 'created-id' }),
                update: jest.fn().mockResolvedValue({ id: 'updated-id' }),
            }
            jest.clearAllMocks()
        })

        test('returns null when normalizedSource is falsy', async () => {
            const id = await upsertAddressSource(context, addressSourceServerUtils, dvSender, '', 'addr-id')
            expect(id).toBeNull()
            expect(addressSourceServerUtils.getOne).not.toHaveBeenCalled()
        })

        test('creates when not existing', async () => {
            const id = await upsertAddressSource(context, addressSourceServerUtils, dvSender, 'Norm-Source|123', 'addr-id')
            expect(addressSourceServerUtils.getOne).toHaveBeenCalledWith(
                context,
                { source: 'norm-source|123', deletedAt: null },
                expect.any(String),
            )
            expect(addressSourceServerUtils.create).toHaveBeenCalledWith(
                context,
                expect.objectContaining({
                    ...dvSender,
                    source: 'norm-source|123',
                    address: { connect: { id: 'addr-id' } },
                }),
            )
            expect(id).toBe('created-id')
        })

        test('updates when existing', async () => {
            addressSourceServerUtils.getOne.mockResolvedValueOnce({ id: 'existing-id' })
            const id = await upsertAddressSource(context, addressSourceServerUtils, dvSender, 'AbC', 'addr-id')
            expect(addressSourceServerUtils.update).toHaveBeenCalledWith(
                context,
                'existing-id',
                expect.objectContaining({
                    ...dvSender,
                    source: 'abc',
                    address: { connect: { id: 'addr-id' } },
                }),
            )
            expect(id).toBe('existing-id')
        })
    })
})
