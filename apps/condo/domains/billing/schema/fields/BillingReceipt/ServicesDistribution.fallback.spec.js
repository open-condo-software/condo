jest.mock('@open-condo/featureflags/featureToggleManager', () => ({
    featureToggleManager: { getFeatureValue: jest.fn() },
}))

jest.mock('@open-condo/keystone/logging', () => ({
    getLogger: jest.fn().mockReturnValue({ warn: jest.fn() }),
}))

const { featureToggleManager: { getFeatureValue } } = require('@open-condo/featureflags/featureToggleManager')
const { getLogger } = require('@open-condo/keystone/logging')
const { getLocalized } = require('@open-condo/locales/loader')

const {
    BILLING_RECEIPT_SERVICE_DISTRIBUTION_FALLBACK_CATEGORY,
} = require('@condo/domains/billing/constants/constants')

const { SERVICES_DISTRIBUTION_FIELD: field } = require('./ServicesDistribution')

describe('BillingReceipt servicesDistribution without config', () => {
    const resolve = () => field.resolver(
        { services: [{ name: 'Water removal', toPay: '1.25' }], toPay: '1.25' },
        {},
        { req: { locale: 'en' } },
    )

    test('groups every service into Other when the flag is missing', async () => {
        getFeatureValue.mockResolvedValueOnce(null)
        expect(await resolve()).toEqual([{
            categoryName: getLocalized('en', BILLING_RECEIPT_SERVICE_DISTRIBUTION_FALLBACK_CATEGORY),
            amount: '1.25',
            color: '#999999',
        }])
    })

    test('returns an empty distribution when the flag cannot be loaded', async () => {
        const err = new Error('flag unavailable')
        getFeatureValue.mockRejectedValueOnce(err)
        expect(await resolve()).toEqual([])
        expect(getLogger().warn).toHaveBeenCalledWith(expect.objectContaining({ err }))
    })

    test('returns an empty distribution when the flag is invalid', async () => {
        getFeatureValue.mockResolvedValueOnce({ patterns: 'invalid' })
        expect(await resolve()).toEqual([])
    })
})
