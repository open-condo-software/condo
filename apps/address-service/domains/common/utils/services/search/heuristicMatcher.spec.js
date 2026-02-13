const { faker } = require('@faker-js/faker')

const { find } = require('@open-condo/keystone/schema')

const { parseCoordinates, coordinatesMatch, COORDINATE_TOLERANCE, findRootAddress } = require('./heuristicMatcher')

jest.mock('@open-condo/keystone/schema', () => ({
    find: jest.fn(),
    getById: jest.fn(),
}))
jest.mock('@open-condo/keystone/logging', () => ({
    getLogger: () => ({ warn: jest.fn(), info: jest.fn(), error: jest.fn() }),
}))
jest.mock('@address-service/domains/address/utils/serverSchema', () => ({
    Address: {},
    AddressHeuristic: {},
}))
jest.mock('@address-service/domains/common/constants/heuristicTypes', () => ({
    HEURISTIC_TYPE_COORDINATES: 'coordinates',
}))

describe('heuristicMatcher', () => {
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
        afterEach(() => {
            find.mockReset()
        })

        it('should follow possibleDuplicateOf chain to the root', async () => {
            const idA = faker.datatype.uuid()
            const idB = faker.datatype.uuid()
            const idC = faker.datatype.uuid()

            find
                .mockResolvedValueOnce([{ id: idA, possibleDuplicateOf: idB }])
                .mockResolvedValueOnce([{ id: idB, possibleDuplicateOf: idC }])
                .mockResolvedValueOnce([{ id: idC, possibleDuplicateOf: null }])

            const root = await findRootAddress(idA)
            expect(root).toBe(idC)
        })

        it('should return addressId when address has no possibleDuplicateOf', async () => {
            const idA = faker.datatype.uuid()

            find.mockResolvedValueOnce([{ id: idA, possibleDuplicateOf: null }])

            const root = await findRootAddress(idA)
            expect(root).toBe(idA)
        })

        it('should not return a soft-deleted address as root', async () => {
            const idA = faker.datatype.uuid()
            const idB = faker.datatype.uuid()
            const idDeleted = faker.datatype.uuid()

            // A → B → deleted
            find
                .mockResolvedValueOnce([{ id: idA, possibleDuplicateOf: idB }])
                .mockResolvedValueOnce([{ id: idB, possibleDuplicateOf: idDeleted }])
                .mockResolvedValueOnce([]) // idDeleted is soft-deleted → find returns []

            const root = await findRootAddress(idA)
            // Must return last alive node (idB), not the deleted one
            expect(root).toBe(idB)
        })

        it('should return original addressId when first node in chain is soft-deleted', async () => {
            const idA = faker.datatype.uuid()

            // idA itself is soft-deleted
            find.mockResolvedValueOnce([])

            const root = await findRootAddress(idA)
            // lastAliveId was never updated, falls back to original addressId
            expect(root).toBe(idA)
        })

        it('should respect maxDepth and return last alive node', async () => {
            const ids = Array.from({ length: 5 }, () => faker.datatype.uuid())

            // Build a chain longer than maxDepth=3
            for (let i = 0; i < 4; i++) {
                find.mockResolvedValueOnce([{ id: ids[i], possibleDuplicateOf: ids[i + 1] }])
            }

            const root = await findRootAddress(ids[0], 3)
            // Should stop after 3 hops, returning the last alive node visited
            expect(root).toBe(ids[2])
        })
    })
})
