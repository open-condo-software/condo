/**
 * @jest-environment node
 */

const Big = require('big.js')

const {
    FEE_DISTRIBUTION_UNSUPPORTED_FORMULA,
    FEE_DISTRIBUTION_INCOMPLETE_FORMULA,
} = require('@condo/domains/acquiring/constants/errors.js')

const { FeeDistribution, compactDistributionSettings } = require('./feeDistribution')


const TEST_CASES = [
    {
        title: 'Settings for commission with null fields',
        settings: [
            { recipient:'acquiring', percent:'1', minAmount:null, maxAmount:null, category: null },
            { recipient:'commission', percent:'1', minAmount:null, maxAmount:null },
        ],
        cases: [
            { amount: '1', category: 'housing', expected: { type: 'commission', summa: 1.02, recipientSum: 1, explicitFee: 0.02 } },
        ],
    },
    {
        title: 'Settings for commission without categories',
        settings: [
            { recipient:'acquiring', percent:'1.68', minAmount:'8.4', maxAmount:'1050' },
            { recipient:'commission', percent:'0.72', minAmount:'3.6', maxAmount:'450' },
        ],
        cases: [
            { amount: 1, category: 'housing', expected: { type: 'commission', summa: 13, recipientSum: 1, explicitFee: 12 } },
            { amount: '4161.00', category: 'overhaul', expected: { type: 'commission', summa: 4260.86, recipientSum: 4161, explicitFee: 99.86 } },
            { amount: 360192, category: 'trash', expected: { type: 'commission', summa: 361692, recipientSum: 360192, explicitFee: 1500 } },
            { amount: 812, category: null, expected: { type: 'commission', summa: 831.49, recipientSum: 812, explicitFee: 19.49 } },
        ],
    },
    {
        title: 'Settings for commission with categories',
        settings: [
            { recipient:'acquiring', percent:'2' },
            { recipient:'commission', percent:'0.1' },
            { recipient:'organization', percent: '2.1' },
            { recipient:'acquiring', percent:'1.68', minAmount:'8.4', maxAmount:'1050', category: 'overhaul' },
            { recipient:'commission', percent:'0.72', minAmount:'3.6', maxAmount:'450', category: 'overhaul' },
            { recipient:'acquiring', percent:'0', category: 'penny' },
            { recipient:'commission', percent:'0', category: 'penny' },
        ],
        cases: [
            { amount: 4231, category: 'overhaul', expected: { type: 'commission', summa: 4332.54, recipientSum: 4231, explicitFee: 101.54 } },
            { amount: '18532.00', category: 'penny', expected: { type: 'commission', summa: 18532, recipientSum: 18532, explicitFee: 0 } },
            { amount: 1735, category: null, expected: { type: 'commission', summa: 1735, recipientSum: 1698.57, implicitFee: 36.44 } },
        ],
    },
    {
        title: 'Settings for service fee. Implicit fee',
        settings: [
            { recipient:'acquiring', percent:'0.8' },
            { recipient:'service', percent:'0.4' },
            { recipient:'organization', percent: '1.2' },
        ],
        cases: [
            { amount: 5, expected: { type: 'service', summa: 5, recipientSum: 4.94, implicitFee: 0.06 } },
            { amount: 1000, expected: { type: 'service', summa: 1000, recipientSum: 988, implicitFee: 12 } },
            { amount: 17354231, category: null, expected: { type: 'service', summa: 17354231, recipientSum: 17145980.23, implicitFee: 208250.77 } },
        ],
    },
    {
        title: 'Settings for service fee. Explicit fee',
        settings: [
            { recipient: 'acquiring', percent: '0.8' },
            { recipient: 'service', percent: '0.4' },
        ],
        cases: [
            { amount: 1, expected: { type: 'service', summa: 1.01, recipientSum: 1, explicitFee: 0.01 } },
            { amount: 5125812.99, expected: { type: 'service', summa: 5187322.75, recipientSum: 5125812.99, explicitFee: 61509.76 } },
            { amount: 1746.12, category: null, expected: { type: 'service', summa: 1767.07, recipientSum: 1746.12, explicitFee: 20.95 } },
        ],
    },
    {
        title: 'Sum is 0 or negative. Commission will be 0 if set min',
        settings: [
            { recipient: 'acquiring', percent: '0.8', minAmount: '200' },
            { recipient: 'service', percent: '0.4', minAmount: '100' },
        ],
        cases: [
            { amount: 0, expected: { type: 'service', summa: 0, recipientSum: 0, explicitFee: 0 } },
            { amount: -200.15, expected: { type: 'service', summa: -200.15, recipientSum: -200.15, explicitFee: 0 } },
        ],
    },
]

