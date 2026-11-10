const { PullentiSearchProvider } = require('@address-service/domains/common/utils/services/search/providers/PullentiSearchProvider')
const { PullentiSuggestionProvider } = require('@address-service/domains/common/utils/services/suggest/providers/PullentiSuggestionProvider')

const { normalize, getXmlParser } = require('./normalizer')

describe('normalize', () => {
    const plotXml = `
        <textobj><level>country</level></textobj>
        <textobj>
            <level>plot</level>
            <gar>
                <level>plot</level><guid>stead-id</guid>
                <house><pnum>42</pnum></house>
                <param name="kadasternumber">stead-cadnum</param>
                <param name="postindex">123456</param>
            </gar>
        </textobj>
    `

    test('exposes all stead fields as house fields with the same FIAS value', () => {
        process.env.PULLENTI_CONFIG = '{"url":"https://example.com"}'
        const xml = `<textaddr>${plotXml}</textaddr>`
        const result = normalize(xml)

        expect(result.type).toBe('building')
        expect(result.data).toMatchObject({
            stead: '42', stead_type: 'уч', stead_type_full: 'участок', stead_fias_id: 'stead-id',
            house: '42', house_type: 'уч', house_type_full: 'участок', house_fias_id: 'stead-id',
            house_cadnum: 'stead-cadnum', stead_cadnum: 'stead-cadnum', house_kladr_id: null,
        })
        expect(result.value).toBe('участок 42')
        expect(result.provider.rawData).toBe(xml)
        const searchProvider = new PullentiSearchProvider({ req: { id: 'test-request-id' } })
        const suggestionProvider = new PullentiSuggestionProvider({ req: { id: 'test-request-id' } })
        expect(searchProvider.normalize([xml])).toEqual([result])
        expect(suggestionProvider.normalize([xml])).toEqual([result])
        expect(searchProvider.generateAddressKey(result)).toBe('fias_id:stead-id')
        expect(suggestionProvider.generateAddressKey(result)).toBe('fias_id:stead-id')
    })

    test.each([false, true])('preserves real house display fields with stead present: %s', (withStead) => {
        const xml = `
            <textaddr>
                ${withStead ? plotXml : '<textobj><level>country</level></textobj>'}
                <textobj>
                    <level>building</level>
                    <gar>
                        <level>building</level><guid>house-id</guid>
                        <house><num>10</num><type>дом</type></house>
                    </gar>
                </textobj>
            </textaddr>
        `
        const result = normalize(xml)

        expect(result.type).toBe('building')
        expect(result.data).toMatchObject({ house: '10', house_type: 'д', house_type_full: 'дом', house_fias_id: 'house-id' })
        expect(result.data.stead).toBe(withStead ? '42' : null)
    })

    test.each([false, true])('uses stead identity over an unidentified house when stead is present: %s', (withStead) => {
        const xml = `
            <textaddr>
                ${withStead ? plotXml : '<textobj><level>country</level></textobj>'}
                <textobj>
                    <level>building</level>
                    <gar>
                        <level>building</level>
                        <house><num>10</num><type>дом</type></house>
                        <param name="kadasternumber">house-cadnum</param>
                        <param name="kladrcode">house-kladr</param>
                    </gar>
                </textobj>
            </textaddr>
        `
        const result = normalize(xml)

        expect(result.data).toMatchObject({
            house: withStead ? '42' : '10',
            house_type: withStead ? 'уч' : 'д',
            house_type_full: withStead ? 'участок' : 'дом',
            house_fias_id: withStead ? 'stead-id' : null,
            house_cadnum: withStead ? 'stead-cadnum' : 'house-cadnum',
            house_kladr_id: withStead ? null : 'house-kladr',
        })
    })

    test('does not copy stead fields without a stead FIAS ID', () => {
        const xml = `<textaddr>${plotXml.replace('<guid>stead-id</guid>', '')}</textaddr>`
        const result = normalize(xml)

        expect(result.type).toBeNull()
        expect(result.data.stead).toBe('42')
        expect(result.data.stead_cadnum).toBe('stead-cadnum')
        expect(result.data.stead_fias_id).toBeNull()
        for (const field of ['house', 'house_type', 'house_type_full', 'house_fias_id', 'house_cadnum', 'house_kladr_id']) {
            expect(result.data[field]).toBeNull()
        }
    })

    test('should handle missing fields gracefully', () => {
        const xml = '<textaddr><textobj level="building"><gar/></textobj></textaddr>'
        const result = normalize(xml)
        expect(result).toBeTruthy()
        expect(result.data.house).toBeNull()
        expect(result.data.region).toBeNull()
        expect(result.data.city).toBeNull()
    })

    test('should parse gpspoint into geo_lat and geo_lon', () => {
        const xml = `
            <textaddr>
                <textobj level="building">
                    <gar>
                        <param name="gpspoint">12.34 56.78</param>
                        <param name="foo">bar</param>
                    </gar>
                </textobj>
            </textaddr>
        `
        const result = normalize(xml)
        expect(result.data.geo_lat).toBe('12.34')
        expect(result.data.geo_lon).toBe('56.78')
    })

    test('should use empty string for unrestricted_value if no postal_code or gar.path', () => {
        const xml = '<textaddr><textobj level="building"><gar/></textobj></textaddr>'
        const result = normalize(xml)
        expect(result.unrestricted_value).toBe('')
    })

    test('should return correct provider info', () => {
        const xml = '<textaddr><textobj level="building"><gar/></textobj></textaddr>'
        const result = normalize(xml)
        expect(result.provider).toBeDefined()
        expect(result.provider.rawData).toBe(xml)
        expect(result.provider.name).toBe('pullenti')
    })

    test('getXmlParser should return an XMLParser instance', () => {
        const parser = getXmlParser()
        expect(parser).toBeInstanceOf(Object)
        expect(typeof parser.parse).toBe('function')
    })
})
