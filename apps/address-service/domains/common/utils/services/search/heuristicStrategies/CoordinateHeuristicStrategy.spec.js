/**
 * @jest-environment node
 */

const index = require('@app/address-service/index')
const { faker } = require('@faker-js/faker')

const { setFakeClientMode, makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')

const { createTestAddress, createTestAddressHeuristic } = require('@address-service/domains/address/utils/testSchema')
const { HEURISTIC_TYPE_COORDINATES, HEURISTIC_TYPE_FIAS_ID } = require('@address-service/domains/common/constants/heuristicTypes')
const { CoordinateHeuristicStrategy, parseCoordinates } = require('@address-service/domains/common/utils/services/search/heuristicStrategies/CoordinateHeuristicStrategy')

describe('parseCoordinates', () => {
    it('should parse valid coordinate string', () => {
        expect(parseCoordinates('55.751244,37.618423')).toEqual({ latitude: 55.751244, longitude: 37.618423 })
    })

    it('should parse negative coordinates', () => {
        expect(parseCoordinates('-33.8688,151.2093')).toEqual({ latitude: -33.8688, longitude: 151.2093 })
    })

    it('should return null for invalid string', () => {
        expect(parseCoordinates('invalid')).toBeNull()
        expect(parseCoordinates('abc,def')).toBeNull()
        expect(parseCoordinates('55.751244')).toBeNull()
    })

    it('should return null for partial-parse values', () => {
        expect(parseCoordinates('55.7abc,37.6')).toBeNull()
        expect(parseCoordinates('55.7,37.6xyz')).toBeNull()
    })

    it('should return null for more than two parts', () => {
        expect(parseCoordinates('55,37,1')).toBeNull()
    })

    it('should return null for out-of-range coordinates', () => {
        expect(parseCoordinates('91,0')).toBeNull()
        expect(parseCoordinates('-91,0')).toBeNull()
        expect(parseCoordinates('0,181')).toBeNull()
        expect(parseCoordinates('0,-181')).toBeNull()
    })
})

describe('CoordinateHeuristicStrategy', () => {
    let adminClient

    setFakeClientMode(index)

    beforeAll(async () => {
        adminClient = await makeLoggedInAdminClient()
    })

    describe('isConflictVetoed', () => {
        const coordValue = '55.0,37.0'
        const coordHeuristic = { type: HEURISTIC_TYPE_COORDINATES, value: coordValue, reliability: 90 }

        it('returns false when no incoming heuristic has higher reliability than the coordinate heuristic', async () => {
            const [address] = await createTestAddress(adminClient, { key: `fallback:${faker.random.alphaNumeric(12)}` })
            const strategy = new CoordinateHeuristicStrategy()

            const result = await strategy.isConflictVetoed(
                address.id,
                coordHeuristic,
                [coordHeuristic, { type: 'fallback', value: 'x', reliability: 50 }]
            )

            expect(result).toBe(false)
        })

        it('returns false when existing address has no heuristic of the higher-reliability type', async () => {
            const [address] = await createTestAddress(adminClient, { key: `fallback:${faker.random.alphaNumeric(12)}` })
            const strategy = new CoordinateHeuristicStrategy()

            const result = await strategy.isConflictVetoed(
                address.id,
                coordHeuristic,
                [coordHeuristic, { type: HEURISTIC_TYPE_FIAS_ID, value: faker.datatype.uuid(), reliability: 95 }]
            )

            expect(result).toBe(false)
        })

        it('returns false when existing and incoming higher-reliability values are the same', async () => {
            const sharedFiasId = faker.datatype.uuid()
            const [address] = await createTestAddress(adminClient, { key: `fallback:${faker.random.alphaNumeric(12)}` })
            await createTestAddressHeuristic(adminClient, address.id, {
                type: HEURISTIC_TYPE_FIAS_ID,
                value: sharedFiasId,
                reliability: 95,
            })
            const strategy = new CoordinateHeuristicStrategy()

            const result = await strategy.isConflictVetoed(
                address.id,
                coordHeuristic,
                [coordHeuristic, { type: HEURISTIC_TYPE_FIAS_ID, value: sharedFiasId, reliability: 95 }]
            )

            expect(result).toBe(false)
        })

        it('returns true when existing and incoming higher-reliability values differ', async () => {
            const [address] = await createTestAddress(adminClient, { key: `fallback:${faker.random.alphaNumeric(12)}` })
            await createTestAddressHeuristic(adminClient, address.id, {
                type: HEURISTIC_TYPE_FIAS_ID,
                value: faker.datatype.uuid(), // existing fias_id
                reliability: 95,
            })
            const strategy = new CoordinateHeuristicStrategy()

            const result = await strategy.isConflictVetoed(
                address.id,
                coordHeuristic,
                [coordHeuristic, { type: HEURISTIC_TYPE_FIAS_ID, value: faker.datatype.uuid(), reliability: 95 }] // different incoming fias_id
            )

            expect(result).toBe(true)
        })
    })
})
