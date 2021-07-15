const { normalizeTimeZone } = require('./timezone')
const { DEFAULT_ORGANIZATION_TIMEZONE } = require('@condo/domains/organization/constants/common')
describe('normalizeTimeZone()', () => {
    it('should return null on empty text', () => {
        expect(normalizeTimeZone('')).toBeNull()
    })

    it('should return null on not valid timezone', () => {
        expect(normalizeTimeZone('Foo/Bar')).toBeNull()
    })

    it('should return not modified timeZone on valid timzone', () => {
        expect(normalizeTimeZone(DEFAULT_ORGANIZATION_TIMEZONE)).toEqual(DEFAULT_ORGANIZATION_TIMEZONE)
    })
})
