require('@condo/domains/common/utils/testSchema/env').mockEnv({
    BILLING_RECEIPT_SERVICE_CATEGORIES: () => undefined,
})

jest.mock('@open-condo/keystone/logging', () => ({
    getLogger: jest.fn().mockReturnValue({ warn: jest.fn() }),
}))

const { getLogger } = require('@open-condo/keystone/logging')
const { getLocalized } = require('@open-condo/locales/loader')

const {
    BILLING_RECEIPT_SERVICE_DISTRIBUTION_FALLBACK_CATEGORY,
} = require('@condo/domains/billing/constants/constants')

const { SERVICES_DISTRIBUTION_FIELD } = require('./ServicesDistribution')
const logger = getLogger()

describe('BillingReceipt servicesDistribution without config', () => {
    test('groups every service into Other without logging a config warning', async () => {
        const result = await SERVICES_DISTRIBUTION_FIELD.resolver(
            { services: [{ name: 'Water removal', toPay: '1.25' }], toPay: '1.25' },
            {},
            { req: { locale: 'en' } },
        )

        expect(result).toEqual([{
            categoryName: getLocalized('en', BILLING_RECEIPT_SERVICE_DISTRIBUTION_FALLBACK_CATEGORY),
            amount: '1.25',
            color: '#999999',
        }])
        expect(logger.warn).not.toHaveBeenCalled()
    })
})
