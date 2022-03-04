/*
    Formula explain:
    (x + Δx) ⋅ β + x ⋅ γ = Δx
    Δx = (β + γ) ⋅ x / (1 - β)
    x - initial amount, 1000 ₽
    Δx - additional amount user needs to pay, 12.10 ₽
    β - commission from total amount of payment, 0.012  ( 1.2% )
    γ - commission from initial amount of payment, 0.008 ( 0.8 %)
*/

/*  Fee settings

    Acquiring can have explicitFeeDistributionSchema

    [{"recipient":"fromTotalAmountFee","percent":"0.8"},{"recipient":"fromReceiptAmountFee","percent":"0.4"}]

    AcquiringIntegrationContext can have implicitFeeDistributionSchema

    [{"recipient":"organization","percent":"1.7"}] can be smth between 1.2 and 1.7 percents - depends on contract, or it can be 0

 */

const { Logger } = require('@condo/domains/common/utils/logger.js')

const Big = require('big.js')


class FeeDistribution extends Logger {

    summa = 0
    formula = {}

    constructor (summa, formula) {
        super('commission')
        this.summa = Big(summa)
        this.formula = Object.fromEntries(
            Object.entries(formula)
                .map(([recipient, percent]) => ([recipient, Big(percent).mul(Big('0.01'))]))
        )
        this.validateFormula()
    }

    validateFormula (formula) {
        if (this.formula.organization && !this.formula.organization.eq(Big('0'))) {
            const difference = this.formula.organization.minus(this.formula.fromTotalAmountFee).minus(this.formula.fromReceiptAmountFee)
            if (Number(difference) < 0 ) {
                const explain = `${difference} = ${this.formula.organization.toString()} - ${this.formula.fromTotalAmountFee.toString()} - ${this.formula.fromReceiptAmountFee.toString()}`
                this.error('Wrong distribution formula', { explain })
                throw new Error(`Unsupported formula`)
            }
        }
    }

    validateDistribution (toPay) {
        const { summa, initialSum, recipientSum, explicitFee, implicitFee, fromTotalAmountFee, fromReceiptAmountFee } = toPay
        const payDifference = Number(summa.minus(recipientSum).minus(explicitFee).minus(implicitFee).toFixed(2))
        if (payDifference !== 0) {
            this.error('Payment check failed', toPay)
        }
        const commissionDifference = Math.abs(Number(explicitFee.plus(implicitFee).minus(fromReceiptAmountFee).minus(fromTotalAmountFee)))
        if (commissionDifference !== 0) {
            this.error('Commission check failed', toPay)
        }
        return {
            payDifference,
            commissionDifference,
        }
    }

    calculate () {
        const toPay = {
            summa: this.summa,
            initialSum: this.summa,
            recipientSum: this.summa,
            explicitFee: Big(0),
            implicitFee: Big(0),
            fromTotalAmountFee: Big(0),
            fromReceiptAmountFee: Big(0),
        }
        if (this.formula.organization && !this.formula.organization.eq(Big('0'))) {
            toPay.implicitFee = this.summa.mul(this.formula.organization)
            toPay.fromTotalAmountFee = this.summa.mul(this.formula.fromTotalAmountFee)
            toPay.fromReceiptAmountFee = toPay.implicitFee.minus(toPay.fromTotalAmountFee)
            toPay.recipientSum = this.summa.minus(toPay.implicitFee)
        } else {
            const totalCommission = this.formula.fromTotalAmountFee.plus(this.formula.fromReceiptAmountFee)
            // See - Formula explain
            const overSum = this.summa.mul(totalCommission).div(Big(1).minus(this.formula.fromTotalAmountFee))
            toPay.explicitFee = overSum
            toPay.summa = this.summa.plus(overSum)
            toPay.fromTotalAmountFee = toPay.summa.mul(this.formula.fromTotalAmountFee)
            toPay.fromReceiptAmountFee = toPay.explicitFee.minus(toPay.fromTotalAmountFee)
            toPay.recipientSum = toPay.initialSum
        }
        const check = this.validateDistribution(toPay)
        for (const key in toPay) {
            toPay[key] = Number(toPay[key].toFixed(2))
        }
        toPay.check = check
        return toPay
    }
}

module.exports = {
    FeeDistribution,
}