/**
 * @jest-environment node
 */

const {
    getPlanCapabilities,
    buildCatalog,
    getCatalogCounters,
    findUpsellPlan,
    resolveFeatureStatus,
} = require('./subscriptionCatalog')

const APP_ID = '00000000-0000-0000-0000-0000000000aa'

const price = (id, period, amount) => ({ id, name: id, period, price: amount, currencyCode: 'RUB' })

const labels = {
    news: { label: 'News', description: 'Send news' },
    ai: { label: 'AI', description: 'AI answers' },
    support: { label: 'Personal manager', description: 'A manager helps you' },
    marketplace: { label: 'Marketplace', description: 'Sell services' },
    [APP_ID]: { label: 'Some app', description: 'A miniapp' },
}

const featurePlan = (id, capabilities, overrides = {}) => ({
    plan: {
        id,
        name: id,
        planType: 'feature',
        enabledB2BApps: capabilities.filter(capability => capability === APP_ID),
        ...Object.fromEntries(capabilities.filter(capability => capability !== APP_ID).map(key => [key, true])),
        ...overrides,
    },
    prices: [price(`${id}-year`, 'year', '1000'), price(`${id}-month`, 'month', '100')],
})

const servicePlan = (id, capabilities, overrides = {}) => ({
    id,
    name: id,
    planType: 'service',
    enabledB2BApps: capabilities.filter(capability => capability === APP_ID),
    ...Object.fromEntries(capabilities.filter(capability => capability !== APP_ID).map(key => [key, true])),
    ...overrides,
})

