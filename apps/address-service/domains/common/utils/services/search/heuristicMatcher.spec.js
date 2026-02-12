const { parseCoordinates, coordinatesMatch, COORDINATE_TOLERANCE } = require('./heuristicMatcher')

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
})
