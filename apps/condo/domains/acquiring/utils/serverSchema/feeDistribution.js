/*
    Formula explain:
    (x + Δx) ⋅ β + x ⋅ γ = Δx
    Δx = (β + γ) ⋅ x / (1 - β)
    x - initial amount, 1000 ₽
    Δx - additional amount user needs to pay, 12.10 ₽
    β - commission from total amount of payment, 0.008  ( 0.8% )
    γ - commission from initial amount of payment, 0.004 ( 0.4 %)
*/

/*  Fee settings
    Acquiring can have explicitFeeDistributionSchema
    [{"recipient":"acquiring","percent":"0.8"},{"recipient":"service","percent":"0.4"}]
    "acquiring" recipient = includes all technical fees to complete payment
    formula needs to have service or commission recipient

    AcquiringIntegrationContext can have implicitFeeDistributionSchema
    [{"recipient":"organization","percent":"1.7"}] - 1.2 ... 1.7 depends on contract, or it can be 0
 */

const { Logger } = require('@condo/domains/common/utils/logger.js')
const {
    FEE_DISTRIBUTION_UNSUPPORTED_FORMULA,
    FEE_DISTRIBUTION_INCOMPLETE_FORMULA,
    FEE_TOTAL_SUM_FAILED,
    FEE_TOTAL_FAILED,
} = require('@condo/domains/acquiring/constants/errors.js')
const {
    AcquiringIntegrationContext: AcquiringIntegrationContextApi,
} = require('@condo/domains/acquiring/utils/serverSchema')


const Big = require('big.js')

class FeeDistribution extends Logger {

    formula = {}
    type = 'unknown' // cam be service or commission

    constructor (initialFormula) {
        super('acquiring-commission')
        const { service = 0, commission = 0, acquiring = 0, organization = 0 } = initialFormula
        const formula = { organization }
        if (service) {
            this.type = 'service'
            formula.fromReceiptAmountFee = service
        }
        if (commission) {
            this.type = 'commission'
            formula.fromReceiptAmountFee = commission
        }
        formula.fromTotalAmountFee = acquiring
        this.formula = Object.fromEntries(
            Object.entries(formula)
                .map(([recipient, percent]) => ([recipient, Big(percent).mul(Big('0.01'))]))
        )
    }

    validateFormula (formula) {
        if (this.type === 'unknown') {
            throw new Error(`${FEE_DISTRIBUTION_INCOMPLETE_FORMULA}] needs to have service or commission recipient`)
        }
        if (this.formula.organization && !this.formula.organization.eq(Big('0'))) {
            const difference = this.formula.organization.minus(this.formula.fromTotalAmountFee).minus(this.formula.fromReceiptAmountFee)
            if (Number(difference) < 0 ) {
                const explain = `${difference} = ${this.formula.organization.toString()} - ${this.formula.fromTotalAmountFee.toString()} - ${this.formula.fromReceiptAmountFee.toString()}`
                this.error(`${FEE_DISTRIBUTION_UNSUPPORTED_FORMULA}]`, { explain })
                throw new Error(`${FEE_DISTRIBUTION_UNSUPPORTED_FORMULA}] ${explain}`)
            }
        }
    }

    validateDistribution (toPay) {
        const { summa, recipientSum, explicitFee, implicitFee, fromTotalAmountFee, fromReceiptAmountFee } = toPay
        const payDifference = Number(summa.minus(recipientSum).minus(explicitFee).minus(implicitFee).toFixed(2))
        if (payDifference !== 0) {
            this.error(`${FEE_TOTAL_SUM_FAILED}]`, toPay)
        }
        const commissionDifference = Math.abs(Number(explicitFee.plus(implicitFee).minus(fromReceiptAmountFee).minus(fromTotalAmountFee)))
        if (commissionDifference !== 0) {
            this.error(`${FEE_TOTAL_FAILED}]`, toPay)
        }
        return {
            payDifference,
            commissionDifference,
        }
    }

    calculate (amount) {
        this.validateFormula()
        const summa = Big(amount)
        const toPay = {
            summa,
            initialSum: summa,
            recipientSum: summa,
            explicitFee: Big(0),
            implicitFee: Big(0),
            fromTotalAmountFee: Big(0),
            fromReceiptAmountFee: Big(0),
        }
        if (this.formula.organization && !this.formula.organization.eq(Big('0'))) {
            // implicit
            toPay.implicitFee = summa.mul(this.formula.organization)
            toPay.fromTotalAmountFee = summa.mul(this.formula.fromTotalAmountFee)
            toPay.fromReceiptAmountFee = toPay.implicitFee.minus(toPay.fromTotalAmountFee)
            toPay.recipientSum = summa.minus(toPay.implicitFee)
        } else {
            // explicit
            const totalCommission = this.formula.fromTotalAmountFee.plus(this.formula.fromReceiptAmountFee)
            const overSum = summa.mul(totalCommission).div(Big(1).minus(this.formula.fromTotalAmountFee))
            toPay.explicitFee = overSum
            toPay.summa = summa.plus(overSum)
            toPay.fromTotalAmountFee = toPay.summa.mul(this.formula.fromTotalAmountFee)
            toPay.fromReceiptAmountFee = toPay.explicitFee.minus(toPay.fromTotalAmountFee)
            toPay.recipientSum = toPay.initialSum
        }
        const check = this.validateDistribution(toPay)
        for (const key in toPay) {
            toPay[key] = Number(toPay[key].toFixed(2))
        }
        return { type: this.type, ...toPay, check }
    }

}

const getAcquiringIntegrationContextFormula = async (context, acquiringContextId) => {
    const [{ integration: { explicitFeeDistributionSchema },  implicitFeeDistributionSchema } ] = await AcquiringIntegrationContextApi.getAll(context, { id: acquiringContextId })
    const formula = Object.fromEntries(
        explicitFeeDistributionSchema
            .concat(implicitFeeDistributionSchema)
            .map(({ recipient, percent }) => ([recipient, percent]))
    )
    return formula
}

module.exports = {
    FeeDistribution,
    getAcquiringIntegrationContextFormula,
}