describe('Commission and serviceFee calculation', () => {
    for (const settingsCase in TEST_CASES) {
        const { title, settings, cases } = TEST_CASES[settingsCase]
        describe(title, () => {
            const formula = compactDistributionSettings(settings)
            for (const testingCase of cases) {
                const { amount, category, expected } = testingCase
                const calculator = new FeeDistribution(formula, category)
                const result = calculator.calculate(amount)
                for (const checkKey in expected) {
                    expect(result[checkKey]).toEqual(expected[checkKey])
                    expect(result.check.payDifference).toEqual(0)
                    expect(result.check.commissionDifference).toEqual(0)
                }
            }
        })
    }
})

describe('FeeDistribution calculation cases', () => {
    describe('Calculation service fee', () => {
        describe('Formula validation', () => {
            it('checks that mixed fee formula can not be used', async () => {
                const mixedFeeFormula = { organization: 1.2, acquiring: 0.9, service: 0.7 }
                const calculator = new FeeDistribution(mixedFeeFormula)
                let thrownError
                try {
                    calculator.validateFormula()
                } catch (e) {
                    thrownError = e
                }
                expect(thrownError).toBeDefined()
                expect(thrownError.message).toContain(FEE_DISTRIBUTION_UNSUPPORTED_FORMULA)
            })
            it('needs to have service or commission recipient', async () => {
                const incompleteFeeFormula = { organization: 1.2, acquiring: 0.9 }
                const calculator = new FeeDistribution(incompleteFeeFormula)
                let thrownError
                try {
                    calculator.validateFormula()
                } catch (e) {
                    thrownError = e
                }
                expect(thrownError).toBeDefined()
                expect(thrownError.message).toContain(FEE_DISTRIBUTION_INCOMPLETE_FORMULA)
            })
        })

        describe('Explicit commission', () => {
            it('works on 1 ₽', () => {
                const explicitCommissionFormula = { organization: 0, acquiring: 0.8, service: 0.4 }
                const calculator = new FeeDistribution(explicitCommissionFormula)
                expect(calculator.type).toEqual('service')
                const { check: { payDifference, commissionDifference }, summa } = calculator.calculate(Big(1))
                expect(payDifference).toEqual(0)
                expect(commissionDifference).toEqual(0)
                expect(summa).toEqual(1.01)
            })
            it('works on 100000000 ₽', () => {
                const explicitCommissionFormula = { organization: 0, acquiring: 0.8, service: 0.4 }
                const calculator = new FeeDistribution(explicitCommissionFormula)
                expect(calculator.type).toEqual('service')
                const { check: { payDifference, commissionDifference }, summa } = calculator.calculate(Big(100000000))
                expect(payDifference).toEqual(0)
                expect(commissionDifference).toEqual(0)
                expect(summa).toEqual(101200000)
            })
        })

        describe('Explicit service', () => {
            it('works on 1 ₽', () => {
                const explicitServiceFormula = { organization: 0, acquiring: 0.8, service: 0.4 }
                const calculator = new FeeDistribution(explicitServiceFormula)
                expect(calculator.type).toEqual('service')
                const { check: { payDifference, commissionDifference }, summa } = calculator.calculate(Big(1))
                expect(payDifference).toEqual(0)
                expect(commissionDifference).toEqual(0)
                expect(summa).toEqual(1.01)
            })
            it('works on 100000000 ₽', () => {
                const explicitServiceFormula = { organization: 0, acquiring: 0.8, service: 0.4 }
                const calculator = new FeeDistribution(explicitServiceFormula)
                expect(calculator.type).toEqual('service')
                const { check: { payDifference, commissionDifference }, summa } = calculator.calculate(Big(100000000))
                expect(payDifference).toEqual(0)
                expect(commissionDifference).toEqual(0)
                expect(summa).toEqual(101200000)
            })
        })

        describe('Implicit fee', () => {
            it('works on 1 ₽', () => {
                const implicitFeeFormula = { organization: 1.6, acquiring: 0.9, service: 0.7 }
                const calculator = new FeeDistribution(implicitFeeFormula)
                const { check: { payDifference, commissionDifference }, summa, recipientSum } = calculator.calculate(Big(1))
                expect(payDifference).toEqual(0)
                expect(commissionDifference).toEqual(0)
                expect(summa).toEqual(1)
                expect(recipientSum).toEqual(0.98)
            })
            it('works on 100000000 ₽', () => {
                const implicitFeeFormula = { organization: 1.6, acquiring: 0.9, service: 0.7 }
                const calculator = new FeeDistribution(implicitFeeFormula)
                const {
                    check: { payDifference, commissionDifference },
                    summa,
                    recipientSum,
                } = calculator.calculate(Big(100000000))
                expect(payDifference).toEqual(0)
                expect(commissionDifference).toEqual(0)
                expect(summa).toEqual(100000000)
                expect(recipientSum).toEqual(98400000)
            })
        })
    })

})
