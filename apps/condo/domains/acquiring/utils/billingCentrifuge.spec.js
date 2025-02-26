const { Big } = require('big.js')

const { createTestRecipient } = require('@condo/domains/billing/utils/testSchema')

const {
    hasSingleVorItem,
    hasOverpaymentReceivers,
    split,
    createRecipientKey,
    areAllRecipientsUnique,
} = require('./billingCentrifuge')

describe('billingCentrifuge', () => {
    describe('helper functions', () => {
        test('recipient key created successfully', () => {
            const recipient = createTestRecipient()
            expect(createRecipientKey(recipient)).toBe(`${recipient.tin}_${recipient.bic}_${recipient.bankAccount}`)
        })
    })

    describe('errors throwing', () => {
        describe('Rounding', () => {
            test('must throw an error if there are no items with vor=true', () => {
                const paymentAmount = '1000'
                const distribution = [
                    { recipient: createTestRecipient(), amount: '800' },
                    { recipient: createTestRecipient(), amount: '200', overpaymentPart: 1 },
                ]

                expect(hasSingleVorItem(distribution)).toBe(false)
                expect(() => split(paymentAmount, distribution)).toThrow('Group 0 does not contains a SINGLE element with vor=true')
            })

            test('must throw an error if there are more than one items with vor=true', () => {
                const paymentAmount = '1000'
                const distribution = [
                    { recipient: createTestRecipient(), amount: '800', vor: true },
                    { recipient: createTestRecipient(), amount: '200', vor: true, overpaymentPart: 1 },
                ]

                expect(hasSingleVorItem(distribution)).toBe(false)
                expect(() => split(paymentAmount, distribution)).toThrow('Group 0 does not contains a SINGLE element with vor=true')
            })
        })

        test('must throw an error if there are no items containing overpaymentPart coefficient', () => {
            const paymentAmount = '1000'
            const distribution = [
                { recipient: createTestRecipient(), amount: '800' },
                { recipient: createTestRecipient(), amount: '200', vor: true },
            ]

            expect(hasOverpaymentReceivers(distribution)).toBe(false)
            expect(() => split(paymentAmount, distribution)).toThrow('Distribution does not have at least one item with overpaymentPart value')
        })

        test('must throw an error if there is a feeAmount and no fee payers', () => {
            const paymentAmount = '1000'
            const distribution = [
                { recipient: createTestRecipient(), amount: '800', order: 0, vor: true },
                { recipient: createTestRecipient(), amount: '200', order: 1, vor: true, overpaymentPart: 1 },
            ]

            expect(hasSingleVorItem(distribution)).toBe(false)
            expect(() => split(paymentAmount, distribution, { feeAmount: '100' })).toThrow('The distribution does not contains at least one fee payer (isFeePayer=true)')
        })

        test('must throw an error if fee payers has not enough amount to pay fees', () => {
            const amount = '1000'
            const feeAmount = '100'

            const recipient1 = createTestRecipient()
            const recipient2 = createTestRecipient()
            const distribution = [
                { recipient: recipient1, amount: '20', isFeePayer: true },
                { recipient: recipient2, amount: '30000', vor: true, overpaymentPart: 1 },
            ]

            expect(() => split(amount, distribution, { feeAmount })).toThrow(`Recipient ${JSON.stringify(recipient1)} has amount=0.67 and feeAmount=100`)
        })

        test('must throw an error if there are no unique recipients', () => {
            const paymentAmount = '1000'
            const recipient = createTestRecipient()
            const distribution = [
                { recipient, amount: '800' },
                { recipient, amount: '200', vor: true, overpaymentPart: 1 },
            ]

            expect(areAllRecipientsUnique(distribution)).toBe(false)
            expect(() => split(paymentAmount, distribution)).toThrow('Distribution contains not unique recipients')
        })
    })

    describe('when amount is enough (full payment)', () => {
        test('split correctly without fee', () => {
            const paymentAmount = '1000'
            const recipient1 = createTestRecipient()
            const recipient2 = createTestRecipient()

            const distribution = [
                { recipient: recipient1, amount: '800' },
                { recipient: recipient2, amount: '200', vor: true, overpaymentPart: 1 },
            ]
            const splits = split(paymentAmount, distribution)

            expect(splits).toEqual([
                { recipient: recipient1, amount: '800' },
                { recipient: recipient2, amount: '200' },
            ])

            const splitSum = splits.reduce((sum, split) => sum.plus(split.amount), Big(0))

            expect(Big(paymentAmount).eq(splitSum)).toBe(true)
        })

        test('split correctly with fee: 1 fee payer', () => {
            const paymentAmount = '1000'
            const feeAmount = '50'
            const recipient1 = createTestRecipient()
            const recipient2 = createTestRecipient()

            const distribution = [
                { recipient: recipient1, amount: '800' },
                { recipient: recipient2, amount: '200', vor: true, overpaymentPart: 1, isFeePayer: true },
            ]
            const splits = split(paymentAmount, distribution, { feeAmount })

            expect(splits).toEqual([
                { recipient: recipient1, amount: '800' },
                { recipient: recipient2, amount: '150', feeAmount: '50' },
            ])

            const splitSum = splits.reduce((sum, split) => sum.plus(split.amount), Big(0))
            const feeSum = splits.reduce((sum, split) => sum.plus(split.feeAmount || 0), Big(0))

            expect(Big(feeAmount).eq(feeSum)).toBe(true)
            expect(Big(paymentAmount).eq(splitSum.plus(feeSum))).toBe(true)
        })

        test('split correctly with fee: 2 fee payers', () => {
            const paymentAmount = '1000'
            const feeAmount = '50'
            const recipient1 = createTestRecipient()
            const recipient2 = createTestRecipient()

            const distribution = [
                { recipient: recipient1, amount: '800', isFeePayer: true },
                { recipient: recipient2, amount: '200', vor: true, overpaymentPart: 1, isFeePayer: true },
            ]
            const splits = split(paymentAmount, distribution, { feeAmount })

            expect(splits).toEqual([
                { recipient: recipient1, amount: '760', feeAmount: '40' },
                { recipient: recipient2, amount: '190', feeAmount: '10' },
            ])

            const splitSum = splits.reduce((sum, split) => sum.plus(split.amount), Big(0))
            const feeSum = splits.reduce((sum, split) => sum.plus(split.feeAmount || 0), Big(0))

            expect(Big(feeAmount).eq(feeSum)).toBe(true)
            expect(Big(paymentAmount).eq(splitSum.plus(feeSum))).toBe(true)
        })

        test('split correctly with fee: 100 between 3 fee payers', () => {
            const paymentAmount = '2000'
            const feeAmount = '100'
            const recipient1 = createTestRecipient()
            const recipient2 = createTestRecipient()
            const recipient3 = createTestRecipient()

            const distribution = [
                { recipient: recipient1, amount: '800', isFeePayer: true },
                { recipient: recipient2, amount: '200', vor: true, overpaymentPart: 1, isFeePayer: true },
                { recipient: recipient3, amount: '1000', isFeePayer: true },
            ]
            const splits = split(paymentAmount, distribution, { feeAmount })

            expect(splits).toHaveLength(3)
            expect(splits).toEqual(expect.arrayContaining([
                { recipient: recipient1, amount: '760', feeAmount: '40' },
                { recipient: recipient2, amount: '190', feeAmount: '10' },
                { recipient: recipient3, amount: '950', feeAmount: '50' },
            ]))

            const splitSum = splits.reduce((sum, split) => sum.plus(split.amount), Big(0))
            const feeSum = splits.reduce((sum, split) => sum.plus(split.feeAmount || 0), Big(0))

            expect(Big(feeAmount).eq(feeSum)).toBe(true)
            expect(Big(paymentAmount).eq(splitSum.plus(feeSum))).toBe(true)
        })

        test('split correctly with fee: 200 between 3 fee payers', () => {
            const paymentAmount = '2000'
            const feeAmount = '200'
            const recipient1 = createTestRecipient()
            const recipient2 = createTestRecipient()
            const recipient3 = createTestRecipient()

            const distribution = [
                { recipient: recipient1, amount: '800', isFeePayer: true },
                { recipient: recipient2, amount: '200', vor: true, overpaymentPart: 1, isFeePayer: true },
                { recipient: recipient3, amount: '1000', isFeePayer: true },
            ]
            const splits = split(paymentAmount, distribution, { feeAmount })

            expect(splits).toHaveLength(3)
            expect(splits).toEqual(expect.arrayContaining([
                { recipient: recipient1, amount: '720', feeAmount: '80' },
                { recipient: recipient2, amount: '180', feeAmount: '20' },
                { recipient: recipient3, amount: '900', feeAmount: '100' },
            ]))

            const splitSum = splits.reduce((sum, split) => sum.plus(split.amount), Big(0))
            const feeSum = splits.reduce((sum, split) => sum.plus(split.feeAmount || 0), Big(0))

            expect(Big(feeAmount).eq(feeSum)).toBe(true)
            expect(Big(paymentAmount).eq(splitSum.plus(feeSum))).toBe(true)
        })
    })

    describe('when not enough amount in payment (partial payment)', () => {
        test('split correctly without roundings', () => {
            const paymentAmount = '500'
            const recipient1 = createTestRecipient()
            const recipient2 = createTestRecipient()

            const distribution = [
                { recipient: recipient1, amount: '800' },
                { recipient: recipient2, amount: '200', vor: true, overpaymentPart: 1 },
            ]
            const splits = split(paymentAmount, distribution)

            expect(splits).toEqual([
                { recipient: recipient1, amount: '400' },
                { recipient: recipient2, amount: '100' },
            ])

            const splitSum = splits.reduce((sum, split) => sum.plus(split.amount), Big(0))

            expect(Big(paymentAmount).eq(splitSum)).toBe(true)
        })

        test('split 100 to 3 recipients correctly', () => {
            const paymentAmount = '100.00'
            const recipient1 = createTestRecipient()
            const recipient2 = createTestRecipient()
            const recipient3 = createTestRecipient()

            const distribution = [
                { recipient: recipient1, amount: '500' },
                { recipient: recipient2, amount: '500', vor: true },
                { recipient: recipient3, amount: '500', overpaymentPart: 1 },
            ]
            const splits = split(paymentAmount, distribution)

            expect(splits).toEqual(expect.arrayContaining([
                { recipient: recipient1, amount: '33.33' },
                { recipient: recipient2, amount: '33.34' },
                { recipient: recipient3, amount: '33.33' },
            ]))

            const splitSum = splits.reduce((sum, split) => sum.plus(split.amount), Big(0))

            expect(Big(paymentAmount).eq(splitSum)).toBe(true)
        })

        test('split 200 to 3 recipients correctly', () => {
            const paymentAmount = '200.00'
            const recipient1 = createTestRecipient()
            const recipient2 = createTestRecipient()
            const recipient3 = createTestRecipient()

            const distribution = [
                { recipient: recipient1, amount: '500' },
                { recipient: recipient2, amount: '500', vor: true },
                { recipient: recipient3, amount: '500', overpaymentPart: 1 },
            ]
            const splits = split(paymentAmount, distribution)

            expect(splits).toEqual(expect.arrayContaining([
                { recipient: recipient1, amount: '66.67' },
                { recipient: recipient2, amount: '66.66' }, // The victim of rounding
                { recipient: recipient3, amount: '66.67' },
            ]))

            const splitSum = splits.reduce((sum, split) => sum.plus(split.amount), Big(0))

            expect(Big(paymentAmount).eq(splitSum)).toBe(true)
        })

        test('split 2 payments for same distribution', () => {
            const recipient1 = createTestRecipient()
            const recipient2 = createTestRecipient()
            const recipient3 = createTestRecipient()

            const distribution = [
                { recipient: recipient1, amount: '100' },
                { recipient: recipient2, amount: '100', vor: true },
                { recipient: recipient3, amount: '100', overpaymentPart: 1 },
            ]

            const paymentAmount1 = '100.00'
            const splits1 = split(paymentAmount1, distribution)

            expect(splits1).toEqual(expect.arrayContaining([
                { recipient: recipient1, amount: '33.33' },
                { recipient: recipient2, amount: '33.34' },
                { recipient: recipient3, amount: '33.33' },
            ]))

            const paymentAmount2 = '200.00'
            const splits2 = split(paymentAmount2, distribution, { appliedSplits: splits1 })

            expect(splits2).toEqual(expect.arrayContaining([
                { recipient: recipient1, amount: '66.67' },
                { recipient: recipient2, amount: '66.66' },
                { recipient: recipient3, amount: '66.67' },
            ]))

            const splitSum1 = splits1.reduce((sum, split) => sum.plus(split.amount), Big(0))
            const splitSum2 = splits2.reduce((sum, split) => sum.plus(split.amount), Big(0))
            const splitSum = [...splits1, ...splits2].reduce((sum, split) => sum.plus(split.amount), Big(0))

            expect(Big(paymentAmount1).eq(splitSum1)).toBe(true)
            expect(Big(paymentAmount2).eq(splitSum2)).toBe(true)
            expect(Big(paymentAmount1).plus(paymentAmount2).eq(splitSum)).toBe(true)
        })

        test('split 2 payments for same distribution with two groups', () => {
            const recipient1 = createTestRecipient()
            const recipient2 = createTestRecipient()
            const recipient3 = createTestRecipient()

            const distribution = [
                { recipient: recipient1, amount: '100', order: 0, vor: true },
                { recipient: recipient2, amount: '100', order: 1, vor: true },
                { recipient: recipient3, amount: '100', order: 1, overpaymentPart: 1 },
            ]

            const paymentAmount1 = '120.00'
            const splits1 = split(paymentAmount1, distribution)

            expect(splits1).toEqual(expect.arrayContaining([
                { recipient: recipient1, amount: '100' },
                { recipient: recipient2, amount: '10' },
                { recipient: recipient3, amount: '10' },
            ]))

            const paymentAmount2 = '180.00'
            const splits2 = split(paymentAmount2, distribution, { appliedSplits: splits1 })

            expect(splits2).toEqual(expect.arrayContaining([
                { recipient: recipient2, amount: '90' },
                { recipient: recipient3, amount: '90' },
            ]))

            const splitSum1 = splits1.reduce((sum, split) => sum.plus(split.amount), Big(0))
            const splitSum2 = splits2.reduce((sum, split) => sum.plus(split.amount), Big(0))
            const splitSum = [...splits1, ...splits2].reduce((sum, split) => sum.plus(split.amount), Big(0))

            expect(Big(paymentAmount1).eq(splitSum1)).toBe(true)
            expect(Big(paymentAmount2).eq(splitSum2)).toBe(true)
            expect(Big(paymentAmount1).plus(paymentAmount2).eq(splitSum)).toBe(true)
        })

        test('split 2 payments for same distribution with two groups and fee payer in 2nd group', () => {
            const recipient1 = createTestRecipient()
            const recipient2 = createTestRecipient()

            const distribution = [
                { recipient: recipient1, amount: '800', order: 0, vor: true },
                { recipient: recipient2, amount: '200', order: 1, vor: true, overpaymentPart: 1, isFeePayer: true },
            ]

            const feeAmount = '50'

            const paymentAmount1 = '500'
            const splits1 = split(paymentAmount1, distribution, { feeAmount })

            expect(splits1).toEqual(expect.arrayContaining([
                { recipient: recipient1, amount: '450' },
                { recipient: null, feeAmount: '50' },
            ]))

            const paymentAmount2 = '500'
            const splits2 = split(paymentAmount2, distribution, { appliedSplits: splits1, feeAmount })

            expect(splits2).toEqual(expect.arrayContaining([
                { recipient: recipient1, amount: '350' },
                { recipient: recipient2, amount: '100', feeAmount: '50' },
            ]))

            const splitSum1 = splits1.reduce((sum, split) => sum.plus(split.amount || 0), Big(0))
            const feeSum1 = splits1.reduce((sum, split) => sum.plus(split.feeAmount || 0), Big(0))

            const splitSum2 = splits2.reduce((sum, split) => sum.plus(split.amount || 0), Big(0))
            const feeSum2 = splits2.reduce((sum, split) => sum.plus(split.feeAmount || 0), Big(0))

            const splitSum = [...splits1, ...splits2].reduce((sum, split) => sum.plus(split.amount || 0), Big(0))
            const feeSum = [...splits1, ...splits2].reduce((sum, split) => sum.plus(split.feeAmount || 0), Big(0))

            expect(Big(paymentAmount1).eq(splitSum1.plus(feeSum1))).toBe(true)
            expect(Big(paymentAmount2).eq(splitSum2.plus(feeSum2))).toBe(true)
            expect(Big(paymentAmount1).plus(paymentAmount2).eq(splitSum.plus(feeSum))).toBe(true)
        })

        test('split 2 payments with changed distribution', () => {
            const recipient1 = createTestRecipient()
            const recipient2 = createTestRecipient()
            const recipient3 = createTestRecipient()

            const distribution1 = [
                { recipient: recipient1, amount: '100' },
                { recipient: recipient2, amount: '100', vor: true },
                { recipient: recipient3, amount: '100', overpaymentPart: 1 },
            ]

            const paymentAmount1 = '120.00'
            const splits1 = split(paymentAmount1, distribution1)

            expect(splits1).toEqual(expect.arrayContaining([
                { recipient: recipient1, amount: '40' },
                { recipient: recipient2, amount: '40' },
                { recipient: recipient3, amount: '40' },
            ]))

            const distribution2 = [
                { recipient: recipient1, amount: '100' },
                { recipient: recipient2, amount: '50', vor: true },
                { recipient: recipient3, amount: '150', overpaymentPart: 1 },
            ]

            const paymentAmount2 = '180.00'
            const splits2 = split(paymentAmount2, distribution2, { appliedSplits: splits1 })

            expect(splits2).toEqual(expect.arrayContaining([
                { recipient: recipient1, amount: '60' },
                { recipient: recipient2, amount: '10' },
                { recipient: recipient3, amount: '110' },
            ]))

            const splitSum1 = splits1.reduce((sum, split) => sum.plus(split.amount), Big(0))
            const splitSum2 = splits2.reduce((sum, split) => sum.plus(split.amount), Big(0))
            const splitSum = [...splits1, ...splits2].reduce((sum, split) => sum.plus(split.amount), Big(0))

            expect(Big(paymentAmount1).eq(splitSum1)).toBe(true)
            expect(Big(paymentAmount2).eq(splitSum2)).toBe(true)
            expect(Big(paymentAmount1).plus(paymentAmount2).eq(splitSum)).toBe(true)
        })

        test('split 2 payments with changed distribution with two groups', () => {
            const recipient1 = createTestRecipient()
            const recipient2 = createTestRecipient()
            const recipient3 = createTestRecipient()

            const distribution1 = [
                { recipient: recipient1, amount: '100', order: 0, vor: true },
                { recipient: recipient2, amount: '100', order: 1, vor: true },
                { recipient: recipient3, amount: '100', order: 1, overpaymentPart: 1 },
            ]

            const paymentAmount1 = '120.00'
            const splits1 = split(paymentAmount1, distribution1)

            expect(splits1).toEqual(expect.arrayContaining([
                { recipient: recipient1, amount: '100' },
                { recipient: recipient2, amount: '10' },
                { recipient: recipient3, amount: '10' },
            ]))

            const distribution2 = [
                { recipient: recipient1, amount: '120', order: 0, vor: true },
                { recipient: recipient2, amount: '50', order: 1, vor: true },
                { recipient: recipient3, amount: '130', order: 1, overpaymentPart: 1 },
            ]

            const paymentAmount2 = '180.00'
            const splits2 = split(paymentAmount2, distribution2, { appliedSplits: splits1 })

            expect(splits2).toEqual(expect.arrayContaining([
                { recipient: recipient1, amount: '20' },
                { recipient: recipient2, amount: '40' },
                { recipient: recipient3, amount: '120' },
            ]))

            const splitSum1 = splits1.reduce((sum, split) => sum.plus(split.amount), Big(0))
            const splitSum2 = splits2.reduce((sum, split) => sum.plus(split.amount), Big(0))
            const splitSum = [...splits1, ...splits2].reduce((sum, split) => sum.plus(split.amount), Big(0))

            expect(Big(paymentAmount1).eq(splitSum1)).toBe(true)
            expect(Big(paymentAmount2).eq(splitSum2)).toBe(true)
            expect(Big(paymentAmount1).plus(paymentAmount2).eq(splitSum)).toBe(true)
        })

        test('split 2 payments with changed distribution to less amount with two groups', () => {
            const recipient1 = createTestRecipient()
            const recipient2 = createTestRecipient()
            const recipient3 = createTestRecipient()

            const distribution1 = [
                { recipient: recipient1, amount: '100', order: 0, vor: true },
                { recipient: recipient2, amount: '100', order: 1, vor: true },
                { recipient: recipient3, amount: '100', order: 1, overpaymentPart: 1 },
            ]

            const paymentAmount1 = '120.00'
            const splits1 = split(paymentAmount1, distribution1)

            expect(splits1).toEqual(expect.arrayContaining([
                { recipient: recipient1, amount: '100' },
                { recipient: recipient2, amount: '10' },
                { recipient: recipient3, amount: '10' },
            ]))

            const distribution2 = [
                { recipient: recipient1, amount: '80', order: 0, vor: true },
                { recipient: recipient2, amount: '90', order: 1, vor: true },
                { recipient: recipient3, amount: '130', order: 1, overpaymentPart: 1 },
            ]

            const paymentAmount2 = '180.00'
            const splits2 = split(paymentAmount2, distribution2, { appliedSplits: splits1 })

            expect(splits2).toEqual(expect.arrayContaining([
                { recipient: recipient2, amount: '72' },
                { recipient: recipient3, amount: '108' },
            ]))

            const splitSum1 = splits1.reduce((sum, split) => sum.plus(split.amount), Big(0))
            const splitSum2 = splits2.reduce((sum, split) => sum.plus(split.amount), Big(0))
            const splitSum = [...splits1, ...splits2].reduce((sum, split) => sum.plus(split.amount), Big(0))

            expect(Big(paymentAmount1).eq(splitSum1)).toBe(true)
            expect(Big(paymentAmount2).eq(splitSum2)).toBe(true)
            expect(Big(paymentAmount1).plus(paymentAmount2).eq(splitSum)).toBe(true)
        })

        test('split 3 payments with changed distribution with two groups and groups were changed', () => {
            const recipient1 = createTestRecipient()
            const recipient2 = createTestRecipient()
            const recipient3 = createTestRecipient()

            const distribution1 = [
                { recipient: recipient1, amount: '100', order: 0, vor: true },
                { recipient: recipient2, amount: '100', order: 1, vor: true },
                { recipient: recipient3, amount: '100', order: 1, overpaymentPart: 1 },
            ]

            const paymentAmount1 = '120.00'
            const splits1 = split(paymentAmount1, distribution1)
            const splitSum1 = splits1.reduce((sum, split) => sum.plus(split.amount), Big(0))

            expect(Big(paymentAmount1).eq(splitSum1)).toBe(true)
            expect(splits1).toEqual(expect.arrayContaining([
                { recipient: recipient1, amount: '100' },
                { recipient: recipient2, amount: '10' },
                { recipient: recipient3, amount: '10' },
            ]))

            const distribution2 = [
                { recipient: recipient1, amount: '100', order: 0, vor: true },
                { recipient: recipient2, amount: '100', order: 0 },
                { recipient: recipient3, amount: '100', order: 1, vor: true, overpaymentPart: 1 },
            ]

            const paymentAmount2 = '50.00'
            const splits2 = split(paymentAmount2, distribution2, { appliedSplits: splits1 })
            const splitSum2 = splits2.reduce((sum, split) => sum.plus(split.amount), Big(0))

            expect(Big(paymentAmount2).eq(splitSum2)).toBe(true)
            expect(splits2).toEqual(expect.arrayContaining([
                { recipient: recipient2, amount: '50' },
            ]))

            const paymentAmount3 = '130.00'
            const splits3 = split(paymentAmount3, distribution2, { appliedSplits: [...splits1, ...splits2] })
            const splitSum3 = splits3.reduce((sum, split) => sum.plus(split.amount), Big(0))

            expect(Big(paymentAmount3).eq(splitSum3)).toBe(true)
            expect(splits3).toEqual(expect.arrayContaining([
                { recipient: recipient2, amount: '40' },
                { recipient: recipient3, amount: '90' },
            ]))

            const splitSum = [...splits1, ...splits2, ...splits3].reduce((sum, split) => sum.plus(split.amount), Big(0))

            expect(Big(paymentAmount1).plus(paymentAmount2).plus(paymentAmount3).eq(splitSum)).toBe(true)
        })
    })

    describe('when there is an overpayment', () => {
        test('split correctly for single overpayment recipient', () => {
            const paymentAmount = '1300'
            const recipient1 = createTestRecipient()
            const recipient2 = createTestRecipient()

            const distribution = [
                { recipient: recipient1, amount: '800' },
                { recipient: recipient2, amount: '200', vor: true, overpaymentPart: 1 },
            ]
            const splits = split(paymentAmount, distribution)

            expect(splits).toEqual([
                { recipient: recipient1, amount: '800' },
                { recipient: recipient2, amount: '500' },
            ])

            const splitSum = splits.reduce((sum, split) => sum.plus(split.amount), Big(0))

            expect(Big(paymentAmount).eq(splitSum)).toBe(true)
        })

        test('split overpayment 100 for 3 overpayment recipients correctly', () => {
            const paymentAmount = '400'
            const recipient1 = createTestRecipient()
            const recipient2 = createTestRecipient()
            const recipient3 = createTestRecipient()

            const distribution = [
                { recipient: recipient1, amount: '100', overpaymentPart: 1 },
                { recipient: recipient2, amount: '100', overpaymentPart: 1 },
                { recipient: recipient3, amount: '100', vor: true, overpaymentPart: 1 },
            ]
            const splits = split(paymentAmount, distribution)

            expect(splits).toEqual(expect.arrayContaining([
                { recipient: recipient1, amount: '133.33' },
                { recipient: recipient2, amount: '133.33' },
                { recipient: recipient3, amount: '133.34' },
            ]))

            const splitSum = splits.reduce((sum, split) => sum.plus(split.amount), Big(0))

            expect(Big(paymentAmount).eq(splitSum)).toBe(true)
        })

        test('split overpayment 200 for 3 overpayment recipients correctly', () => {
            const paymentAmount = '500'
            const recipient1 = createTestRecipient()
            const recipient2 = createTestRecipient()
            const recipient3 = createTestRecipient()

            const distribution = [
                { recipient: recipient1, amount: '100', overpaymentPart: 1 },
                { recipient: recipient2, amount: '100', overpaymentPart: 1 },
                { recipient: recipient3, amount: '100', vor: true, overpaymentPart: 1 },

            ]
            const splits = split(paymentAmount, distribution)

            expect(splits).toEqual(expect.arrayContaining([
                { recipient: recipient1, amount: '166.67' },
                { recipient: recipient2, amount: '166.67' },
                { recipient: recipient3, amount: '166.66' },
            ]))

            const splitSum = splits.reduce((sum, split) => sum.plus(split.amount), Big(0))

            expect(Big(paymentAmount).eq(splitSum)).toBe(true)
        })

        test('split 2 payments with overpayment for same distribution with two groups', () => {
            const recipient1 = createTestRecipient()
            const recipient2 = createTestRecipient()
            const recipient3 = createTestRecipient()

            const distribution = [
                { recipient: recipient1, amount: '100', order: 0, vor: true, overpaymentPart: 1 },
                { recipient: recipient2, amount: '100', order: 1, vor: true },
                { recipient: recipient3, amount: '100', order: 1, overpaymentPart: 1 },
            ]

            const paymentAmount1 = '120.00'
            const splits1 = split(paymentAmount1, distribution)

            expect(splits1).toEqual(expect.arrayContaining([
                { recipient: recipient1, amount: '100' },
                { recipient: recipient2, amount: '10' },
                { recipient: recipient3, amount: '10' },
            ]))

            const paymentAmount2 = '280.00'
            const splits2 = split(paymentAmount2, distribution, { appliedSplits: splits1 })

            expect(splits2).toEqual(expect.arrayContaining([
                { recipient: recipient1, amount: '50' },
                { recipient: recipient2, amount: '90' },
                { recipient: recipient3, amount: '140' },
            ]))

            const splitSum1 = splits1.reduce((sum, split) => sum.plus(split.amount), Big(0))
            const splitSum2 = splits2.reduce((sum, split) => sum.plus(split.amount), Big(0))
            const splitSum = [...splits1, ...splits2].reduce((sum, split) => sum.plus(split.amount), Big(0))

            expect(Big(paymentAmount1).eq(splitSum1)).toBe(true)
            expect(Big(paymentAmount2).eq(splitSum2)).toBe(true)
            expect(Big(paymentAmount1).plus(paymentAmount2).eq(splitSum)).toBe(true)
        })

        test('split 2 payments with overpayment and changed distribution with two groups', () => {
            const recipient1 = createTestRecipient()
            const recipient2 = createTestRecipient()
            const recipient3 = createTestRecipient()

            const distribution1 = [
                { recipient: recipient1, amount: '100', order: 0, vor: true, overpaymentPart: 1 },
                { recipient: recipient2, amount: '100', order: 1, vor: true },
                { recipient: recipient3, amount: '100', order: 1, overpaymentPart: 1 },
            ]

            const paymentAmount1 = '120.00'
            const splits1 = split(paymentAmount1, distribution1)

            expect(splits1).toEqual(expect.arrayContaining([
                { recipient: recipient1, amount: '100' },
                { recipient: recipient2, amount: '10' },
                { recipient: recipient3, amount: '10' },
            ]))

            const distribution2 = [
                { recipient: recipient1, amount: '120', order: 0, vor: true },
                { recipient: recipient2, amount: '50', order: 1 },
                { recipient: recipient3, amount: '130', order: 1, vor: true, overpaymentPart: 1 },
            ]

            const paymentAmount2 = '280.00'
            const splits2 = split(paymentAmount2, distribution2, { appliedSplits: splits1 })

            expect(splits2).toEqual(expect.arrayContaining([
                { recipient: recipient1, amount: '20' },
                { recipient: recipient2, amount: '40' },
                { recipient: recipient3, amount: '220' },
            ]))

            const splitSum1 = splits1.reduce((sum, split) => sum.plus(split.amount), Big(0))
            const splitSum2 = splits2.reduce((sum, split) => sum.plus(split.amount), Big(0))
            const splitSum = [...splits1, ...splits2].reduce((sum, split) => sum.plus(split.amount), Big(0))

            expect(Big(paymentAmount1).eq(splitSum1)).toBe(true)
            expect(Big(paymentAmount2).eq(splitSum2)).toBe(true)
            expect(Big(paymentAmount1).plus(paymentAmount2).eq(splitSum)).toBe(true)
        })
    })

    test('split payments with complex changes of distribution', () => {
        const recipient1 = createTestRecipient()
        const recipient2 = createTestRecipient()
        const recipient3 = createTestRecipient()

        const distribution1 = [
            { recipient: recipient1, amount: '100', order: 0, vor: true, isFeePayer: true },
            { recipient: recipient2, amount: '100', order: 1, vor: true, isFeePayer: true },
            { recipient: recipient3, amount: '100', order: 1, overpaymentPart: 1, isFeePayer: true },
        ]

        const paymentAmount1 = '120'
        const feeAmount1 = '12'
        const splits1 = split(paymentAmount1, distribution1, { feeAmount: feeAmount1 })
        const splitSum1 = splits1.reduce((sum, split) => sum.plus(split.amount), Big(0))
        const feeSum1 = splits1.reduce((sum, split) => sum.plus(split.feeAmount || 0), Big(0))

        expect(Big(paymentAmount1).eq(splitSum1.plus(feeSum1))).toBe(true)
        expect(splits1).toEqual(expect.arrayContaining([
            { recipient: recipient1, amount: '90', feeAmount: '10' },
            { recipient: recipient2, amount: '9', feeAmount: '1' },
            { recipient: recipient3, amount: '9', feeAmount: '1' },
        ]))

        const distribution2 = [
            { recipient: recipient1, amount: '100', order: 0, vor: true, isFeePayer: true },
            { recipient: recipient2, amount: '100', order: 0 },
            { recipient: recipient3, amount: '100', order: 1, vor: true, overpaymentPart: 1, isFeePayer: true },
        ]

        const paymentAmount2 = '50'
        const feeAmount2 = '5'
        const splits2 = split(paymentAmount2, distribution2, { appliedSplits: splits1, feeAmount: feeAmount2 })
        const splitSum2 = splits2.reduce((sum, split) => sum.plus(split.amount || 0), Big(0))
        const feeSum2 = splits2.reduce((sum, split) => sum.plus(split.feeAmount || 0), Big(0))

        expect(Big(paymentAmount2).eq(splitSum2.plus(feeSum2))).toBe(true)
        expect(Big(feeAmount2).eq(feeSum2)).toBe(true)
        expect(splits2).toHaveLength(2)
        expect(splits2).toEqual(expect.arrayContaining([
            { recipient: recipient2, amount: '45' },
            { recipient: null, feeAmount: feeAmount2 }, // means that according to distribution, there are no receivers who must pay fee
        ]))

        const distribution3 = [
            { recipient: recipient1, amount: '120', order: 0, vor: true, overpaymentPart: 1, isFeePayer: true },
            { recipient: recipient2, amount: '100', order: 0 },
            { recipient: recipient3, amount: '100', order: 1, overpaymentPart: 1, isFeePayer: true, vor: true },
        ]

        const paymentAmount3 = '130.00'
        const feeAmount3 = '13'
        const splits3 = split(paymentAmount3, distribution3, {
            appliedSplits: [...splits1, ...splits2],
            feeAmount: feeAmount3,
        })
        const splitSum3 = splits3.reduce((sum, split) => sum.plus(split.amount), Big(0))
        const feeSum3 = splits3.reduce((sum, split) => sum.plus(split.feeAmount || 0), Big(0))

        expect(Big(paymentAmount3).eq(splitSum3.plus(feeSum3))).toBe(true)
        expect(splits3).toHaveLength(3)
        expect(splits3).toEqual(expect.arrayContaining([
            { recipient: recipient1, amount: '16.94', feeAmount: '3.06' },
            { recipient: recipient2, amount: '45' },
            { recipient: recipient3, amount: '55.06', feeAmount: '9.94' },
        ]))

        const splitSum = [...splits1, ...splits2, ...splits3].reduce((sum, split) => sum.plus(split.amount || 0), Big(0))
        const feeSum = [...splits1, ...splits2, ...splits3].reduce((sum, split) => sum.plus(split.feeAmount || 0), Big(0))

        expect(Big(paymentAmount1).plus(paymentAmount2).plus(paymentAmount3).eq(splitSum.plus(feeSum))).toBe(true)
    })
})
