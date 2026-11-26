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

let disableRefresh
require('@condo/domains/common/utils/testSchema/env').mockEnv({
    DISABLE_BILLING_RECEIPT_SERVICE_CATEGORIES_REFRESH: () => disableRefresh,
})

const conf = require('@open-condo/config')
const { getLocalized } = require('@open-condo/locales/loader')

const REFRESH_INTERVAL_MS = 5 * 60 * 1000
const CONCURRENT_REQUEST_COUNT = 10

describe('BillingReceipt servicesDistribution', () => {
    let field, getFeatureValue, logger
    const resolve = (services, locale = 'ru', toPay = services?.reduce((sum, service) => sum.plus(service.toPay), Big(0)).toString()) => field.resolver(
        { services, toPay },
        {},
        { req: { locale } },
    )

    beforeEach(() => {
        disableRefresh = false
        jest.isolateModules(() => {
            getFeatureValue = require('@open-condo/featureflags/featureToggleManager').featureToggleManager.getFeatureValue
            logger = require('@open-condo/keystone/logging').getLogger()
            field = require('./ServicesDistribution').SERVICES_DISTRIBUTION_FIELD
        })
        getFeatureValue.mockResolvedValue(mockBillingReceiptServiceCategories)
    })

    afterEach(() => {
        jest.restoreAllMocks()
        jest.useRealTimers()
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

    test('concurrent requests wait for the same initial config load', async () => {
        jest.useFakeTimers()
        const receipt = { services: [{ name: 'Hot water', toPay: '1.00' }], toPay: '1.00' }
        getFeatureValue.mockImplementation(() => new Promise(resolve => {
            setTimeout(() => resolve(mockBillingReceiptServiceCategories), 1000)
        }))

        const contexts = Array.from({ length: CONCURRENT_REQUEST_COUNT }, () => ({ req: { locale: 'ru' } }))
        const onResponse = jest.fn()
        const requests = contexts.map(async context => {
            const distribution = await field.resolver(receipt, {}, context)
            onResponse()
            return distribution
        })

        await jest.advanceTimersByTimeAsync(999)
        expect(onResponse).not.toHaveBeenCalled()
        expect(getFeatureValue).toHaveBeenCalledTimes(1)
        expect(getFeatureValue).toHaveBeenCalledWith(contexts[0], 'billing-receipt-service-categories', null)
        expect(getFeatureValue.mock.calls[0][0]).toBe(contexts[0])

        await jest.advanceTimersByTimeAsync(1)
        expect(onResponse).toHaveBeenCalledTimes(CONCURRENT_REQUEST_COUNT)

        const expectedDistribution = [
            { categoryName: getLocalized('ru', 'billing.category.hot_water.name'), amount: '1.00', color: '#ff0000' },
        ]
        for (const distribution of await Promise.all(requests)) {
            expect(distribution).toEqual(expectedDistribution)
        }
        expect(getFeatureValue).toHaveBeenCalledTimes(1)
    })

    test('reports invalid config entries only once when reusing the loaded rules', async () => {
        const services = [{ name: 'Hot water', toPay: '1.00' }]
        await resolve(services)
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

    test('skips flag loading when disabled and serves the current config', async () => {
        let now = Date.now()
        jest.spyOn(Date, 'now').mockImplementation(() => now)
        const services = [{ name: 'Hot water', toPay: '1.00' }]
        disableRefresh = true
        expect(await resolve(services)).toEqual([
            { categoryName: getLocalized('ru', 'billing.servicesDistribution.other.name'), amount: '1.00', color: '#999999' },
        ])
        expect(getFeatureValue).not.toHaveBeenCalled()

        disableRefresh = false
        const hotWater = [{ categoryName: getLocalized('ru', 'billing.category.hot_water.name'), amount: '1.00', color: '#ff0000' }]
        expect(await resolve(services)).toEqual(hotWater)

        disableRefresh = true
        now += REFRESH_INTERVAL_MS
        expect(await resolve(services)).toEqual(hotWater)
        expect(getFeatureValue).toHaveBeenCalledTimes(1)
    })

    test('releases all initial requests at the same deadline and uses the config when it arrives later', async () => {
        jest.useFakeTimers()
        const services = [{ name: 'Hot water', toPay: '1.00' }]
        const other = [{ categoryName: getLocalized('ru', 'billing.servicesDistribution.other.name'), amount: '1.00', color: '#999999' }]
        getFeatureValue.mockImplementationOnce(() => new Promise(resolve => {
            // NOTE getFeatureValue resolves in 6 seconds, but code expects it to resolve in 5 seconds
            setTimeout(() => resolve(mockBillingReceiptServiceCategories), 6000)
        }))

        const onResponse = jest.fn()
        const firstBatch = Array.from({ length: CONCURRENT_REQUEST_COUNT / 2 }, () => resolve(services).then(onResponse))
        await jest.advanceTimersByTimeAsync(4000)
        const secondBatch = Array.from({ length: CONCURRENT_REQUEST_COUNT / 2 }, () => resolve(services).then(onResponse))
        await jest.advanceTimersByTimeAsync(999)
        expect(onResponse).not.toHaveBeenCalled()

        await jest.advanceTimersByTimeAsync(1)
        expect(onResponse).toHaveBeenCalledTimes(CONCURRENT_REQUEST_COUNT)
        await Promise.all([...firstBatch, ...secondBatch])
        for (const [distribution] of onResponse.mock.calls) {
            expect(distribution).toEqual(other)
        }
        expect(await resolve(services)).toEqual(other)
        expect(getFeatureValue).toHaveBeenCalledTimes(1)

        await jest.advanceTimersByTimeAsync(1000)
        expect(await resolve(services)).toEqual([{ categoryName: getLocalized('ru', 'billing.category.hot_water.name'), amount: '1.00', color: '#ff0000' }])
        expect(getFeatureValue).toHaveBeenCalledTimes(1)
    })

    test('retries after a refresh times out and ignores its late result', async () => {
        jest.useFakeTimers()
        const services = [{ name: 'Hot water', toPay: '1.00' }]
        const hotWater = [{ categoryName: getLocalized('ru', 'billing.category.hot_water.name'), amount: '1.00', color: '#ff0000' }]
        const other = [{ categoryName: getLocalized('ru', 'billing.servicesDistribution.other.name'), amount: '1.00', color: '#999999' }]
        expect(await resolve(services)).toEqual(hotWater)
        logger.warn.mockClear()

        getFeatureValue.mockImplementationOnce(() => new Promise(resolve => {
            setTimeout(() => resolve(mockBillingReceiptServiceCategories), 30_000 + REFRESH_INTERVAL_MS + 1_000)
        })).mockResolvedValueOnce({ colors: {}, patterns: [] })

        await jest.advanceTimersByTimeAsync(REFRESH_INTERVAL_MS)
        expect(await resolve(services)).toEqual(hotWater)
        expect(getFeatureValue).toHaveBeenCalledTimes(2)

        await jest.advanceTimersByTimeAsync(30_000 + REFRESH_INTERVAL_MS - 1)
        expect(await resolve(services)).toEqual(hotWater)
        expect(getFeatureValue).toHaveBeenCalledTimes(2)
        expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({
            err: expect.objectContaining({ message: 'Config refresh timed out after 30000 ms' }),
        }))

        await jest.advanceTimersByTimeAsync(1)
        expect(await resolve(services)).toEqual(hotWater)
        expect(getFeatureValue).toHaveBeenCalledTimes(3)
        expect(await resolve(services)).toEqual(other)

        await jest.advanceTimersByTimeAsync(1_000)
        expect(await resolve(services)).toEqual(other)
        expect(getFeatureValue).toHaveBeenCalledTimes(3)
    })

    test('keeps the previous config during refresh and after a failed or missing value until an explicit reset', async () => {
        jest.useFakeTimers()
        const services = [{ name: 'Hot water', toPay: '1.00' }]
        const hotWater = [{ categoryName: getLocalized('ru', 'billing.category.hot_water.name'), amount: '1.00', color: '#ff0000' }]
        expect(await resolve(services)).toEqual(hotWater)

        getFeatureValue.mockRejectedValueOnce(new Error('flag unavailable')).mockResolvedValueOnce(null)

        // check that we still use prev config
        jest.advanceTimersByTime(REFRESH_INTERVAL_MS - 1)
        expect(await resolve(services)).toEqual(hotWater)
        expect(getFeatureValue).toHaveBeenCalledTimes(1)

        jest.advanceTimersByTime(1)
        // time to refresh, here we use prev config, new config is being loaded in background
        expect(await resolve(services)).toEqual(hotWater)
        // new config was rejected with error, so prev config is still used
        expect(await resolve(services)).toEqual(hotWater)
        expect(getFeatureValue).toHaveBeenCalledTimes(2)

        jest.advanceTimersByTime(REFRESH_INTERVAL_MS)
        // time to refresh, here we use prev config, new config is being loaded in background
        expect(await resolve(services)).toEqual(hotWater)
        // new config was resolved with null, so prev config is still used
        expect(await resolve(services)).toEqual(hotWater)
        expect(getFeatureValue).toHaveBeenCalledTimes(3)

        getFeatureValue.mockImplementationOnce(() => new Promise(resolve => {
            setTimeout(() => resolve({ colors: {}, patterns: [] }), 1000)
        }))
        jest.advanceTimersByTime(REFRESH_INTERVAL_MS)
        // time to refresh, here we use prev config, new config is being loaded in background
        const requests = Array.from({ length: CONCURRENT_REQUEST_COUNT }, () => resolve(services))
        for (const distribution of await Promise.all(requests)) {
            expect(distribution).toEqual(hotWater)
        }
        expect(getFeatureValue).toHaveBeenCalledTimes(4)

        await jest.advanceTimersByTimeAsync(1000)
        // new config was valid, so it is used
        expect(await resolve(services)).toEqual([
            { categoryName: getLocalized('ru', 'billing.servicesDistribution.other.name'), amount: '1.00', color: '#999999' },
        ])
        expect(getFeatureValue).toHaveBeenCalledTimes(4)
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
