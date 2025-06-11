const { normalize, getXmlParser } = require('./normalizer')

describe('normalize', () => {
    it('should parse XML and extract normalized address fields', () => {
        const xml = `
            <textaddr>
                <text>Россия, г Москва, ул Тверская, д 1</text>
                <alpha2>RU</alpha2>
                <coef>0.99</coef>
                <textobj>
                <level>regionarea</level>
                    <gar>
                        <param name="kladrcode">7700000000000</param>
                        <param name="foo">bar</param>
                    </gar>
                </textobj>
                <textobj>
                    <level>city</level>
                    <gar>
                        <param name="kladrcode">7700000000000</param>
                        <param name="foo">bar</param>
                    </gar>
                </textobj>
                <textobj>
                    <level>street</level>
                    <gar>
                        <param name="kladrcode">7700000000000</param>
                        <param name="foo">bar</param>
                    </gar>
                </textobj>
                <textobj>
                    <level>building</level>
                    <gar>
                        <guid>test-guid</guid>
                        <house>
                            <num>1</num>
                        </house>
                        <param name="kladrcode">7700000000001</param>
                        <param name="postindex">123456</param>
                        <param name="gpspoint">55.7558 37.6173</param>
                    </gar>
                </textobj>
            </textaddr>
        `
        const result = normalize(xml)
        expect(result).toBeTruthy()
        expect(result.value).toContain('дом 1')
        expect(result.data.house).toBe('1')
        expect(result.data.house_fias_id).toBe('test-guid')
        expect(result.data.postal_code).toBe('123456')
        expect(result.data.geo_lat).toBe('55.7558')
        expect(result.data.geo_lon).toBe('37.6173')
        expect(result.data.country_iso_code).toBe('RU')
        expect(result.rawValue).toBe('Россия, г Москва, ул Тверская, д 1')
        expect(result.data.qc).toBe(0.99)
    })

    it('should return null if any gar.expired is present', () => {
        const xml = `
            <textaddr>
                <textobj>
                    <gar>
                        <expired>true</expired>
                    </gar>
                </textobj>
            </textaddr>
        `
        expect(normalize(xml)).toBeNull()
    })

    it('should return null if textobj is missing or empty', () => {
        expect(normalize('<textaddr></textaddr>')).toBeNull()
        expect(normalize('<textaddr><textobj/></textaddr>')).toBeNull()
    })

    it('should handle missing fields gracefully', () => {
        const xml = '<textaddr><textobj level="building"><gar/></textobj></textaddr>'
        const result = normalize(xml)
        expect(result).toBeTruthy()
        expect(result.data.house).toBeNull()
        expect(result.data.region).toBeNull()
        expect(result.data.city).toBeNull()
    })

    it('should parse gpspoint into geo_lat and geo_lon', () => {
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

    it('should use empty string for unrestricted_value if no postal_code or gar.path', () => {
        const xml = '<textaddr><textobj level="building"><gar/></textobj></textaddr>'
        const result = normalize(xml)
        expect(result.unrestricted_value).toBe('')
    })

    it('should return correct provider info', () => {
        const xml = '<textaddr><textobj level="building"><gar/></textobj></textaddr>'
        const result = normalize(xml)
        expect(result.provider).toBeDefined()
        expect(result.provider.rawData).toBe(xml)
        expect(result.provider.name).toBe('pullenti')
    })

    it('should return null if input XML is empty', () => {
        expect(normalize('')).toBeNull()
    })

    it('getXmlParser should return an XMLParser instance', () => {
        const parser = getXmlParser()
        expect(parser).toBeInstanceOf(Object)
        expect(typeof parser.parse).toBe('function')
    })
})
