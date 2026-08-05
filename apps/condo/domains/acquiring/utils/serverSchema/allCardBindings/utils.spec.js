const { deduplicateCardTokens } = require('@condo/domains/acquiring/utils/serverSchema/allCardBindings/utils')

describe('deduplicateCardTokens', () => {
    test('should merge duplicate cards', () => {
        const result = deduplicateCardTokens([
            {
                id: '1',
                acquiringIntegrationId: 'integration-1',
                cardNumber: '****1111',
                paymentSystem: 'MIR',
                expiration: '0128',
                bankName: '',
                bankCountryCode: '',
            },
            {
                id: '1',
                acquiringIntegrationId: 'integration-2',
                cardNumber: '****1111',
                paymentSystem: 'MIR',
                expiration: '0128',
                bankName: 'Sber',
                bankCountryCode: 'RU',
            },
        ])

        expect(result).toEqual([
            {
                id: '1',
                acquiringIntegrationId: 'integration-1',
                acquiringIntegrationIds: [
                    'integration-1',
                    'integration-2',
                ],
                cardNumber: '****1111',
                paymentSystem: 'MIR',
                expiration: '0128',
                bankName: 'Sber',
                bankCountryCode: 'RU',
            },
        ])
    })

    test('should not duplicate integration ids', () => {
        const result = deduplicateCardTokens([
            {
                id: '1',
                acquiringIntegrationId: 'integration-1',
            },
            {
                id: '1',
                acquiringIntegrationId: 'integration-1',
            },
        ])

        expect(result[0].acquiringIntegrationIds).toEqual([
            'integration-1',
        ])
    })

    test('should keep unique cards', () => {
        const result = deduplicateCardTokens([
            { id: '1', acquiringIntegrationId: 'a' },
            { id: '2', acquiringIntegrationId: 'b' },
        ])

        expect(result).toHaveLength(2)
    })
})