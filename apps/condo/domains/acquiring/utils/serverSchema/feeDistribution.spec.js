/**
 * @jest-environment node
 */

const { FeeDistribution } = require('./feeDistribution')
const implicitFeeFormula = { organization: 1.6, fromTotalAmountFee: 0.9, fromReceiptAmountFee: 0.7 }
const explicitFeeFormula = { organization: 0, fromTotalAmountFee: 0.8, fromReceiptAmountFee: 0.4 }
const mixedFeeFormula = { organization: 1.2, fromTotalAmountFee: 0.9, fromReceiptAmountFee: 0.7 }
const Big = require('big.js')


describe('FeeDistribution calculation cases', () => {

    describe('Explicit fee', () => {
        it('works on 1 ₽', () => {
            const calculator = new FeeDistribution(Big(1), explicitFeeFormula)
            const { check: { payDifference, commissionDifference }, summa } = calculator.calculate()
            expect(payDifference).toEqual(0)
            expect(commissionDifference).toEqual(0)
            expect(summa).toEqual(1.01)
        })
        it('works on 100000000 ₽', () => {
            const calculator = new FeeDistribution(Big(100000000), explicitFeeFormula)
            const { check: { payDifference, commissionDifference }, summa } = calculator.calculate()
            expect(payDifference).toEqual(0)
            expect(commissionDifference).toEqual(0)
            expect(summa).toEqual(101209677.42)
        })
    })

    describe('Implicit fee', () => {
        it('works on 1 ₽', () => {
            const calculator = new FeeDistribution(Big(1), implicitFeeFormula)
            const { check: { payDifference, commissionDifference }, summa, recipientSum } = calculator.calculate()
            expect(payDifference).toEqual(0)
            expect(commissionDifference).toEqual(0)
            expect(summa).toEqual(1)
            expect(recipientSum).toEqual(0.98)
        })
        it('works on 100000000 ₽', () => {
            const calculator = new FeeDistribution(Big(100000000), implicitFeeFormula)
            const { check: { payDifference, commissionDifference }, summa, recipientSum } = calculator.calculate()
            expect(payDifference).toEqual(0)
            expect(commissionDifference).toEqual(0)
            expect(summa).toEqual(100000000)
            expect(recipientSum).toEqual(98400000)
        })
    })

    describe('Mixed fee', () => {
        it('can not be used', async () => {
            try {
                const calculator = new FeeDistribution(Big(1), mixedFeeFormula)
            } catch (e) {
                thrownError = e
            }
            expect(thrownError).toBeDefined()
            console.log('thrownError', thrownError.message)
        })
    })

})