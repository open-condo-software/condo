const { faker } = require('@faker-js/faker')

const { PAYMENTS_LIMIT } = require('@condo/domains/acquiring/constants/registerExternalPayments')
const {
    validatePayments,
    validateCurrencyCode,
    validatePeriodFormat,
    validateDateFormat,
    validateNumericValues,
    validatePositiveAmount,
    validateDuplicatedTransactionIds,
    validatePaymentsNumberLimits,
    validateExistingMultiPayments,
    validateAccountNumber,
    validatePaymentOrder,
    validateBankAccount,
    validateRoutingNumber,
    validateTin,
    validateAddress,
} = require('@condo/domains/acquiring/utils/serverSchema/registerExternalPayments/validators')
const { ISO_CODES } = require('@condo/domains/common/constants/currencies')

describe('RegisterExternalPayments Validators', () => {
    const tId = 'txn-123'

    describe('validateAddress', () => {
        test('should throw for empty tin', () => {
            const address = ''

            expect(() => validateAddress(address, tId, {})).toThrow()
        })
    })

    describe('validateTin', () => {
        test('should throw for empty tin', () => {
            const tin = ''

            expect(() => validateTin(tin, tId, {})).toThrow()
        })
    })

    describe('validateAccountNumber', () => {
        test('should throw for empty accountNumber', () => {
            const accountNumber = ''

            expect(() => validateAccountNumber(accountNumber, tId, {})).toThrow()
        })
    })

    describe('validatePaymentOrder', () => {
        test('should throw for empty paymentOrder', () => {
            const paymentOrder = ''

            expect(() => validatePaymentOrder(paymentOrder, tId, {})).toThrow()
        })
    })

    describe('validateBankAccount', () => {
        test.each([
            ['12345678901234567890', true],
            ['00000000000000000000', true],
            ['', false],
            [null, false],
            [undefined, false],
            ['1234567890123456789', false],
            ['123456789012345678901', false],
            ['1234567890123456789a', false],
            ['1234-5678901234567890', false],
            ['1234 567890123456789', false],
            ['abcdefghijklmnopqrst', false],
        ])('bankAccount: %p -> valid: %s', (bankAccount, isValid) => {
            const fn = () => validateBankAccount(bankAccount, tId, {})

            if (isValid) {
                expect(fn).not.toThrow()
            } else {
                expect(fn).toThrow()
            }
        })
    })

    describe('validateRoutingNumber', () => {
        test.each([
            ['123456789', true],
            ['000000000', true],
            ['', false],
            [null, false],
            [undefined, false],
            ['12345678', false],
            ['1234567890', false],
            ['12345678a', false],
            ['1234-6789', false],
            ['1234 6789', false],
            ['abcdefghi', false],
        ])('routingNumber: %p -> valid: %s', (routingNumber, isValid) => {
            const fn = () => validateRoutingNumber(routingNumber, tId, {})

            if (isValid) {
                expect(fn).not.toThrow()
            } else {
                expect(fn).toThrow()
            }
        })
    })

    describe('validateCurrencyCode', () => {
        test.each([
            ['RUB', true],
            ['USD', true],
            ['EUR', true],
            ['GBP', true],
            ...ISO_CODES.slice(0, 10).map(code => [code, true]),
            ['INVALID', false],
            ['RUBLES', false],
            ['RU', false],
            ['', false],
            [null, false],
            [undefined, false],
            [123, false],
        ])('currencyCode: %s -> valid: %s', (code, isValid) => {
            const fn = () => validateCurrencyCode(code, tId, {})
            if (isValid) {
                expect(fn).not.toThrow()
            } else {
                expect(fn).toThrow()
            }
        })
    })

    describe('validatePeriodFormat', () => {
        test.each([
            ['2024-01-01', true],
            ['2024-12-01', true],
            ['2020-02-01', true],
            ['-2020-02-01', false],
            ['2020-13-048', false],
            ['2024-13-01', false],
            ['2024-00-01', false],
            ['2024-01-00', false],
            ['2024-1-01', false],
            ['2024-01-1', false],
            ['2024-01-15', false],
            ['2024/01/01', false],
            ['01-01-2024', false],
            ['2024-01', false],
            ['invalid', false],
            ['', false],
            [null, false],
            [undefined, false],
        ])('period: %s -> valid: %s', (period, isValid) => {
            const fn = () => validatePeriodFormat(period, tId, {})
            if (isValid) {
                expect(fn).not.toThrow()
            } else {
                expect(fn).toThrow()
            }
        })
    })

    describe('validateDateFormat', () => {
        test.each([
            ['2024-01-01T00:00:00.000Z', true],
            ['2024-12-31T23:59:59.999Z', true],
            ['2024-12-32T23:59:59.999Z', false],
            ['2024-12-32T23:59:59Z', false],
            [new Date().toISOString(), true],
            ['2024-01-01', false],
            ['2024-01-01 12:00:00', false],
            ['invalid-date', false],
            ['2024-13-01', false],
            ['2024-02-30', false],
            ['', false],
        ])('date: %s -> valid: %s', (date, isValid) => {
            const fn = () => validateDateFormat(date, tId, {})
            if (isValid) {
                expect(fn).not.toThrow()
            } else {
                expect(fn).toThrow()
            }
        })
    })

    describe('validateNumericValues', () => {
        test.each([
            ['100.00', null, null, true],
            ['100.00', '10.00', '5.00', true],
            ['100', '10', '5', true],
            ['0.01', '0.01', '0.01', true],
            ['99999999999999999999999.99', null, null, true],
            ['-100.00', null, null, true],
            ['100.00', '-10.00', null, true],
            ['invalid', null, null, false],
            ['100.00', 'invalid', null, false],
            ['100.00', null, 'invalid', false],
            ['100.00', '', null, true],
            ['100.00', null, '', true],
            ['1e5', null, null, true],
            ['0.1e2', null, null, true],
            ['1.2.3', null, null, false],
        ])('amount: %s, explicitFee: %s, implicitFee: %s -> valid: %s',
            (amount, explicitFee, implicitFee, isValid) => {
                const fn = () => validateNumericValues(amount, explicitFee, implicitFee, tId, {})
                if (isValid) {
                    expect(fn).not.toThrow()
                } else {
                    expect(fn).toThrow()
                }
            })
    })

    describe('validatePositiveAmount', () => {
        test.each([
            ['100.00', true],
            ['0.01', true],
            ['1', true],
            ['999999.99', true],
            ['0.00', false],
            ['0', false],
            ['-0.01', false],
            ['-100.00', false],
        ])('amount: %s -> valid: %s', (amount, isValid) => {
            const fn = () => validatePositiveAmount(amount, tId, {})
            if (isValid) {
                expect(fn).not.toThrow()
            } else {
                expect(fn).toThrow()
            }
        })

        test('should throw for invalid numeric value', () => {
            expect(() => validatePositiveAmount('invalid', tId, {})).toThrow()
        })
    })

    describe('validateDuplicatedTransactionIds', () => {
        test('should pass for unique transaction IDs', () => {
            const payments = [
                { transactionId: '1' },
                { transactionId: '2' },
                { transactionId: '3' },
            ]
            expect(() => validateDuplicatedTransactionIds(payments, {})).not.toThrow()
        })

        test('should throw for duplicate transaction IDs', () => {
            const payments = [
                { transactionId: '1' },
                { transactionId: '2' },
                { transactionId: '1' },
            ]
            expect(() => validateDuplicatedTransactionIds(payments, {})).toThrow()
        })

        test('should throw for multiple duplicates', () => {
            const payments = [
                { transactionId: '1' },
                { transactionId: '2' },
                { transactionId: '1' },
                { transactionId: '3' },
                { transactionId: '2' },
            ]
            expect(() => validateDuplicatedTransactionIds(payments, {})).toThrow()
        })
    })

    describe('validatePaymentsNumberLimits', () => {
        test.each([
            [1, true],
            [PAYMENTS_LIMIT, true],
            [PAYMENTS_LIMIT - 1, true],
            [0, false],
            [PAYMENTS_LIMIT + 1, false],
            [PAYMENTS_LIMIT * 2, false],
        ])('payments count: %s -> valid: %s', (count, isValid) => {
            const payments = Array(count).fill({ transactionId: 'test' })
            const fn = () => validatePaymentsNumberLimits(payments, {})

            if (isValid) {
                expect(fn).not.toThrow()
            } else {
                expect(fn).toThrow()
            }
        })
    })

    describe('validateExistingMultiPayments', () => {
        test('should pass for empty existing payments', () => {
            expect(() => validateExistingMultiPayments([], {})).not.toThrow()
        })

        test('should throw for existing payments', () => {
            const existing = [
                { transactionId: 'txn-1' },
                { transactionId: 'txn-2' },
            ]
            expect(() => validateExistingMultiPayments(existing, {})).toThrow()
        })
    })

    describe('validatePayments (integration)', () => {
        const validPayment = {
            accountNumber: faker.finance.account(),
            transactionId: 'txn-123',
            amount: '100.00',
            period: '2024-01-01',
            transactionDate: new Date().toISOString(),
            currencyCode: 'RUB',
            tin: '1234567890',
            bankAccount: '40647859100000003330',
            routingNumber: '044525225',
            address: faker.address.streetAddress(true),
            paymentOrder: '1',
        }

        test('should validate all fields successfully', () => {
            const payments = [validPayment]
            expect(() => validatePayments(payments, {})).not.toThrow()
        })

        test('should validate multiple payments', () => {
            const payments = [
                validPayment,
                { ...validPayment, transactionId: 'txn-456' },
                { ...validPayment, transactionId: 'txn-789', currencyCode: 'USD' },
            ]
            expect(() => validatePayments(payments, {})).not.toThrow()
        })

        test('should fail on first invalid payment', () => {
            const payments = [
                { ...validPayment, transactionId: 'txn-1' },
                { ...validPayment, transactionId: 'txn-2', period: 'invalid' },
                { ...validPayment, transactionId: 'txn-3', currencyCode: 'INVALID' },
            ]
            expect(() => validatePayments(payments, {})).toThrow()
        })

        test('should handle edge cases with optional fields', () => {
            const paymentWithOptionals = {
                ...validPayment,
                depositedDate: new Date().toISOString(),
                explicitFee: '10.00',
                implicitFee: '5.00',
            }
            expect(() => validatePayments([paymentWithOptionals], {})).not.toThrow()
        })
    })
})