/**
 * @jest-environment node
 */
const { getStringsDiff } = require('./detect-orphan-residents-addresses')

describe('bin/resident/detect-orphan-residents-addresses', () => {
    describe('helper functions', () => {
        it('getStringsDiff correctly detects string non-matching chars count', async () => {
            expect(getStringsDiff('abc', 'def')).toEqual(6)
            expect(getStringsDiff('abcdef', 'def')).toEqual(3)
            expect(getStringsDiff('abcddef', 'def')).toEqual(5)
            expect(getStringsDiff('абв', 'где')).toEqual(6)
            expect(getStringsDiff('абвгде', 'где')).toEqual(3)
            expect(getStringsDiff('абвггде', 'где')).toEqual(5)
        })
    })
})