describe('subscriptionCatalog', () => {
    describe('getPlanCapabilities', () => {
        it('collects enabled feature flags together with B2B apps', () => {
            expect(getPlanCapabilities(servicePlan('basic', ['news', APP_ID])).slice().sort())
                .toEqual(['news', APP_ID].sort())
        })

        it('ignores flags that are switched off', () => {
            expect(getPlanCapabilities({ id: 'x', name: 'x', news: false, ai: true })).toEqual(['ai'])
        })

        it('survives a missing plan', () => {
            expect(getPlanCapabilities(null)).toEqual([])
        })
    })

    describe('buildCatalog', () => {
        const featurePlans = [
            featurePlan('news-plan', ['news']),
            featurePlan('ai-plan', ['ai']),
            featurePlan('manager-plan', ['support']),
        ]

        const build = (plan, purchased = []) => buildCatalog({
            servicePlan: plan,
            featurePlans,
            period: 'year',
            purchasedFeaturePlanIds: new Set(purchased),
            capabilityLabels: labels,
            pinnedCapabilities: ['support'],
        })

        it('marks a feature as included when the plan already covers it', () => {
            const rows = build(servicePlan('basic', ['news']))
            const newsRow = rows.find(row => row.key === 'news-plan')

            expect(newsRow.includedInPlan).toBe(true)
            expect(newsRow.purchasable).toBe(false)
        })

        it('offers features the plan does not cover', () => {
            const rows = build(servicePlan('basic', ['news']))
            const aiRow = rows.find(row => row.key === 'ai-plan')

            expect(aiRow.includedInPlan).toBe(false)
            expect(aiRow.purchasable).toBe(true)
            expect(aiRow.price.id).toBe('ai-plan-year')
        })

        it('does not offer a feature the organization already bought', () => {
            const rows = build(servicePlan('basic', ['news']), ['ai-plan'])
            const aiRow = rows.find(row => row.key === 'ai-plan')

            expect(aiRow.purchased).toBe(true)
            expect(aiRow.purchasable).toBe(false)
        })

        it('keeps a multi-capability plan as one row, included only when all of it is covered', () => {
            const bundlePlans = [featurePlan('duo-plan', ['news', 'ai'])]
            const partially = buildCatalog({
                servicePlan: servicePlan('basic', ['news']),
                featurePlans: bundlePlans,
                period: 'year',
                purchasedFeaturePlanIds: new Set(),
                capabilityLabels: labels,
            })
            const fully = buildCatalog({
                servicePlan: servicePlan('pro', ['news', 'ai']),
                featurePlans: bundlePlans,
                period: 'year',
                purchasedFeaturePlanIds: new Set(),
                capabilityLabels: labels,
            })

            expect(partially).toHaveLength(1)
            expect(partially[0].includedInPlan).toBe(false)
            expect(fully[0].includedInPlan).toBe(true)
        })

        it('adds rows for capabilities that are only ever sold inside a plan', () => {
            const rows = build(servicePlan('basic', ['marketplace']))
            const marketplaceRow = rows.find(row => row.key === 'marketplace')

            expect(marketplaceRow.includedInPlan).toBe(true)
            expect(marketplaceRow.featurePlan).toBeNull()
            expect(marketplaceRow.price).toBeNull()
            expect(marketplaceRow.label).toBe('Marketplace')
        })

        it('puts features the plan does not give first, then included rows, then bought ones, pinned rows leading each group', () => {
            const rows = buildCatalog({
                servicePlan: servicePlan('basic', ['news']),
                featurePlans: [...featurePlans, featurePlan('marketplace-plan', ['marketplace'])],
                period: 'year',
                purchasedFeaturePlanIds: new Set(['marketplace-plan']),
                capabilityLabels: labels,
                pinnedCapabilities: ['support'],
            })

            expect(rows.map(row => row.key)).toEqual(['manager-plan', 'ai-plan', 'news-plan', 'marketplace-plan'])
        })

        it('does not offer a feature whose price needs a manual offer', () => {
            const rows = buildCatalog({
                servicePlan: servicePlan('basic', []),
                featurePlans: [{
                    plan: featurePlan('custom-plan', ['ai']).plan,
                    prices: [{ id: 'custom-year', name: 'On request', period: 'year', price: null, currencyCode: null }],
                }],
                period: 'year',
                purchasedFeaturePlanIds: new Set(),
                capabilityLabels: labels,
            })

            expect(rows[0].purchasable).toBe(false)
        })

        it('prefers the plan description over the generic capability text', () => {
            const rows = buildCatalog({
                servicePlan: servicePlan('basic', []),
                featurePlans: [featurePlan('news-plan', ['news'], { description: 'Editorial description' })],
                period: 'year',
                purchasedFeaturePlanIds: new Set(),
                capabilityLabels: labels,
            })

            expect(rows[0].description).toBe('Editorial description')
        })
    })

    describe('resolveFeatureStatus', () => {
        const now = new Date('2026-09-15T12:00:00Z')
        const context = (overrides) => ({ id: 'ctx', isTrial: false, startAt: '2026-08-15', endAt: '2026-10-15', renewalCancelledAt: null, ...overrides })

        it('reads an active paid context as connected', () => {
            expect(resolveFeatureStatus([context()], now, 5)).toMatchObject({ type: 'connected', contextId: 'ctx' })
        })

        it('reads an active paid context with declined renewal as renewalCancelled', () => {
            expect(resolveFeatureStatus([context({ renewalCancelledAt: '2026-09-01' })], now, 5).type).toBe('renewalCancelled')
        })

        it('reads an active trial as trial with the days left', () => {
            expect(resolveFeatureStatus([context({ isTrial: true, endAt: '2026-09-20T12:00:00Z' })], now, 5))
                .toMatchObject({ type: 'trial', daysLeft: 5 })
        })

        it('reads a paid period that ended within the buffer as an expired payment', () => {
            expect(resolveFeatureStatus([context({ endAt: '2026-09-13' })], now, 5).type).toBe('paymentExpired')
        })

        it('reads an ended trial, a cancelled period or one past the buffer as an expired trial', () => {
            expect(resolveFeatureStatus([context({ isTrial: true, endAt: '2026-09-13' })], now, 5).type).toBe('trialExpired')
            expect(resolveFeatureStatus([context({ endAt: '2026-09-13', renewalCancelledAt: '2026-09-01' })], now, 5).type).toBe('trialExpired')
            expect(resolveFeatureStatus([context({ endAt: '2026-09-01' })], now, 5).type).toBe('trialExpired')
        })

        it('prefers the context running now over an ended one', () => {
            const status = resolveFeatureStatus([
                context({ id: 'old', endAt: '2026-09-13' }),
                context({ id: 'renewed', startAt: '2026-09-13', endAt: '2026-10-13' }),
            ], now, 5)

            expect(status).toMatchObject({ type: 'connected', contextId: 'renewed' })
        })

        it('has no status without contexts', () => {
            expect(resolveFeatureStatus([], now, 5)).toBeNull()
        })
    })

    describe('getCatalogCounters', () => {
        it('counts owned rows as included and only the rest as available', () => {
            const rows = buildCatalog({
                servicePlan: servicePlan('basic', ['news']),
                featurePlans: [
                    featurePlan('news-plan', ['news']),
                    featurePlan('ai-plan', ['ai']),
                    featurePlan('manager-plan', ['support']),
                ],
                period: 'year',
                purchasedFeaturePlanIds: new Set(['ai-plan']),
                capabilityLabels: labels,
            })

            expect(getCatalogCounters(rows)).toEqual({ included: 2, available: 1 })
        })
    })

    describe('findUpsellPlan', () => {
        const candidates = [
            { plan: servicePlan('basic', ['news'], { priority: 1 }), amount: 500 },
            { plan: servicePlan('start', ['news', 'ai'], { priority: 2 }), amount: 1600 },
            { plan: servicePlan('pro', ['news', 'ai', 'support'], { priority: 3 }), amount: 5000 },
        ]

        it('offers the cheaper plan that already contains what is in the cart', () => {
            const found = findUpsellPlan({
                candidates,
                requiredCapabilities: ['ai'],
                cartAmount: 1900,
                minPriority: 1,
            })

            expect(found.plan.id).toBe('start')
        })

        it('stays quiet when buying the features separately is cheaper', () => {
            expect(findUpsellPlan({
                candidates,
                requiredCapabilities: ['ai'],
                cartAmount: 1000,
                minPriority: 1,
            })).toBeNull()
        })

        it('never suggests a plan that misses part of the cart', () => {
            const found = findUpsellPlan({
                candidates,
                requiredCapabilities: ['ai', 'support'],
                cartAmount: 6000,
                minPriority: 1,
            })

            expect(found.plan.id).toBe('pro')
        })

        it('never suggests a downgrade', () => {
            expect(findUpsellPlan({
                candidates,
                requiredCapabilities: ['ai'],
                cartAmount: 1900,
                minPriority: 2,
            })).toBeNull()
        })

        it('ignores plans priced on request', () => {
            expect(findUpsellPlan({
                candidates: [{ plan: servicePlan('enterprise', ['ai'], { priority: 9 }), amount: null }],
                requiredCapabilities: ['ai'],
                cartAmount: 100000,
                minPriority: 1,
            })).toBeNull()
        })

        it('has nothing to suggest for an empty cart', () => {
            expect(findUpsellPlan({
                candidates,
                requiredCapabilities: [],
                cartAmount: 0,
                minPriority: 0,
            })).toBeNull()
        })
    })
})
