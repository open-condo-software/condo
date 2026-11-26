jest.mock('@open-condo/featureflags/featureToggleManager', () => ({
    featureToggleManager: { getFeatureValue: jest.fn() },
}))

jest.mock('@open-condo/keystone/logging', () => ({
    getLogger: jest.fn().mockReturnValue({ warn: jest.fn() }),
}))

const { getLocalized } = require('@open-condo/locales/loader')

const {
    BILLING_RECEIPT_SERVICE_DISTRIBUTION_FALLBACK_CATEGORY,
} = require('@condo/domains/billing/constants/constants')

describe('BillingReceipt servicesDistribution without config', () => {
    test.each([false, true])('groups every service into Other (flag read failed: %s)', async (failed) => {
        let field, logger
        jest.isolateModules(() => {
            const { getFeatureValue } = require('@open-condo/featureflags/featureToggleManager').featureToggleManager
            if (failed) {
                getFeatureValue.mockRejectedValueOnce(new Error('flag unavailable'))
            } else {
                getFeatureValue.mockResolvedValueOnce(null)
            }
            logger = require('@open-condo/keystone/logging').getLogger()
            field = require('./ServicesDistribution').SERVICES_DISTRIBUTION_FIELD
        })

        const result = await field.resolver(
            { services: [{ name: 'Water removal', toPay: '1.25' }], toPay: '1.25' },
            {},
            { req: { locale: 'en' } },
        )

        expect(result).toEqual([{
            categoryName: getLocalized('en', BILLING_RECEIPT_SERVICE_DISTRIBUTION_FALLBACK_CATEGORY),
            amount: '1.25',
            color: '#999999',
        }])
        expect(logger.warn).toHaveBeenCalledTimes(failed ? 1 : 0)
    })
})
