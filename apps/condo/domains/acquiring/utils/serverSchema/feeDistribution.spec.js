/**
 * @jest-environment node
 */

const { FeeDistribution } = require('./feeDistribution')
const Big = require('big.js')
const {
    FEE_DISTRIBUTION_UNSUPPORTED_FORMULA,
    FEE_DISTRIBUTION_INCOMPLETE_FORMULA,
    FEE_TOTAL_SUM_FAILED,
    FEE_TOTAL_FAILED,
} = require('@condo/domains/acquiring/constants/errors.js')

describe('FeeDistribution calculation cases', () => {

    describe('Formula validation', () => {
        it('checks that mixed fee formula can not be used', async () => {
            const mixedFeeFormula = { organization: 1.2, acquiring: 0.9, service: 0.7 }
            const calculator = new FeeDistribution(mixedFeeFormula)
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
            const explicitCommissionFormula = { organization: 0, acquiring: 0.8, commission: 0.4 }
            const calculator = new FeeDistribution(explicitCommissionFormula)
            expect(calculator.type).toEqual('commission')
            const { check: { payDifference, commissionDifference }, summa } = calculator.calculate(Big(1))
            expect(payDifference).toEqual(0)
            expect(commissionDifference).toEqual(0)
            expect(summa).toEqual(1.01)
        })
        it('works on 100000000 ₽', () => {
            const explicitCommissionFormula = { organization: 0, acquiring: 0.8, commission: 0.4 }
            const calculator = new FeeDistribution(explicitCommissionFormula)
            expect(calculator.type).toEqual('commission')
            const { check: { payDifference, commissionDifference }, summa } = calculator.calculate(Big(100000000))
            expect(payDifference).toEqual(0)
            expect(commissionDifference).toEqual(0)
            expect(summa).toEqual(101209677.42)
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
            expect(summa).toEqual(101209677.42)
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
            const { check: { payDifference, commissionDifference }, summa, recipientSum } = calculator.calculate(Big(100000000))
            expect(payDifference).toEqual(0)
            expect(commissionDifference).toEqual(0)
            expect(summa).toEqual(100000000)
            expect(recipientSum).toEqual(98400000)
        })
    })
})