const { validateReceiptInputs } = require('./validateReceiptInputs')

const buildReceipt = (extra = {}) => ({
    month: 1,
    year: 2026,
    toPay: '100.00',
    ...extra,
})

function catchValidationError (receipts, context = {}) {
    try {
        validateReceiptInputs(receipts, context)
    } catch (error) {
        return error
    }
    return null
}

describe('Register billing receipts input validation', () => {
    test.each(['0', '0.00', '-10', '-10.25', '1000000000000000.12345678'])(
        'accepts money value %s',
        toPay => {
            expect(() => validateReceiptInputs([buildReceipt({ toPay })], {})).not.toThrow()
        }
    )

    test.each(['10,25', '1 000.00', '', 'value', '1.2.3', 'NaN', 'Infinity', '+10', '1e3'])(
        'rejects money value %s',
        toPay => {
            const error = catchValidationError([buildReceipt(), buildReceipt({ toPay })])
            expect(error.extensions).toMatchObject({
                code: 'BAD_USER_INPUT',
                inputIndex: 1,
                messageInterpolation: { field: 'toPay', value: toPay },
            })
        }
    )

    test.each([
        ['en', 'Invalid amount in toPay: 10,25. Use a period as the decimal separator'],
        ['ru', 'Некорректная сумма в поле toPay: 10,25. Используйте точку как десятичный разделитель'],
        ['es', 'Importe no válido en toPay: 10,25. Utilice un punto como separador decimal'],
    ])('returns a localized amount error for %s locale', (locale, expectedMessage) => {
        const context = { req: { headers: { 'accept-language': locale } } }
        const error = catchValidationError([buildReceipt({ toPay: '10,25' })], context)

        expect(error.extensions).toMatchObject({
            messageForUser: expectedMessage,
            messageForUserTemplateKey: 'api.billing.registerBillingReceipts.WRONG_AMOUNT_FORMAT',
        })
    })

    test('validates nested service amounts but ignores volume and tariff', () => {
        const error = catchValidationError([buildReceipt({
            services: [{ id: 'service-id', name: 'Service', toPay: '1.00', toPayDetails: { paid: '1,00', volume: '1,5', tariff: '2,5' } }],
        })])
        expect(error.extensions.messageInterpolation).toEqual({
            field: 'services.0.toPayDetails.paid',
            value: '1,00',
        })
    })

    test('rejects a null service', () => {
        const error = catchValidationError([buildReceipt({ services: [null] })])
        expect(error.extensions.messageInterpolation).toEqual({
            field: 'services.0',
            value: 'null',
        })
    })

    test('rejects month zero', () => {
        const error = catchValidationError([buildReceipt({ month: 0 })])
        expect(error.extensions).toMatchObject({
            code: 'BAD_USER_INPUT',
            type: 'WRONG_FORMAT',
            messageInterpolation: { month: 0 },
        })
    })

    test('rejects a negative four-character year', () => {
        const error = catchValidationError([buildReceipt({ year: -123 })])
        expect(error.extensions).toMatchObject({
            code: 'BAD_USER_INPUT',
            type: 'WRONG_FORMAT',
            messageInterpolation: { year: -123 },
        })
    })
})
