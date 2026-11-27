const Big = require('big.js')

const mockBillingReceiptServiceCategories = {
    colors: {
        'billing.category.hot_water.name': '#ff0000',
        'billing.category.water_removal.name': '#0000ff',
        'billing.servicesDistribution.other.name': '#999999',
        invalidColor: 42,
    },
    patterns: [
        {
            categoryName: 'billing.category.invalid.name',
            patterns: [17, { expression: '[', flags: [] }],
        },
        {
            categoryName: 'billing.servicesDistribution.other.name',
            patterns: ['explicit other'],
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

jest.mock('@open-condo/featureflags/featureToggleManager', () => ({
    featureToggleManager: { getFeatureValue: jest.fn() },
}))

let disableDistribution
require('@condo/domains/common/utils/testSchema/env').mockEnv({
    DISABLE_BILLING_RECEIPT_SERVICES_DISTRIBUTION: () => disableDistribution,
})

const conf = require('@open-condo/config')
const { getLocalized } = require('@open-condo/locales/loader')

describe('BillingReceipt servicesDistribution', () => {
    const { featureToggleManager: { getFeatureValue } } = require('@open-condo/featureflags/featureToggleManager')
    const logger = require('@open-condo/keystone/logging').getLogger()
    const { SERVICES_DISTRIBUTION_FIELD: field } = require('./ServicesDistribution')
    const resolve = (services, locale = 'ru', toPay = services?.reduce((sum, service) => sum.plus(service.toPay), Big(0)).toString()) => field.resolver(
        { services, toPay },
        {},
        { req: { locale } },
    )

    beforeEach(() => {
        disableDistribution = undefined
        getFeatureValue.mockReset()
        logger.warn.mockClear()
        getFeatureValue.mockResolvedValue(mockBillingReceiptServiceCategories)
    })

    test('uses first matching pattern, normalizes text, and returns translated category names', async () => {
        expect(await resolve([
            { name: 'Water removal hot water', toPay: '0.1' },
            { name: 'Hot water', toPay: '0.2' },
        ])).toEqual([
            { categoryName: getLocalized('ru', 'billing.category.water_removal.name'), amount: '0.10', color: '#0000ff' },
            { categoryName: getLocalized('ru', 'billing.category.hot_water.name'), amount: '0.20', color: '#ff0000' },
        ])
    })

    test('normalizes whitespace around slashes and turns hyphens into spaces after that', async () => {
        getFeatureValue.mockResolvedValueOnce({
            patterns: [{ categoryName: 'billing.category.hot_water.name', patterns: ['^елка/ вода горячая$'] }],
        })

        expect(await resolve([{ name: 'Ёлка\u00a0\t/ -  Вода--горячая', toPay: '1' }])).toEqual([
            { categoryName: getLocalized('ru', 'billing.category.hot_water.name'), amount: '1.00', color: '#999999' },
        ])
    })

    test('reports invalid config entries', async () => {
        const services = [{ name: 'Hot water', toPay: '1.00' }]
        await resolve(services)

        expect(logger.warn).toHaveBeenCalledTimes(1)
        expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({
            data: {
                issues: expect.arrayContaining([
                    expect.stringContaining('billing-receipt-service-categories.colors.invalidColor'),
                    expect.stringContaining('billing-receipt-service-categories.patterns.0.patterns.0'),
                    expect.stringContaining('billing-receipt-service-categories.patterns.0.patterns.1'),
                ]),
            },
        }))
    })

    test('returns an empty distribution without reading the flag when disabled', async () => {
        disableDistribution = true
        expect(await resolve([{ name: 'Hot water', toPay: '1.00' }])).toEqual([])
        expect(getFeatureValue).not.toHaveBeenCalled()
    })

    test('uses the current flag value for each calculation', async () => {
        const services = [{ name: 'Hot water', toPay: '1.00' }]
        expect(await resolve(services)).toEqual([
            { categoryName: getLocalized('ru', 'billing.category.hot_water.name'), amount: '1.00', color: '#ff0000' },
        ])
        getFeatureValue.mockResolvedValueOnce({ patterns: [] })
        expect(await resolve(services)).toEqual([
            { categoryName: getLocalized('ru', 'billing.servicesDistribution.other.name'), amount: '1.00', color: '#999999' },
        ])
        expect(getFeatureValue).toHaveBeenCalledTimes(2)
        expect(getFeatureValue).toHaveBeenLastCalledWith({ req: { locale: 'ru' } }, 'billing-receipt-service-categories', null)
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

    test('preserves sub-cent category amounts so the distribution still adds up to the receipt total', async () => {
        const distribution = await resolve([
            { name: 'Hot water', toPay: '0.005' },
            { name: 'Water removal', toPay: '0.005' },
        ], 'en', '0.01')

        expect(distribution).toEqual([
            { categoryName: getLocalized('en', 'billing.category.water_removal.name'), amount: '0.005', color: '#0000ff' },
            { categoryName: getLocalized('en', 'billing.category.hot_water.name'), amount: '0.005', color: '#ff0000' },
        ])
    })

    test('rounds category totals to at most four decimal places', async () => {
        expect(await resolve([{ name: 'Hot water', toPay: '1.222256' }])).toEqual([
            { categoryName: getLocalized('ru', 'billing.category.hot_water.name'), amount: '1.2223', color: '#ff0000' },
        ])
    })

    test('uses the default locale when request locale is unsupported and sends unmatched services to Other', async () => {
        expect(await resolve([
            { name: 'Uncategorized service', toPay: '-1.25' },
        ], 'unsupported')).toEqual([
            { categoryName: getLocalized(conf.DEFAULT_LOCALE, 'billing.servicesDistribution.other.name'), amount: '-1.25', color: '#999999' },
        ])
    })

    test('groups explicit Other rules with unmatched services and keeps Other last', async () => {
        const services = [
            { name: 'Explicit other', toPay: '0.50' },
            { name: 'Hot water', toPay: '0.25' },
            { name: 'Unknown service', toPay: '0.75' },
        ]
        expect(await resolve(services)).toEqual([
            { categoryName: getLocalized('ru', 'billing.category.hot_water.name'), amount: '0.25', color: '#ff0000' },
            { categoryName: getLocalized('ru', 'billing.servicesDistribution.other.name'), amount: '1.25', color: '#999999' },
        ])
    })

    test('keeps zero and negative amounts', async () => {
        expect(await resolve([
            { name: 'Hot water', toPay: '0' },
            { name: 'Hot water', toPay: '-0.3' },
        ])).toEqual([
            { categoryName: getLocalized('ru', 'billing.category.hot_water.name'), amount: '-0.30', color: '#ff0000' },
        ])
    })

    test.each(['80.00', '0.00'])('keeps the full services distribution when the remaining amount is %s', async (toPay) => {
        const result = await field.resolver({
            services: [{ name: 'Hot water', toPay: '100.00' }],
            toPay,
            paid: Big(100).minus(toPay).toFixed(2),
        }, {}, { req: { locale: 'ru' } })

        expect(result).toEqual([
            { categoryName: getLocalized('ru', 'billing.category.hot_water.name'), amount: '100.00', color: '#ff0000' },
        ])
    })

    test('does not load the flag when there are no services or their total differs from the receipt total', async () => {
        expect(await resolve([])).toEqual([])
        expect(await resolve(null)).toEqual([])
        expect(await resolve([
            { name: 'Hot water', toPay: '0.1' },
            { name: 'Water removal', toPay: '0.2' },
        ], 'ru', '0.4')).toEqual([])
        expect(getFeatureValue).not.toHaveBeenCalled()
    })
})
