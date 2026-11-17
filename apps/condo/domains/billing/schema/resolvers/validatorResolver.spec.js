const { resolveValidation } = require('./validatorResolver')

const buildReceipt = (extra = {}) => ({
    month: 1,
    year: 2026,
    toPay: '100.00',
    ...extra,
})

describe('Register billing receipts validator', () => {
    test.each(['0', '0.00', '-10', '-10.25', '1000000000000000.12345678'])(
        'accepts money value %s',
        async (toPay) => {
            const result = await resolveValidation({ 0: buildReceipt({ toPay }) }, { context: {} })
            expect(result.errorReceipts).toEqual({})
        }
    )

    test.each(['10,25', '1 000.00', '', 'value', '1.2.3', 'NaN', 'Infinity', '+10', '1e3'])(
        'rejects money value %s',
        async (toPay) => {
            const result = await resolveValidation({ 0: buildReceipt({ toPay }) }, { context: {} })
            expect(result.receipts).toEqual({})
            expect(result.errorReceipts[0].extensions).toMatchObject({
                inputIndex: '0',
                messageInterpolation: { field: 'toPay', value: toPay },
            })
        }
    )

    test('validates nested service amounts but ignores volume and tariff', async () => {
        const result = await resolveValidation({
            0: buildReceipt({ services: [{ id: 'service-id', name: 'Service', toPay: '1.00', toPayDetails: { paid: '1,00', volume: '1,5', tariff: '2,5' } }] }),
        }, { context: {} })
        expect(result.errorReceipts[0].extensions.messageInterpolation).toEqual({
            field: 'services.0.toPayDetails.paid',
            value: '1,00',
        })
    })

    test('rejects a null service without stopping sibling receipts', async () => {
        const result = await resolveValidation({
            0: buildReceipt({ services: [null] }),
            1: buildReceipt(),
        }, { context: {} })
        expect(result.errorReceipts[0].extensions.messageInterpolation).toEqual({
            field: 'services.0',
            value: 'null',
        })
        expect(result.receipts).toHaveProperty('1')
    })

    test('rejects month zero', async () => {
        const result = await resolveValidation({ 0: buildReceipt({ month: 0 }) }, { context: {} })
        expect(result.errorReceipts[0].extensions.type).toEqual('WRONG_FORMAT')
    })

    test('rejects a negative four-character year', async () => {
        const result = await resolveValidation({ 0: buildReceipt({ year: -123 }) }, { context: {} })
        expect(result.errorReceipts[0].extensions.type).toEqual('WRONG_FORMAT')
    })
})
