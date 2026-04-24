const { isPlanSubsetOf } = require('./isPlanSubsetOf')


describe('isPlanSubsetOf', () => {
    describe('feature flags', () => {
        test('returns true when subPlan has no features enabled', () => {
            const subPlan = { payments: false, meters: false, tickets: false }
            const superPlan = { payments: false, meters: false, tickets: false }
            expect(isPlanSubsetOf(subPlan, superPlan)).toBe(true)
        })

        test('returns true when subPlan feature is enabled in superPlan', () => {
            const subPlan = { payments: true, tickets: false }
            const superPlan = { payments: true, tickets: true }
            expect(isPlanSubsetOf(subPlan, superPlan)).toBe(true)
        })

        test('returns false when subPlan feature is not enabled in superPlan', () => {
            const subPlan = { payments: true, tickets: false }
            const superPlan = { payments: false, tickets: true }
            expect(isPlanSubsetOf(subPlan, superPlan)).toBe(false)
        })

        test('returns true when both plans have identical features', () => {
            const subPlan = { payments: true, meters: true, tickets: true }
            const superPlan = { payments: true, meters: true, tickets: true }
            expect(isPlanSubsetOf(subPlan, superPlan)).toBe(true)
        })

        test('returns true when subPlan features are strict subset of superPlan', () => {
            const subPlan = { payments: true, meters: false, tickets: false }
            const superPlan = { payments: true, meters: true, tickets: true }
            expect(isPlanSubsetOf(subPlan, superPlan)).toBe(true)
        })

        test('returns false when subPlan has a feature superPlan lacks', () => {
            const subPlan = { payments: true, meters: true }
            const superPlan = { payments: true, meters: false }
            expect(isPlanSubsetOf(subPlan, superPlan)).toBe(false)
        })
    })

    describe('B2B apps', () => {
        test('returns true when subPlan B2B apps are subset of superPlan', () => {
            const subPlan = { enabledB2BApps: ['app-1', 'app-2'] }
            const superPlan = { enabledB2BApps: ['app-1', 'app-2', 'app-3'] }
            expect(isPlanSubsetOf(subPlan, superPlan)).toBe(true)
        })

        test('returns false when subPlan B2B app is missing from superPlan', () => {
            const subPlan = { enabledB2BApps: ['app-1', 'app-4'] }
            const superPlan = { enabledB2BApps: ['app-1', 'app-2', 'app-3'] }
            expect(isPlanSubsetOf(subPlan, superPlan)).toBe(false)
        })

        test('returns true when both plans have identical B2B apps', () => {
            const subPlan = { enabledB2BApps: ['app-1'] }
            const superPlan = { enabledB2BApps: ['app-1'] }
            expect(isPlanSubsetOf(subPlan, superPlan)).toBe(true)
        })

        test('returns true when subPlan has no B2B apps', () => {
            const subPlan = { enabledB2BApps: [] }
            const superPlan = { enabledB2BApps: ['app-1'] }
            expect(isPlanSubsetOf(subPlan, superPlan)).toBe(true)
        })

        test('treats null/undefined B2B apps as empty', () => {
            const subPlan = { enabledB2BApps: null }
            const superPlan = { enabledB2BApps: ['app-1'] }
            expect(isPlanSubsetOf(subPlan, superPlan)).toBe(true)
        })
    })

    describe('B2C apps', () => {
        test('returns true when subPlan B2C apps are subset of superPlan', () => {
            const subPlan = { enabledB2CApps: ['app-1'] }
            const superPlan = { enabledB2CApps: ['app-1', 'app-2'] }
            expect(isPlanSubsetOf(subPlan, superPlan)).toBe(true)
        })

        test('returns false when subPlan B2C app is missing from superPlan', () => {
            const subPlan = { enabledB2CApps: ['app-1', 'app-5'] }
            const superPlan = { enabledB2CApps: ['app-1', 'app-2'] }
            expect(isPlanSubsetOf(subPlan, superPlan)).toBe(false)
        })

        test('treats null/undefined B2C apps as empty', () => {
            const subPlan = { enabledB2CApps: undefined }
            const superPlan = { enabledB2CApps: ['app-1'] }
            expect(isPlanSubsetOf(subPlan, superPlan)).toBe(true)
        })
    })

    describe('combined checks', () => {
        test('returns true when features, B2B, and B2C are all subsets', () => {
            const subPlan = {
                payments: true,
                tickets: false,
                enabledB2BApps: ['app-1'],
                enabledB2CApps: ['app-c1'],
            }
            const superPlan = {
                payments: true,
                tickets: true,
                enabledB2BApps: ['app-1', 'app-2'],
                enabledB2CApps: ['app-c1', 'app-c2'],
            }
            expect(isPlanSubsetOf(subPlan, superPlan)).toBe(true)
        })

        test('returns false when features match but B2B apps do not', () => {
            const subPlan = {
                payments: true,
                enabledB2BApps: ['app-1', 'app-missing'],
                enabledB2CApps: [],
            }
            const superPlan = {
                payments: true,
                enabledB2BApps: ['app-1'],
                enabledB2CApps: [],
            }
            expect(isPlanSubsetOf(subPlan, superPlan)).toBe(false)
        })

        test('returns false when B2B apps match but features do not', () => {
            const subPlan = {
                payments: true,
                meters: true,
                enabledB2BApps: ['app-1'],
                enabledB2CApps: [],
            }
            const superPlan = {
                payments: true,
                meters: false,
                enabledB2BApps: ['app-1', 'app-2'],
                enabledB2CApps: [],
            }
            expect(isPlanSubsetOf(subPlan, superPlan)).toBe(false)
        })

        test('returns true for completely empty plans', () => {
            expect(isPlanSubsetOf({}, {})).toBe(true)
        })
    })
})
