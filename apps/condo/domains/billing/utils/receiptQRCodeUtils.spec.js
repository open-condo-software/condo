const { catchErrorFrom } = require('@open-condo/keystone/test.utils')

const { getQRCodeMissedFields, parseReceiptQRCode, formatPeriodFromQRCode } = require('./receiptQRCodeUtils')

describe('receiptQRCodeUtils', () => {
    test('QR-code fields parsed correctly', () => {
        const parsed = parseReceiptQRCode('ST00012|field1=Hello|Field2=world|foo=bar baz')
        expect(parsed).toEqual({
            field1: 'Hello',
            Field2: 'world',
            foo: 'bar baz',
        })
    })

    test('must throw an error on invalid QR-code', async () => {
        await catchErrorFrom(
            async () => {
                parseReceiptQRCode('ST0012|field1=Hello|Field2=world')
            },
            (err) => {
                expect(err).toEqual(expect.objectContaining({ message: 'Invalid QR code' }))
            },
        )
    })

    test('check for required fields', () => {
        const parsed = parseReceiptQRCode('ST00012|field1=Hello|Field2=world|foo=bar baz')
        const missedFields = getQRCodeMissedFields(parsed)

        expect(missedFields).toEqual(['BIC', 'PayerAddress', 'PaymPeriod', 'Sum', 'PersAcc', 'PayeeINN', 'PersonalAcc'])
    })

    test('format period from QR-code', () => {
        expect(formatPeriodFromQRCode('05.2024')).toBe('2024-05-01')
    })
})
