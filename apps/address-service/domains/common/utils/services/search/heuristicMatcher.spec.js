/**
 * @jest-environment node
 */

const index = require('@app/address-service/index')
const { faker } = require('@faker-js/faker')

const { setFakeClientMode, makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')

const { Address: AddressServerUtils, AddressHeuristic: AddressHeuristicServerUtils } = require('@address-service/domains/address/utils/serverSchema')
const { createTestAddress, createTestAddressHeuristic } = require('@address-service/domains/address/utils/testSchema')
const { HEURISTIC_TYPE_COORDINATES, HEURISTIC_TYPE_FIAS_ID } = require('@address-service/domains/common/constants/heuristicTypes')
const { COORDINATE_TOLERANCE } = require('@address-service/domains/common/utils/services/search/heuristicStrategies/CoordinateHeuristicStrategy')

const {
    coordinatesMatch,
    findAddressByHeuristics,
    findRootAddress,
    upsertHeuristics,
} = require('./heuristicMatcher')

describe('heuristicMatcher', () => {
    let adminClient
    let context
    let dvSender

    setFakeClientMode(index)

    beforeAll(async () => {
        adminClient = await makeLoggedInAdminClient()
        context = await index.keystone.createContext({ skipAccessControl: true })
        dvSender = { dv: 1, sender: { dv: 1, fingerprint: faker.random.alphaNumeric(8) } }
    })

    describe('coordinatesMatch', () => {
        it('should match identical coordinates', () => {
            expect(coordinatesMatch('55.751244,37.618423', '55.751244,37.618423')).toBe(true)
        })

        it('should match coordinates within tolerance', () => {
            const lat = 55.751244
            const lon = 37.618423
            const offset = COORDINATE_TOLERANCE * 0.5
            expect(coordinatesMatch(
                `${lat},${lon}`,
                `${lat + offset},${lon - offset}`
            )).toBe(true)
        })

        it('should not match coordinates outside tolerance', () => {
            expect(coordinatesMatch('55.751244,37.618423', '55.752,37.618423')).toBe(false)
        })

        it('should not match coordinates with large lat difference', () => {
            expect(coordinatesMatch('55.751244,37.618423', '55.851244,37.618423')).toBe(false)
        })

        it('should not match coordinates with large lon difference', () => {
            expect(coordinatesMatch('55.751244,37.618423', '55.751244,37.718423')).toBe(false)
        })

        it('should return false for invalid coordinate strings', () => {
            expect(coordinatesMatch('invalid', '55.751244,37.618423')).toBe(false)
            expect(coordinatesMatch('55.751244,37.618423', 'invalid')).toBe(false)
            expect(coordinatesMatch('abc,def', '55.751244,37.618423')).toBe(false)
        })

        it('should accept custom tolerance', () => {
            // These are ~100m apart in lat
            expect(coordinatesMatch('55.751244,37.618423', '55.752244,37.618423', 0.001)).toBe(true)
            expect(coordinatesMatch('55.751244,37.618423', '55.752244,37.618423', 0.0001)).toBe(false)
        })

        it('should match coordinates at near-tolerance distance', () => {
            const lat = 55.751244
            const lon = 37.618423
            const nearTolerance = COORDINATE_TOLERANCE * 0.99
            expect(coordinatesMatch(
                `${lat},${lon}`,
                `${lat + nearTolerance},${lon}`
            )).toBe(true)
        })

        it('should not match coordinates just beyond tolerance', () => {
            const lat = 55.751244
            const lon = 37.618423
            const beyondTolerance = COORDINATE_TOLERANCE * 1.5
            expect(coordinatesMatch(
                `${lat},${lon}`,
                `${lat + beyondTolerance},${lon}`
            )).toBe(false)
        })
    })

    describe('findRootAddress', () => {
        it('should follow possibleDuplicateOf chain to the root', async () => {
            const [a] = await createTestAddress(adminClient, { key: `fallback:${faker.random.alphaNumeric(12)}` })
            const [b] = await createTestAddress(adminClient, { key: `fallback:${faker.random.alphaNumeric(12)}` })
            const [c] = await createTestAddress(adminClient, { key: `fallback:${faker.random.alphaNumeric(12)}` })

            await AddressServerUtils.update(context, a.id, { ...dvSender, possibleDuplicateOf: { connect: { id: b.id } } })
            await AddressServerUtils.update(context, b.id, { ...dvSender, possibleDuplicateOf: { connect: { id: c.id } } })

            const root = await findRootAddress(a.id)
            expect(root).toBe(c.id)
        })

        it('should return addressId when address has no possibleDuplicateOf', async () => {
            const [a] = await createTestAddress(adminClient, { key: `fallback:${faker.random.alphaNumeric(12)}` })

            const root = await findRootAddress(a.id)
            expect(root).toBe(a.id)
        })

        it('should not return a soft-deleted address as root', async () => {
            const [a] = await createTestAddress(adminClient, { key: `fallback:${faker.random.alphaNumeric(12)}` })
            const [b] = await createTestAddress(adminClient, { key: `fallback:${faker.random.alphaNumeric(12)}` })
            const [c] = await createTestAddress(adminClient, { key: `fallback:${faker.random.alphaNumeric(12)}` })

            await AddressServerUtils.update(context, a.id, { ...dvSender, possibleDuplicateOf: { connect: { id: b.id } } })
            await AddressServerUtils.update(context, b.id, { ...dvSender, possibleDuplicateOf: { connect: { id: c.id } } })
            await AddressServerUtils.update(context, c.id, { ...dvSender, deletedAt: new Date().toISOString() })

            const root = await findRootAddress(a.id)
            // c is soft-deleted → last alive node is b
            expect(root).toBe(b.id)
        })

        it('should return original addressId when it has no possibleDuplicateOf chain', async () => {
            const [a] = await createTestAddress(adminClient, { key: `fallback:${faker.random.alphaNumeric(12)}` })

            const root = await findRootAddress(a.id)
            expect(root).toBe(a.id)
        })
    })

    describe('findAddressByHeuristics', () => {
        it('returns null when no heuristics match', async () => {
            const result = await findAddressByHeuristics([
                { type: HEURISTIC_TYPE_FIAS_ID, value: faker.datatype.uuid(), reliability: 95 },
            ])
            expect(result).toBeNull()
        })

        it('returns addressId and matchedHeuristic on match', async () => {
            const [address] = await createTestAddress(adminClient, { key: `fallback:${faker.random.alphaNumeric(12)}` })
            const value = faker.datatype.uuid()
            await createTestAddressHeuristic(adminClient, address.id, { type: HEURISTIC_TYPE_FIAS_ID, value, reliability: 95 })

            const result = await findAddressByHeuristics([
                { type: HEURISTIC_TYPE_FIAS_ID, value, reliability: 95 },
            ])
            expect(result).toMatchObject({ addressId: address.id, matchedHeuristic: { type: HEURISTIC_TYPE_FIAS_ID, value } })
        })

        it('tries heuristics in descending reliability order and matches the highest first', async () => {
            const [address] = await createTestAddress(adminClient, { key: `fallback:${faker.random.alphaNumeric(12)}` })
            const highValue = faker.datatype.uuid()
            const lowValue = faker.random.alphaNumeric(12)
            await createTestAddressHeuristic(adminClient, address.id, { type: HEURISTIC_TYPE_FIAS_ID, value: highValue, reliability: 95 })

            const result = await findAddressByHeuristics([
                { type: 'fallback', value: lowValue, reliability: 10 },
                { type: HEURISTIC_TYPE_FIAS_ID, value: highValue, reliability: 95 },
            ])
            expect(result).toMatchObject({ matchedHeuristic: { type: HEURISTIC_TYPE_FIAS_ID, value: highValue } })
        })
    })

    describe('upsertHeuristics', () => {
        it('should create heuristic and not set possibleDuplicateOf when no conflict', async () => {
            const [address] = await createTestAddress(adminClient, { key: `fallback:${faker.random.alphaNumeric(12)}` })
            const value = faker.datatype.uuid()

            await upsertHeuristics(context, address.id, [
                { type: HEURISTIC_TYPE_FIAS_ID, value, reliability: 95 },
            ], 'dadata', dvSender)

            const created = await AddressHeuristicServerUtils.getOne(context, { address: { id: address.id }, type: HEURISTIC_TYPE_FIAS_ID, deletedAt: null }, 'id value')
            expect(created).toBeDefined()
            expect(created.value).toBe(value)

            const updated = await AddressServerUtils.getOne(context, { id: address.id }, 'id possibleDuplicateOf { id }')
            expect(updated.possibleDuplicateOf).toBeNull()
        })

        it('should skip heuristic when it already belongs to the same address', async () => {
            const [address] = await createTestAddress(adminClient, { key: `fallback:${faker.random.alphaNumeric(12)}` })
            const value = faker.datatype.uuid()
            await createTestAddressHeuristic(adminClient, address.id, { type: HEURISTIC_TYPE_FIAS_ID, value, reliability: 95 })

            await upsertHeuristics(context, address.id, [
                { type: HEURISTIC_TYPE_FIAS_ID, value, reliability: 95 },
            ], 'dadata', dvSender)

            // Still only one heuristic record
            const all = await AddressHeuristicServerUtils.getAll(context, { address: { id: address.id }, type: HEURISTIC_TYPE_FIAS_ID, deletedAt: null }, 'id')
            expect(all).toHaveLength(1)
        })

        it('should set possibleDuplicateOf on first-pass conflict', async () => {
            const [existing] = await createTestAddress(adminClient, { key: `fallback:${faker.random.alphaNumeric(12)}` })
            const [incoming] = await createTestAddress(adminClient, { key: `fallback:${faker.random.alphaNumeric(12)}` })
            const sharedFiasId = faker.datatype.uuid()

            await createTestAddressHeuristic(adminClient, existing.id, { type: HEURISTIC_TYPE_FIAS_ID, value: sharedFiasId, reliability: 95 })

            await upsertHeuristics(context, incoming.id, [
                { type: HEURISTIC_TYPE_FIAS_ID, value: sharedFiasId, reliability: 95 },
            ], 'dadata', dvSender)

            const updated = await AddressServerUtils.getOne(context, { id: incoming.id }, 'id possibleDuplicateOf { id }')
            expect(updated.possibleDuplicateOf).toBeDefined()
            expect(updated.possibleDuplicateOf.id).toBe(existing.id)
        })

        it('should not set possibleDuplicateOf when coordinate conflict is vetoed by differing FIAS IDs', async () => {
            const lat = parseFloat(faker.address.latitude())
            const lon = parseFloat(faker.address.longitude())
            // existing and incoming have different values but are within tolerance of each other
            const existingCoordValue = `${lat},${lon}`
            const incomingCoordValue = `${lat + COORDINATE_TOLERANCE * 0.1},${lon}`

            const [existing] = await createTestAddress(adminClient, { key: `fallback:${faker.random.alphaNumeric(12)}` })
            const [incoming] = await createTestAddress(adminClient, { key: `fallback:${faker.random.alphaNumeric(12)}` })

            await createTestAddressHeuristic(adminClient, existing.id, {
                type: HEURISTIC_TYPE_COORDINATES,
                value: existingCoordValue,
                reliability: 90,
                latitude: String(lat),
                longitude: String(lon),
            })
            await createTestAddressHeuristic(adminClient, existing.id, {
                type: HEURISTIC_TYPE_FIAS_ID,
                value: faker.datatype.uuid(), // different from incoming → veto applies
                reliability: 95,
            })

            const incomingFiasId = faker.datatype.uuid()
            await upsertHeuristics(context, incoming.id, [
                { type: HEURISTIC_TYPE_COORDINATES, value: incomingCoordValue, reliability: 90 },
                { type: HEURISTIC_TYPE_FIAS_ID, value: incomingFiasId, reliability: 95 },
            ], 'dadata', dvSender)

            const updated = await AddressServerUtils.getOne(context, { id: incoming.id }, 'id possibleDuplicateOf { id }')
            expect(updated.possibleDuplicateOf).toBeNull()

            // fias_id is created for incoming; coordinate is also created (different value)
            const heuristics = await AddressHeuristicServerUtils.getAll(context, { address: { id: incoming.id }, deletedAt: null }, 'id')
            expect(heuristics).toHaveLength(2)
        })
    })
})
