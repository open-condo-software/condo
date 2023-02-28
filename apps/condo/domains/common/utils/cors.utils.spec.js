const { parseCorsSettings } = require('./cors.utils')

describe('CORS with wild card settings', () => {
    it('should correctly works for subdomains', () => {
        const setting = { origin: '*.doma.ai' }
        const { origin } = parseCorsSettings(setting)
        expect(origin.test('https://v1.doma.ai')).toBeTruthy()
        expect(origin.test('https://cc.doma.ai')).toBeTruthy()
        expect(origin.test('http://v1.doma.ai')).toBeTruthy()
        expect(origin.test('v1.doma.ai')).toBeTruthy()
    })

    it('should deny sub sub domain ', () => {
        const setting = { origin: '*.doma.ai' }
        const { origin } = parseCorsSettings(setting)
        expect(origin.test('condo.d.doma.ai')).toBeFalsy()
    })

    it('should deny other domains ', () => {
        const setting = { origin: '*.doma.ai' }
        const { origin } = parseCorsSettings(setting)
        expect(origin.test('google.com')).toBeFalsy()
        expect(origin.test('demo.dom1a.ai')).toBeFalsy()
    })
})

describe('CORS simple settings', () => {
    it('should not modify config on boolean values ', () => {
        const setting = { origin: true, credentials: false, moreSettings: true }
        const { origin, credentials, moreSettings } = parseCorsSettings(setting)
        expect(origin).toBeTruthy()
        expect(credentials).toBeFalsy()
        expect(moreSettings).toBeTruthy()
    })

    it('should not modify config on array of origins ', () => {
        const domains = ['v1.doma.ai', 'cc.doma.ai', '*.doma.ai']
        const setting = { origin: domains }
        const { origin } = parseCorsSettings(setting)
        expect(origin).toHaveLength(3)
        domains.forEach((domain, index) => {
            expect(origin[index]).toEqual(domains[index])
        })
    })

    it('should not modify not wildcard string in origin ', () => {
        const domain = 'v1.doma.ai'
        const setting = { origin: domain }
        const { origin } = parseCorsSettings(setting)
        expect(origin).toEqual(domain)
    })

    it('should work on null settings ', () => {
        const setting = null
        const result = parseCorsSettings(setting)
        expect(result).toEqual(setting)
    })

})
