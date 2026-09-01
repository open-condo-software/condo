const { parseCorsSettings } = require('./cors.utils')

describe('CORS with wild card settings', () => {
    it('should correctly works for subdomains', () => {
        const setting = { origin: '*.example.ai' }
        const { origin } = parseCorsSettings(setting)
        expect(origin.test('https://v1.example.ai')).toBeTruthy()
        expect(origin.test('https://cc.example.ai')).toBeTruthy()
        expect(origin.test('http://v1.example.ai')).toBeTruthy()
        expect(origin.test('v1.example.ai')).toBeTruthy()
    })

    it('should work with https protocol prefix', () => {
        const setting = { origin: 'https://*.example.ai' }
        const { origin } = parseCorsSettings(setting)
        expect(origin.test('https://v1.example.ai')).toBeTruthy()
        expect(origin.test('https://cc.example.ai')).toBeTruthy()
        expect(origin.test('http://v1.example.ai')).toBeFalsy() // http should be denied
        expect(origin.test('v1.example.ai')).toBeFalsy() // no protocol should be denied
    })

    it('should deny sub sub domain ', () => {
        const setting = { origin: '*.example.ai' }
        const { origin } = parseCorsSettings(setting)
        expect(origin.test('condo.d.example.ai')).toBeFalsy()
    })

    it('should deny other domains ', () => {
        const setting = { origin: '*.example.ai' }
        const { origin } = parseCorsSettings(setting)
        expect(origin.test('google.com')).toBeFalsy()
        expect(origin.test('demo.exampl1e.ai')).toBeFalsy()
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
        const domains = ['v1.example.ai', 'cc.example.ai', '*.miniapps.example.ai']
        const setting = { origin: domains }
        const { origin } = parseCorsSettings(setting)
        expect(origin).toHaveLength(3)
        expect(origin[0]).toEqual('v1.example.ai')
        expect(origin[1]).toEqual('cc.example.ai')
        expect(origin[2]).toBeInstanceOf(RegExp) // Wildcard should be converted to RegExp
    })

    it('should convert wildcards in array to RegExp', () => {
        const domains = ['v1.example.ai', '*.miniapps.example.ai', 'cc.example.ai']
        const setting = { origin: domains }
        const { origin } = parseCorsSettings(setting)
        expect(origin).toHaveLength(3)
        expect(origin[0]).toEqual('v1.example.ai')
        expect(origin[1]).toBeInstanceOf(RegExp)
        expect(origin[1].test('app1.miniapps.example.ai')).toBeTruthy()
        expect(origin[1].test('evil.com')).toBeFalsy()
        expect(origin[2]).toEqual('cc.example.ai')
    })

    it('should handle multiple wildcards in array', () => {
        const domains = ['*.example.ai', '*.miniapps.example.ai']
        const setting = { origin: domains }
        const { origin } = parseCorsSettings(setting)
        expect(origin).toHaveLength(2)
        expect(origin[0]).toBeInstanceOf(RegExp)
        expect(origin[0].test('app.example.ai')).toBeTruthy()
        expect(origin[1]).toBeInstanceOf(RegExp)
        expect(origin[1].test('app.miniapps.example.ai')).toBeTruthy()
    })

    it('should not modify not wildcard string in origin ', () => {
        const domain = 'v1.example.ai'
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
