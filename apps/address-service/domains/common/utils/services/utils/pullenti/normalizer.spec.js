const { normalize, getXmlParser } = require('./normalizer')

describe('normalize', () => {
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
