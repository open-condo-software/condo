const Big = require('big.js')

const mockBillingReceiptServiceCategories = {
    colors: {
        'billing.category.hot_water.name': '#ff0000',
        'billing.category.water_removal.name': '#0000ff',
        'billing.category.other.name': '#999999',
        invalidColor: 42,
    },
    patterns: [
        {
            categoryName: 'billing.category.invalid.name',
            patterns: [17, { expression: '[', flags: [] }],
        },
        {
            categoryName: 'billing.category.water_removal.name',
            patterns: ['water removal'],
        },
        {
            categoryName: 'billing.category.hot_water.name',
            patterns: [{ expression: 'hot.*water', flags: ['i', 'g'] }],
        },
    ],
}

jest.mock('@open-condo/keystone/logging', () => ({
    getLogger: jest.fn().mockReturnValue({ warn: jest.fn() }),
}))

require('@condo/domains/common/utils/testSchema/env').mockEnv({
    BILLING_RECEIPT_SERVICE_CATEGORIES: mockBillingReceiptServiceCategories,
})

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { getLocalized } = require('@open-condo/locales/loader')

const { SERVICES_DISTRIBUTION_FIELD } = require('./ServicesDistribution')
const logger = getLogger()

describe('BillingReceipt servicesDistribution', () => {
    const resolve = (services, locale = 'ru', toPay = services?.reduce((sum, service) => sum.plus(service.toPay), Big(0)).toString()) => SERVICES_DISTRIBUTION_FIELD.resolver(
        { services, toPay },
        {},
        { req: { locale } },
    )

    test('uses first matching pattern, normalizes text, and returns translated category names', async () => {
        expect(await resolve([
            { name: 'Water removal hot water', toPay: '0.1' },
            { name: 'Hot water', toPay: '0.2' },
        ])).toEqual([
            { categoryName: getLocalized('ru', 'billing.category.water_removal.name'), amount: '0.10', color: '#0000ff' },
            { categoryName: getLocalized('ru', 'billing.category.hot_water.name'), amount: '0.20', color: '#ff0000' },
        ])
    })

    test('skips invalid config entries and logs all issues once', () => {
        expect(logger.warn).toHaveBeenCalledTimes(1)
        expect(logger.warn.mock.calls[0][0].data.issues).toEqual(expect.arrayContaining([
            expect.stringContaining('BILLING_RECEIPT_SERVICE_CATEGORIES.colors.invalidColor'),
            expect.stringContaining('BILLING_RECEIPT_SERVICE_CATEGORIES.patterns.0.patterns.0'),
            expect.stringContaining('BILLING_RECEIPT_SERVICE_CATEGORIES.patterns.0.patterns.1'),
        ]))
    })

    test('aggregates by translation key, not by localized category name', async () => {
        expect(await resolve([
            { name: 'Hot water', toPay: '0.1' },
            { name: 'Water removal', toPay: '0.2' },
            { name: 'Hot water', toPay: '0.2' },
        ], 'en')).toEqual([
            { categoryName: getLocalized('en', 'billing.category.water_removal.name'), amount: '0.20', color: '#0000ff' },
            { categoryName: getLocalized('en', 'billing.category.hot_water.name'), amount: '0.30', color: '#ff0000' },
        ])
    })

    test('uses the default locale when request locale is unsupported and sends unmatched services to Other', async () => {
        expect(await resolve([
            { name: 'Uncategorized service', toPay: '-1.25' },
        ], 'unsupported')).toEqual([
            { categoryName: getLocalized(conf.DEFAULT_LOCALE, 'billing.category.other.name'), amount: '-1.25', color: '#999999' },
        ])
    })

    test('keeps zero and negative amounts and returns an empty list when there are no services', async () => {
        expect(await resolve([
            { name: 'Hot water', toPay: '0' },
            { name: 'Hot water', toPay: '-0.3' },
        ])).toEqual([
            { categoryName: getLocalized('ru', 'billing.category.hot_water.name'), amount: '-0.30', color: '#ff0000' },
        ])
        expect(await resolve([])).toEqual([])
        expect(await resolve(null)).toEqual([])
    })

    test('returns an empty list when the services total differs from the receipt total', async () => {
        expect(await resolve([
            { name: 'Hot water', toPay: '0.1' },
            { name: 'Water removal', toPay: '0.2' },
        ], 'ru', '0.4')).toEqual([])
    })
})
