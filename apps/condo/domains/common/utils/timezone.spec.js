const { DEFAULT_ORGANIZATION_TIMEZONE } = require('@condo/domains/organization/constants/common')

const { normalizeTimeZone } = require('./timezone')
describe('normalizeTimeZone()', () => {
    it('should return null on empty text', () => {
        expect(normalizeTimeZone('')).toBeNull()
    })

    it('should return null on not valid timezone', () => {
        expect(normalizeTimeZone('Foo/Bar')).toBeNull()
    })

    it('should return not modified timeZone on valid timezone', () => {
        expect(normalizeTimeZone(DEFAULT_ORGANIZATION_TIMEZONE)).toEqual(DEFAULT_ORGANIZATION_TIMEZONE)
    })
})
