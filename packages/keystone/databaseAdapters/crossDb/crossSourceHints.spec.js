const {
    listHasCrossSourceOutbound,
    listHasCrossSourceInbound,
    listNeedsCrossDbWhereRewrite,
} = require('./crossSourceHints')

const { createPoolBasedSourceRegistry } = require('../sourceRegistry')

function createAdapterFixture () {
    const poolsConfig = {
        main: { databases: ['main'], writable: true },
        billing: { databases: ['billing'], writable: true },
    }
    const sourceRegistry = createPoolBasedSourceRegistry({
        poolTables: {
            main: new Set(['Organization', 'User', 'Payment', 'Ticket']),
            billing: new Set(['BillingReceipt']),
        },
        routingRules: [
            { tableName: 'BillingReceipt', target: 'billing' },
            { target: 'main' },
        ],
        replicaPoolsConfig: poolsConfig,
    })

    return {
        _sourceRegistry: sourceRegistry,
        getSourceRegistry () { return sourceRegistry },
        listAdapters: {
            Organization: {
                fieldAdapters: [
                    { isRelationship: true, refListKey: 'User', path: 'createdBy' },
                ],
            },
            Ticket: {
                fieldAdapters: [
                    { isRelationship: true, refListKey: 'Organization', path: 'organization' },
                    { isRelationship: true, refListKey: 'User', path: 'executor' },
                ],
            },
            Payment: {
                fieldAdapters: [
                    {
                        isRelationship: true,
                        refListKey: 'BillingReceipt',
                        path: 'receipt',
                        rel: { tableName: 'Payment', columnName: 'receipt' },
                    },
                ],
            },
            BillingReceipt: {
                fieldAdapters: [
                    { isRelationship: true, refListKey: 'Organization', path: 'context' },
                ],
            },
            User: {
                fieldAdapters: [],
            },
        },
    }
}

describe('crossSourceHints (main-path fast skips)', () => {
    test('main-only Ticket/User need no where rewrite and have no outbound', () => {
        const adapter = createAdapterFixture()

        expect(listHasCrossSourceOutbound(adapter, 'Ticket')).toBe(false)
        expect(listHasCrossSourceOutbound(adapter, 'User')).toBe(false)
        expect(listHasCrossSourceInbound(adapter, 'Ticket')).toBe(false)
        expect(listHasCrossSourceInbound(adapter, 'User')).toBe(false)
        expect(listNeedsCrossDbWhereRewrite(adapter, 'Ticket')).toBe(false)
        expect(listNeedsCrossDbWhereRewrite(adapter, 'User')).toBe(false)
        expect(listNeedsCrossDbWhereRewrite(adapter, 'Organization')).toBe(false)
    })

    test('Organization is main-only for SELECT/where but has inbound from BillingReceipt', () => {
        const adapter = createAdapterFixture()

        expect(listHasCrossSourceOutbound(adapter, 'Organization')).toBe(false)
        expect(listHasCrossSourceInbound(adapter, 'Organization')).toBe(true)
    })

    test('Payment has outbound to billing; BillingReceipt has inbound from Payment', () => {
        const adapter = createAdapterFixture()

        expect(listHasCrossSourceOutbound(adapter, 'Payment')).toBe(true)
        expect(listHasCrossSourceInbound(adapter, 'BillingReceipt')).toBe(true)
        expect(listNeedsCrossDbWhereRewrite(adapter, 'Payment')).toBe(true)
        expect(listNeedsCrossDbWhereRewrite(adapter, 'BillingReceipt')).toBe(true)
    })

    test('caches hint results on the adapter instance', () => {
        const adapter = createAdapterFixture()
        listHasCrossSourceOutbound(adapter, 'Organization')
        listHasCrossSourceOutbound(adapter, 'Payment')

        expect(adapter.__crossSourceOutboundCache.get('Organization')).toBe(false)
        expect(adapter.__crossSourceOutboundCache.get('Payment')).toBe(true)
    })
})
