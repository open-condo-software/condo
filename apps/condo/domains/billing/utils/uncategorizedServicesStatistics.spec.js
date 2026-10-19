const { getKVClient } = require('@open-condo/keystone/kv')

const {
    getStatisticsKeys,
    MAX_SERVICE_NAME_BYTES,
    MAX_SERVICES_PER_RECEIPT,
    recordUncategorizedServices,
    SERVICE_NAME_TRUNCATION_MARKER,
    STATS_TTL_SECONDS,
} = require('./uncategorizedServicesStatistics')

jest.mock('@open-condo/keystone/kv', () => ({
    getKVClient: jest.fn(),
}))

jest.mock('@open-condo/keystone/logging', () => ({
    getLogger: jest.fn().mockReturnValue({ warn: jest.fn() }),
}))

jest.mock('@open-condo/config', () => ({
    BILLING_RECEIPT_SERVICE_CATEGORIES: {
        patterns: [{
            categoryName: 'billing.category.water.name',
            patterns: ['water'],
        }],
    },
    DEFAULT_LOCALE: 'ru',
}))

describe('UncategorizedServicesStatistics', () => {
    const execMock = jest.fn().mockResolvedValue([])
    const transaction = {
        hincrby: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: execMock,
    }
    const multiMock = jest.fn().mockReturnValue(transaction)

    beforeEach(() => {
        execMock.mockClear()
        transaction.hincrby.mockClear()
        transaction.expire.mockClear()
        multiMock.mockClear()
        getKVClient.mockReturnValue({
            multi: multiMock,
        })
    })

    test('builds period-scoped keys', () => {
        expect(getStatisticsKeys('2026-01-01')).toBe('billing:uncategorized-services:2026-01-01:services')
    })

    test('records unique unmatched service names with the configured TTL', async () => {
        await recordUncategorizedServices([
            {
                period: '2026-01-01',
                toPay: '2',
                services: [
                    { name: 'Water', toPay: '1' },
                    { name: '  Other service  ', toPay: '1' },
                ],
            },
            {
                period: '2026-01-01',
                toPay: '1',
                services: [{ name: 'Other service', toPay: '1' }],
            },
        ])

        expect(transaction.hincrby).toHaveBeenCalledWith(
            'billing:uncategorized-services:2026-01-01:services',
            'Other service',
            2,
        )
        expect(transaction.expire).toHaveBeenCalledWith(
            'billing:uncategorized-services:2026-01-01:services',
            STATS_TTL_SECONDS,
        )
        expect(execMock).toHaveBeenCalledTimes(1)
    })

    test('does not access Redis when there are no unmatched services', async () => {
        await recordUncategorizedServices([{
            period: '2026-01-01',
            toPay: '1',
            services: [{ name: 'Water', toPay: '1' }],
        }])

        expect(execMock).not.toHaveBeenCalled()
    })

    test('does not record services when their total differs from the receipt total', async () => {
        await recordUncategorizedServices([{
            period: '2026-01-01',
            toPay: '2',
            services: [{ name: 'Other service', toPay: '1' }],
        }])

        expect(execMock).not.toHaveBeenCalled()
    })

    test('uses a separate transaction for each period', async () => {
        await recordUncategorizedServices([
            {
                period: '2026-01-01',
                toPay: '1',
                services: [{ name: 'First service', toPay: '1' }],
            },
            {
                period: '2026-02-01',
                toPay: '1',
                services: [{ name: 'Second service', toPay: '1' }],
            },
        ])

        expect(multiMock).toHaveBeenCalledTimes(2)
        expect(execMock).toHaveBeenCalledTimes(2)
    })

    test('truncates long names and limits the number of services per receipt', async () => {
        await recordUncategorizedServices([{
            period: '2026-01-01',
            toPay: String(MAX_SERVICES_PER_RECEIPT + 1),
            services: Array.from({ length: MAX_SERVICES_PER_RECEIPT + 1 }, (_, index) => ({
                name: index === 0
                    ? 'x'.repeat(MAX_SERVICE_NAME_BYTES + 1)
                    : `Other service ${index}`,
                toPay: '1',
            })),
        }])

        expect(transaction.hincrby).toHaveBeenCalledTimes(MAX_SERVICES_PER_RECEIPT)
        expect(transaction.hincrby).toHaveBeenCalledWith(
            'billing:uncategorized-services:2026-01-01:services',
            `${'x'.repeat(MAX_SERVICE_NAME_BYTES - Buffer.byteLength(SERVICE_NAME_TRUNCATION_MARKER, 'utf8'))}${SERVICE_NAME_TRUNCATION_MARKER}`,
            1,
        )
    })

    test('removes control characters from service names', async () => {
        await recordUncategorizedServices([{
            period: '2026-01-01',
            toPay: '1',
            services: [{ name: 'Service\r\nSET GET DEL key value\u0000', toPay: '1' }],
        }])

        expect(transaction.hincrby).toHaveBeenCalledWith(
            'billing:uncategorized-services:2026-01-01:services',
            'Service SET GET DEL key value',
            1,
        )
    })

    test('does not remove Redis commands from inside words', async () => {
        await recordUncategorizedServices([{
            period: '2026-01-01',
            toPay: '1',
            services: [{ name: 'УслугаSETтест asset getter', toPay: '1' }],
        }])

        expect(transaction.hincrby).toHaveBeenCalledWith(
            'billing:uncategorized-services:2026-01-01:services',
            'УслугаSETтест asset getter',
            1,
        )
    })

})
