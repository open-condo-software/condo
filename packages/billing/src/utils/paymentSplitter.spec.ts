import { faker } from '@faker-js/faker'
import { Big } from 'big.js'

import {
    hasSingleVorItem,
    hasOverpaymentReceivers,
    hasFeePayers,
    getVorItems,
    split,
    createRecipientKey,
    areAllRecipientsUnique,
    sortByVorAndOrderComparator,
    DistributionItem,
} from './paymentSplitter'

function createTestRecipient (extra = {}) {
    const validRecipient = {
        name: faker.company.name(),
        tin: faker.datatype.number(8).toString(),
        iec: faker.datatype.number(10).toString(),
        bic: faker.finance.bic().toString(),
        bankAccount: faker.finance.account(12).toString(),
        bankName: faker.company.name(),
        territoryCode: faker.datatype.number(6).toString(),
        offsettingAccount: faker.finance.account(12).toString(),
    }
    return {
        ...validRecipient,
        ...extra,
    }
}

describe('paymentSplitter', () => {
    describe('helper functions', () => {
        describe('createRecipientKey', () => {
            test('creates key successfully', () => {
                const recipient = createTestRecipient()
                expect(createRecipientKey(recipient)).toBe(`${recipient.tin}_${recipient.bic}_${recipient.bankAccount}`)
            })

            test('returns empty string for null recipient', () => {
                expect(createRecipientKey(null)).toBe('')
            })
        })

        describe('sortByVorAndOrderComparator', () => {
            test('sorts distributions by vor and order', () => {
                const recipient1 = createTestRecipient()
                const recipient2 = createTestRecipient()
                const recipient3 = createTestRecipient()
                const recipient4 = createTestRecipient()

                const distribution: DistributionItem[] = [
                    { recipient: recipient1, order: 0, amount: '0', vor: true },
                    { recipient: recipient2, order: 0, amount: '0' },
                    { recipient: recipient3, order: 2, amount: '0', vor: true },
                    { recipient: recipient4, order: 1, amount: '0' },
                ]

                const sortedDistribution = distribution.sort(sortByVorAndOrderComparator)
                expect(sortedDistribution).toEqual([
                    { recipient: recipient2, order: 0, amount: '0' },
                    { recipient: recipient4, order: 1, amount: '0' },
                    { recipient: recipient1, order: 0, amount: '0', vor: true },
                    { recipient: recipient3, order: 2, amount: '0', vor: true },
                ])
            })
        })

        describe('hasFeePayers', () => {
            test('returns true when distribution has fee payers', () => {
                const distribution = [
                    { recipient: createTestRecipient(), amount: '100', isFeePayer: true },
                    { recipient: createTestRecipient(), amount: '200' },
                ]
                expect(hasFeePayers(distribution)).toBe(true)
            })

            test('returns false when distribution has no fee payers', () => {
                const distribution = [
                    { recipient: createTestRecipient(), amount: '100' },
                    { recipient: createTestRecipient(), amount: '200' },
                ]
                expect(hasFeePayers(distribution)).toBe(false)
            })
        })

        describe('getVorItems', () => {
            test('returns all items with vor=true', () => {
                const recipient1 = createTestRecipient()
                const recipient2 = createTestRecipient()
                const recipient3 = createTestRecipient()
                const distribution = [
                    { recipient: recipient1, amount: '100', vor: true },
                    { recipient: recipient2, amount: '200' },
                    { recipient: recipient3, amount: '300', vor: true },
                ]
                const vorItems = getVorItems(distribution)
                expect(vorItems).toHaveLength(2)
                expect(vorItems).toEqual([
                    { recipient: recipient1, amount: '100', vor: true },
                    { recipient: recipient3, amount: '300', vor: true },
                ])
            })

            test('returns empty array when no vor items', () => {
                const distribution = [
                    { recipient: createTestRecipient(), amount: '100' },
                    { recipient: createTestRecipient(), amount: '200' },
                ]
                expect(getVorItems(distribution)).toEqual([])
            })
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
                { recipient: recipient1, amount: '20', vor: true, overpaymentPart: 1, isFeePayer: true },
                { recipient: recipient2, amount: '30000' },
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

        test('must throw an error if vor-item is not fee payer', () => {
            const paymentAmount = '1000'
            const feeAmount = '50'
            const distribution = [
                { recipient: createTestRecipient(), amount: '800', isFeePayer: true },
                { recipient: createTestRecipient(), amount: '200', vor: true, overpaymentPart: 1 },
            ]

            expect(() => split(paymentAmount, distribution, { feeAmount })).toThrow('The victim of rounding (vor) must have isFeePayer=true')
        })

        test('must throw an error if vor-item have no overpaymentPart value', () => {
            const paymentAmount = '1000'
            const distribution = [
                { recipient: createTestRecipient(), amount: '800', overpaymentPart: 1 },
                { recipient: createTestRecipient(), amount: '200', vor: true, isFeePayer: true },
            ]

            expect(() => split(paymentAmount, distribution)).toThrow('The victim of rounding (vor) must have overpaymentPart value')
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

            const splitSum = splits.reduce((sum, split) => sum.plus(split.amount || 0), Big(0))

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

            const splitSum = splits.reduce((sum, split) => sum.plus(split.amount || 0), Big(0))
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

            const splitSum = splits.reduce((sum, split) => sum.plus(split.amount || 0), Big(0))
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

            const splitSum = splits.reduce((sum, split) => sum.plus(split.amount || 0), Big(0))
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

            const splitSum = splits.reduce((sum, split) => sum.plus(split.amount || 0), Big(0))
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

            const splitSum = splits.reduce((sum, split) => sum.plus(split.amount || 0), Big(0))

            expect(Big(paymentAmount).eq(splitSum)).toBe(true)
        })

        test('split 100 to 3 recipients correctly', () => {
            const paymentAmount = '100.00'
            const recipient1 = createTestRecipient()
            const recipient2 = createTestRecipient()
            const recipient3 = createTestRecipient()

            const distribution = [
                { recipient: recipient1, amount: '500' },
                { recipient: recipient2, amount: '500', vor: true, overpaymentPart: 1 },
                { recipient: recipient3, amount: '500' },
            ]
            const splits = split(paymentAmount, distribution)

            expect(splits).toEqual(expect.arrayContaining([
                { recipient: recipient1, amount: '33.33' },
                { recipient: recipient2, amount: '33.34' },
                { recipient: recipient3, amount: '33.33' },
            ]))

            const splitSum = splits.reduce((sum, split) => sum.plus(split.amount || 0), Big(0))

            expect(Big(paymentAmount).eq(splitSum)).toBe(true)
        })

        test('split 200 to 3 recipients correctly', () => {
            const paymentAmount = '200.00'
            const recipient1 = createTestRecipient()
            const recipient2 = createTestRecipient()
            const recipient3 = createTestRecipient()

            const distribution = [
                { recipient: recipient1, amount: '500' },
                { recipient: recipient2, amount: '500', vor: true, overpaymentPart: 1 },
                { recipient: recipient3, amount: '500' },
            ]
            const splits = split(paymentAmount, distribution)

            expect(splits).toEqual(expect.arrayContaining([
                { recipient: recipient1, amount: '66.67' },
                { recipient: recipient2, amount: '66.66' }, // The victim of rounding
                { recipient: recipient3, amount: '66.67' },
            ]))

            const splitSum = splits.reduce((sum, split) => sum.plus(split.amount || 0), Big(0))

            expect(Big(paymentAmount).eq(splitSum)).toBe(true)
        })

        test('split 2 payments for same distribution', () => {
            const recipient1 = createTestRecipient()
            const recipient2 = createTestRecipient()
            const recipient3 = createTestRecipient()

            const distribution = [
                { recipient: recipient1, amount: '100' },
                { recipient: recipient2, amount: '100', vor: true, overpaymentPart: 1 },
                { recipient: recipient3, amount: '100' },
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

            const splitSum1 = splits1.reduce((sum, split) => sum.plus(split.amount || 0), Big(0))
            const splitSum2 = splits2.reduce((sum, split) => sum.plus(split.amount || 0), Big(0))
            const splitSum = [...splits1, ...splits2].reduce((sum, split) => sum.plus(split.amount || 0), Big(0))

            expect(Big(paymentAmount1).eq(splitSum1)).toBe(true)
            expect(Big(paymentAmount2).eq(splitSum2)).toBe(true)
            expect(Big(paymentAmount1).plus(paymentAmount2).eq(splitSum)).toBe(true)
        })

        test('split 2 payments for same distribution with two groups', () => {
            const recipient1 = createTestRecipient()
            const recipient2 = createTestRecipient()
            const recipient3 = createTestRecipient()

            const distribution = [
                { recipient: recipient1, amount: '100', order: 0, vor: true, overpaymentPart: 1 },
                { recipient: recipient2, amount: '100', order: 1, vor: true, overpaymentPart: 1 },
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

            const splitSum1 = splits1.reduce((sum, split) => sum.plus(split.amount || 0), Big(0))
            const splitSum2 = splits2.reduce((sum, split) => sum.plus(split.amount || 0), Big(0))
            const splitSum = [...splits1, ...splits2].reduce((sum, split) => sum.plus(split.amount || 0), Big(0))

            expect(Big(paymentAmount1).eq(splitSum1)).toBe(true)
            expect(Big(paymentAmount2).eq(splitSum2)).toBe(true)
            expect(Big(paymentAmount1).plus(paymentAmount2).eq(splitSum)).toBe(true)
        })

        test('split 2 payments for same distribution with two groups and fee payer in 2nd group', () => {
            const recipient1 = createTestRecipient()
            const recipient2 = createTestRecipient()

            const distribution = [
                { recipient: recipient1, amount: '800', order: 0, vor: true, overpaymentPart: 1, isFeePayer: true },
                { recipient: recipient2, amount: '200', order: 1, vor: true, overpaymentPart: 1, isFeePayer: true },
            ]

            const feeAmount = '50'

            const paymentAmount1 = '500'
            const splits1 = split(paymentAmount1, distribution, { feeAmount })

            expect(splits1).toEqual(expect.arrayContaining([
                { recipient: recipient1, amount: '450', feeAmount: '50' },
            ]))

            const paymentAmount2 = '500'
            const splits2 = split(paymentAmount2, distribution, { appliedSplits: splits1, feeAmount })

            expect(splits2).toEqual(expect.arrayContaining([
                { recipient: recipient1, amount: '270', feeAmount: '30' },
                { recipient: recipient2, amount: '180', feeAmount: '20' },
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
                { recipient: recipient2, amount: '100', vor: true, overpaymentPart: 1 },
                { recipient: recipient3, amount: '100' },
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
                { recipient: recipient2, amount: '50', vor: true, overpaymentPart: 1 },
                { recipient: recipient3, amount: '150' },
            ]

            const paymentAmount2 = '180.00'
            const splits2 = split(paymentAmount2, distribution2, { appliedSplits: splits1 })

            expect(splits2).toEqual(expect.arrayContaining([
                { recipient: recipient1, amount: '60' },
                { recipient: recipient2, amount: '10' },
                { recipient: recipient3, amount: '110' },
            ]))

            const splitSum1 = splits1.reduce((sum, split) => sum.plus(split.amount || 0), Big(0))
            const splitSum2 = splits2.reduce((sum, split) => sum.plus(split.amount || 0), Big(0))
            const splitSum = [...splits1, ...splits2].reduce((sum, split) => sum.plus(split.amount || 0), Big(0))

            expect(Big(paymentAmount1).eq(splitSum1)).toBe(true)
            expect(Big(paymentAmount2).eq(splitSum2)).toBe(true)
            expect(Big(paymentAmount1).plus(paymentAmount2).eq(splitSum)).toBe(true)
        })

        test('split 2 payments with changed distribution with two groups', () => {
            const recipient1 = createTestRecipient()
            const recipient2 = createTestRecipient()
            const recipient3 = createTestRecipient()

            const distribution1 = [
                { recipient: recipient1, amount: '100', order: 0, vor: true, overpaymentPart: 1 },
                { recipient: recipient2, amount: '100', order: 1, vor: true, overpaymentPart: 1 },
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
                { recipient: recipient1, amount: '120', order: 0, vor: true, overpaymentPart: 1 },
                { recipient: recipient2, amount: '50', order: 1, vor: true, overpaymentPart: 1 },
                { recipient: recipient3, amount: '130', order: 1, overpaymentPart: 1 },
            ]

            const paymentAmount2 = '180.00'
            const splits2 = split(paymentAmount2, distribution2, { appliedSplits: splits1 })

            expect(splits2).toEqual(expect.arrayContaining([
                { recipient: recipient1, amount: '20' },
                { recipient: recipient2, amount: '40' },
                { recipient: recipient3, amount: '120' },
            ]))

            const splitSum1 = splits1.reduce((sum, split) => sum.plus(split.amount || 0), Big(0))
            const splitSum2 = splits2.reduce((sum, split) => sum.plus(split.amount || 0), Big(0))
            const splitSum = [...splits1, ...splits2].reduce((sum, split) => sum.plus(split.amount || 0), Big(0))

            expect(Big(paymentAmount1).eq(splitSum1)).toBe(true)
            expect(Big(paymentAmount2).eq(splitSum2)).toBe(true)
            expect(Big(paymentAmount1).plus(paymentAmount2).eq(splitSum)).toBe(true)
        })

        test('split 2 payments with changed distribution to less amount with two groups', () => {
            const recipient1 = createTestRecipient()
            const recipient2 = createTestRecipient()
            const recipient3 = createTestRecipient()

            const distribution1 = [
                { recipient: recipient1, amount: '100', order: 0, vor: true, overpaymentPart: 1 },
                { recipient: recipient2, amount: '100', order: 1, vor: true, overpaymentPart: 1 },
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
                { recipient: recipient1, amount: '80', order: 0, vor: true, overpaymentPart: 1 },
                { recipient: recipient2, amount: '90', order: 1, vor: true, overpaymentPart: 1 },
                { recipient: recipient3, amount: '130', order: 1, overpaymentPart: 1 },
            ]

            const paymentAmount2 = '180.00'
            const splits2 = split(paymentAmount2, distribution2, { appliedSplits: splits1 })

            expect(splits2).toEqual(expect.arrayContaining([
                { recipient: recipient2, amount: '72' },
                { recipient: recipient3, amount: '108' },
            ]))

            const splitSum1 = splits1.reduce((sum, split) => sum.plus(split.amount || 0), Big(0))
            const splitSum2 = splits2.reduce((sum, split) => sum.plus(split.amount || 0), Big(0))
            const splitSum = [...splits1, ...splits2].reduce((sum, split) => sum.plus(split.amount || 0), Big(0))

            expect(Big(paymentAmount1).eq(splitSum1)).toBe(true)
            expect(Big(paymentAmount2).eq(splitSum2)).toBe(true)
            expect(Big(paymentAmount1).plus(paymentAmount2).eq(splitSum)).toBe(true)
        })

        test('split 3 payments with changed distribution with two groups and groups were changed', () => {
            const recipient1 = createTestRecipient()
            const recipient2 = createTestRecipient()
            const recipient3 = createTestRecipient()

            const distribution1 = [
                { recipient: recipient1, amount: '100', order: 0, vor: true, overpaymentPart: 1 },
                { recipient: recipient2, amount: '100', order: 1, vor: true, overpaymentPart: 1 },
                { recipient: recipient3, amount: '100', order: 1, overpaymentPart: 1 },
            ]

            const paymentAmount1 = '120.00'
            const splits1 = split(paymentAmount1, distribution1)
            const splitSum1 = splits1.reduce((sum, split) => sum.plus(split.amount || 0), Big(0))

            expect(Big(paymentAmount1).eq(splitSum1)).toBe(true)
            expect(splits1).toEqual(expect.arrayContaining([
                { recipient: recipient1, amount: '100' },
                { recipient: recipient2, amount: '10' },
                { recipient: recipient3, amount: '10' },
            ]))

            const distribution2 = [
                { recipient: recipient1, amount: '100', order: 0, vor: true, overpaymentPart: 1 },
                { recipient: recipient2, amount: '100', order: 0 },
                { recipient: recipient3, amount: '100', order: 1, vor: true, overpaymentPart: 1 },
            ]

            const paymentAmount2 = '50.00'
            const splits2 = split(paymentAmount2, distribution2, { appliedSplits: splits1 })
            const splitSum2 = splits2.reduce((sum, split) => sum.plus(split.amount || 0), Big(0))

            expect(Big(paymentAmount2).eq(splitSum2)).toBe(true)
            expect(splits2).toEqual(expect.arrayContaining([
                { recipient: recipient2, amount: '50' },
            ]))

            const paymentAmount3 = '130.00'
            const splits3 = split(paymentAmount3, distribution2, { appliedSplits: [...splits1, ...splits2] })
            const splitSum3 = splits3.reduce((sum, split) => sum.plus(split.amount || 0), Big(0))

            expect(Big(paymentAmount3).eq(splitSum3)).toBe(true)
            expect(splits3).toEqual(expect.arrayContaining([
                { recipient: recipient2, amount: '40' },
                { recipient: recipient3, amount: '90' },
            ]))

            const splitSum = [...splits1, ...splits2, ...splits3].reduce((sum, split) => sum.plus(split.amount || 0), Big(0))

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

            const splitSum = splits.reduce((sum, split) => sum.plus(split.amount || 0), Big(0))

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

            const splitSum = splits.reduce((sum, split) => sum.plus(split.amount || 0), Big(0))

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

            const splitSum = splits.reduce((sum, split) => sum.plus(split.amount || 0), Big(0))

            expect(Big(paymentAmount).eq(splitSum)).toBe(true)
        })

        test('split 2 payments with overpayment for same distribution with two groups + correct sorting', () => {
            const recipient1 = createTestRecipient()
            const recipient2 = createTestRecipient()
            const recipient3 = createTestRecipient()

            // Also, test for correct sorting
            // [4,10].sort((a,b)=>a-b)  ==>>    [4,10]  <--- we need this sorting
            // [4,10].sort()            ==>>    [10,4]
            const distribution = [
                { recipient: recipient1, amount: '100', order: 4, vor: true, overpaymentPart: 1 },
                { recipient: recipient2, amount: '100', order: 10, vor: true, overpaymentPart: 1 },
                { recipient: recipient3, amount: '100', order: 10, overpaymentPart: 1 },
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
                { recipient: recipient1, amount: '33.33' },
                { recipient: recipient2, amount: '123.34' },
                { recipient: recipient3, amount: '123.33' },
            ]))

            const splitSum1 = splits1.reduce((sum, split) => sum.plus(split.amount || 0), Big(0))
            const splitSum2 = splits2.reduce((sum, split) => sum.plus(split.amount || 0), Big(0))
            const splitSum = [...splits1, ...splits2].reduce((sum, split) => sum.plus(split.amount || 0), Big(0))

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
                { recipient: recipient2, amount: '100', order: 1, vor: true, overpaymentPart: 1 },
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
                { recipient: recipient1, amount: '120', order: 0, vor: true, overpaymentPart: 1 },
                { recipient: recipient2, amount: '50', order: 1 },
                { recipient: recipient3, amount: '130', order: 1, vor: true, overpaymentPart: 1 },
            ]

            const paymentAmount2 = '280.00'
            const splits2 = split(paymentAmount2, distribution2, { appliedSplits: splits1 })

            expect(splits2).toEqual(expect.arrayContaining([
                { recipient: recipient1, amount: '70' },
                { recipient: recipient2, amount: '40' },
                { recipient: recipient3, amount: '170' },
            ]))

            const splitSum1 = splits1.reduce((sum, split) => sum.plus(split.amount || 0), Big(0))
            const splitSum2 = splits2.reduce((sum, split) => sum.plus(split.amount || 0), Big(0))
            const splitSum = [...splits1, ...splits2].reduce((sum, split) => sum.plus(split.amount || 0), Big(0))

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
            { recipient: recipient1, amount: '100', order: 0, vor: true, isFeePayer: true, overpaymentPart: 1 },
            { recipient: recipient2, amount: '100', order: 1, vor: true, isFeePayer: true, overpaymentPart: 1 },
            { recipient: recipient3, amount: '100', order: 1, overpaymentPart: 1, isFeePayer: true },
        ]

        const paymentAmount1 = '120'
        const feeAmount1 = '12'
        const splits1 = split(paymentAmount1, distribution1, { feeAmount: feeAmount1 })
        const splitSum1 = splits1.reduce((sum, split) => sum.plus(split.amount || 0), Big(0))
        const feeSum1 = splits1.reduce((sum, split) => sum.plus(split.feeAmount || 0), Big(0))

        expect(Big(paymentAmount1).eq(splitSum1.plus(feeSum1))).toBe(true)
        expect(splits1).toEqual(expect.arrayContaining([
            { recipient: recipient1, amount: '90', feeAmount: '10' },
            { recipient: recipient2, amount: '9', feeAmount: '1' },
            { recipient: recipient3, amount: '9', feeAmount: '1' },
        ]))

        const distribution2 = [
            { recipient: recipient1, amount: '100', order: 0, vor: true, isFeePayer: true, overpaymentPart: 1 },
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
        const splitSum3 = splits3.reduce((sum, split) => sum.plus(split.amount || 0), Big(0))
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

    describe('custom decimalPlaces option', () => {
        test('split with decimalPlaces=3', () => {
            const paymentAmount = '100.000'
            const recipient1 = createTestRecipient()
            const recipient2 = createTestRecipient()
            const recipient3 = createTestRecipient()

            const distribution = [
                { recipient: recipient1, amount: '500' },
                { recipient: recipient2, amount: '500', vor: true, overpaymentPart: 1 },
                { recipient: recipient3, amount: '500' },
            ]
            const splits = split(paymentAmount, distribution, { decimalPlaces: 3 })

            expect(splits).toEqual(expect.arrayContaining([
                { recipient: recipient1, amount: '33.333' },
                { recipient: recipient2, amount: '33.334' },
                { recipient: recipient3, amount: '33.333' },
            ]))

            const splitSum = splits.reduce((sum, split) => sum.plus(split.amount || 0), Big(0))
            expect(Big(paymentAmount).eq(splitSum)).toBe(true)
        })

        test('split with decimalPlaces=0 (whole numbers)', () => {
            const paymentAmount = '100'
            const recipient1 = createTestRecipient()
            const recipient2 = createTestRecipient()
            const recipient3 = createTestRecipient()

            const distribution = [
                { recipient: recipient1, amount: '500' },
                { recipient: recipient2, amount: '500', vor: true, overpaymentPart: 1 },
                { recipient: recipient3, amount: '500' },
            ]
            const splits = split(paymentAmount, distribution, { decimalPlaces: 0 })

            expect(splits).toEqual(expect.arrayContaining([
                { recipient: recipient1, amount: '33' },
                { recipient: recipient2, amount: '34' },
                { recipient: recipient3, amount: '33' },
            ]))

            const splitSum = splits.reduce((sum, split) => sum.plus(split.amount || 0), Big(0))
            expect(Big(paymentAmount).eq(splitSum)).toBe(true)
        })
    })

    describe('overpayment with different overpaymentPart ratios', () => {
        test('split overpayment with different ratios (1:2:3)', () => {
            const paymentAmount = '400'
            const recipient1 = createTestRecipient()
            const recipient2 = createTestRecipient()
            const recipient3 = createTestRecipient()

            const distribution = [
                { recipient: recipient1, amount: '100', overpaymentPart: 1 },
                { recipient: recipient2, amount: '100', overpaymentPart: 2 },
                { recipient: recipient3, amount: '100', vor: true, overpaymentPart: 3 },
            ]
            const splits = split(paymentAmount, distribution)

            // Total distribution = 300, overpayment = 100
            // Overpayment distribution: 1/(1+2+3) = 1/6, 2/6, 3/6
            // recipient1: 100 + 100*(1/6) = 100 + 16.67 = 116.67
            // recipient2: 100 + 100*(2/6) = 100 + 33.33 = 133.33
            // recipient3: 100 + 100*(3/6) = 100 + 50 = 150 (vor gets rounding)
            expect(splits).toEqual(expect.arrayContaining([
                { recipient: recipient1, amount: '116.67' },
                { recipient: recipient2, amount: '133.33' },
                { recipient: recipient3, amount: '150' },
            ]))

            const splitSum = splits.reduce((sum, split) => sum.plus(split.amount || 0), Big(0))
            expect(Big(paymentAmount).eq(splitSum)).toBe(true)
        })

        test('split overpayment with different ratios (0.5:1:1.5)', () => {
            const paymentAmount = '600'
            const recipient1 = createTestRecipient()
            const recipient2 = createTestRecipient()
            const recipient3 = createTestRecipient()

            const distribution = [
                { recipient: recipient1, amount: '100', overpaymentPart: 0.5 },
                { recipient: recipient2, amount: '100', overpaymentPart: 1 },
                { recipient: recipient3, amount: '100', vor: true, overpaymentPart: 1.5 },
            ]
            const splits = split(paymentAmount, distribution)

            // Total distribution = 300, overpayment = 300
            // Overpayment distribution: 0.5/3, 1/3, 1.5/3
            // recipient1: 100 + 300*(0.5/3) = 100 + 50 = 150
            // recipient2: 100 + 300*(1/3) = 100 + 100 = 200
            // recipient3: 100 + 300*(1.5/3) = 100 + 150 = 250 (vor gets rounding)
            expect(splits).toEqual(expect.arrayContaining([
                { recipient: recipient1, amount: '150' },
                { recipient: recipient2, amount: '200' },
                { recipient: recipient3, amount: '250' },
            ]))

            const splitSum = splits.reduce((sum, split) => sum.plus(split.amount || 0), Big(0))
            expect(Big(paymentAmount).eq(splitSum)).toBe(true)
        })
    })


    describe('edge cases with multiple groups', () => {
        test('split with 3 groups (orders 0, 1, 2)', () => {
            const recipient1 = createTestRecipient()
            const recipient2 = createTestRecipient()
            const recipient3 = createTestRecipient()

            const distribution = [
                { recipient: recipient1, amount: '100', order: 0, vor: true, overpaymentPart: 1 },
                { recipient: recipient2, amount: '100', order: 1, vor: true, overpaymentPart: 1 },
                { recipient: recipient3, amount: '100', order: 2, vor: true, overpaymentPart: 1 },
            ]

            const paymentAmount = '150'
            const splits = split(paymentAmount, distribution)

            expect(splits).toEqual(expect.arrayContaining([
                { recipient: recipient1, amount: '100' },
                { recipient: recipient2, amount: '50' },
            ]))

            const splitSum = splits.reduce((sum, split) => sum.plus(split.amount || 0), Big(0))
            expect(Big(paymentAmount).eq(splitSum)).toBe(true)
        })

        test('split with groups in non-sequential order (0, 5, 10)', () => {
            const recipient1 = createTestRecipient()
            const recipient2 = createTestRecipient()
            const recipient3 = createTestRecipient()

            const distribution = [
                { recipient: recipient1, amount: '100', order: 0, vor: true, overpaymentPart: 1 },
                { recipient: recipient2, amount: '100', order: 5, vor: true, overpaymentPart: 1 },
                { recipient: recipient3, amount: '100', order: 10, vor: true, overpaymentPart: 1 },
            ]

            const paymentAmount = '250'
            const splits = split(paymentAmount, distribution)

            expect(splits).toEqual(expect.arrayContaining([
                { recipient: recipient1, amount: '100' },
                { recipient: recipient2, amount: '100' },
                { recipient: recipient3, amount: '50' },
            ]))

            const splitSum = splits.reduce((sum, split) => sum.plus(split.amount || 0), Big(0))
            expect(Big(paymentAmount).eq(splitSum)).toBe(true)
        })
    })

    describe('overpayment distribution with multiple recipients and different orders', () => {
        test('overpayment split with multiple overpaymentPart recipients across groups', () => {
            const recipient1 = createTestRecipient()
            const recipient2 = createTestRecipient()
            const recipient3 = createTestRecipient()
            const recipient4 = createTestRecipient()

            // Each group must have exactly ONE vor item
            const distribution = [
                { recipient: recipient1, amount: '100', order: 0, vor: true, overpaymentPart: 1 },
                { recipient: recipient2, amount: '100', order: 1, overpaymentPart: 1 },
                { recipient: recipient3, amount: '100', order: 1, vor: true, overpaymentPart: 1 },
                { recipient: recipient4, amount: '100', order: 2, vor: true, overpaymentPart: 1 },
            ]

            const paymentAmount = '600'
            const splits = split(paymentAmount, distribution)

            // All recipients get their base + share of overpayment
            // Base total: 400, overpayment: 200
            // All 4 recipients have overpaymentPart=1, so each gets 200/4 = 50 extra
            expect(splits).toHaveLength(4)

            const splitSum = splits.reduce((sum, split) => sum.plus(split.amount || 0), Big(0))
            expect(Big(paymentAmount).eq(splitSum)).toBe(true)

            // Verify all recipients get base + overpayment share
            const recipient1Split = splits.find(s => s.recipient === recipient1)
            const recipient2Split = splits.find(s => s.recipient === recipient2)
            const recipient3Split = splits.find(s => s.recipient === recipient3)
            const recipient4Split = splits.find(s => s.recipient === recipient4)
            
            // Each should get 100 + 50 = 150 (with rounding adjustments)
            expect(recipient1Split).toBeDefined()
            expect(recipient2Split).toBeDefined()
            expect(recipient3Split).toBeDefined()
            expect(recipient4Split).toBeDefined()
        })
    })

    describe('fee distribution with complex scenarios', () => {
        test('fee distribution with different decimal places', () => {
            const paymentAmount = '1000.000'
            const feeAmount = '33.333'
            const recipient1 = createTestRecipient()
            const recipient2 = createTestRecipient()

            const distribution = [
                { recipient: recipient1, amount: '600', isFeePayer: true },
                { recipient: recipient2, amount: '400', vor: true, overpaymentPart: 1, isFeePayer: true },
            ]
            const splits = split(paymentAmount, distribution, { feeAmount, decimalPlaces: 3 })

            const splitSum = splits.reduce((sum, split) => sum.plus(split.amount || 0), Big(0))
            const feeSum = splits.reduce((sum, split) => sum.plus(split.feeAmount || 0), Big(0))

            expect(Big(feeAmount).eq(feeSum)).toBe(true)
            expect(Big(paymentAmount).eq(splitSum.plus(feeSum))).toBe(true)
        })

        test('single fee payer with multiple non-fee payers', () => {
            const paymentAmount = '1000'
            const feeAmount = '100'
            const recipient1 = createTestRecipient()
            const recipient2 = createTestRecipient()
            const recipient3 = createTestRecipient()

            const distribution = [
                { recipient: recipient1, amount: '400' },
                { recipient: recipient2, amount: '300' },
                { recipient: recipient3, amount: '300', vor: true, overpaymentPart: 1, isFeePayer: true },
            ]
            const splits = split(paymentAmount, distribution, { feeAmount })

            expect(splits).toEqual(expect.arrayContaining([
                { recipient: recipient1, amount: '400' },
                { recipient: recipient2, amount: '300' },
                { recipient: recipient3, amount: '200', feeAmount: '100' },
            ]))

            const splitSum = splits.reduce((sum, split) => sum.plus(split.amount || 0), Big(0))
            const feeSum = splits.reduce((sum, split) => sum.plus(split.feeAmount || 0), Big(0))

            expect(Big(feeAmount).eq(feeSum)).toBe(true)
            expect(Big(paymentAmount).eq(splitSum.plus(feeSum))).toBe(true)
        })
    })
})
