/*
    Formula explain:
    (x + Δx) ⋅ β + x ⋅ γ = Δx
    Δx = (β + γ) ⋅ x / (1 - β)
    x - initial amount, 1000 ₽
    Δx - additional amount user needs to pay, 12.10 ₽
    β - commission from total amount of payment, 0.008  ( 0.8% )
    γ - commission from initial amount of payment, 0.004 ( 0.4 %)
*/

/*
    Differences between service fee and commission
    Commission:
        1. Is calculated based on the billingReceipt amount. For $1000 with commission 1.2% - commission will be $12
        2. Can have minimum and maximum amount
    Service fee:
        1. Is calculated based on formula ↑. Because, acquiring get commission based on total payment (billingReceipt + serviceFee)
        For $1000 with serviceFee 0.4% and acquiring fee 0.8% - additional amount will be (0.008 + 0.004) ⋅ $1000 / (1 - 0.008) = $12.10
*/

/*
    Service Fee settings

    Acquiring can have explicitFeeDistributionSchema

    [{"recipient":"acquiring","percent":"0.8"},{"recipient":"service","percent":"0.4"}]
    "acquiring" recipient = includes all technical fees to complete payment

    AcquiringIntegrationContext can have implicitFeeDistributionSchema

    [{"recipient":"organization","percent":"1.7"}] - 1.2 ... 1.7 depends on contract, or it can be 0
*/

/*
    Commission settings

    [
        {"recipient":"acquiring","percent":"1.68","minAmount":"8.4","maxAmount":"1050"},
        {"recipient":"commission","percent":"0.72","minAmount":"3.6","maxAmount":"450"}
    ]

    or in case for implicit commission

    [
        {"recipient":"organization","percent":"0.9"},
        {"recipient":"commission","percent":"0.9"}
    ]

    we can have different settings for different billing categories:

    for example, explicit commissions on overhaul billingCategory and implicit on housing billingCategory
    [
        {"recipient":"organization","percent":"0.9","category":"housing"},
        {"recipient":"commission","percent":"0.9","category":"housing"},

        {"recipient":"acquiring","percent":"1.68","minAmount":"8.4","maxAmount":"1050","category":"overhaul"},
        {"recipient":"commission","percent":"0.72","minAmount":"3.6","maxAmount":"450","category":"overhaul"}
    ]
 */

const Big = require('big.js')
const { get } = require('lodash')

const { getLogger } = require('@open-condo/keystone/logging')

const {
    FEE_DISTRIBUTION_UNSUPPORTED_FORMULA,
    FEE_DISTRIBUTION_INCOMPLETE_FORMULA,
    FEE_TOTAL_SUM_CHECK_FAILED,
    FEE_TOTAL_COMMISSION_CHECK_FAILED,
} = require('@condo/domains/acquiring/constants/errors.js')
const {
    AcquiringIntegrationContext: AcquiringIntegrationContextApi,
} = require('@condo/domains/acquiring/utils/serverSchema')


class FeeDistribution {

    formula = {}
    type = 'unknown' // can be service or commission

    minCommission = Big(0)
    maxCommission = Big(0)

    logger = getLogger()

    constructor (formula, categoryId = '') {
        const initialFormula = categoryId && (categoryId in formula) ? formula[categoryId] : formula
        const { service, commission, acquiring, organization = 0 } = initialFormula
        const resultFormula = { organization: get(organization, 'percent', 0) || organization }
        if (service) {
            this.type = 'service'
            resultFormula.fromReceiptAmountFee = get(service, 'percent', 0) || service
            resultFormula.fromTotalAmountFee = get(acquiring, 'percent', 0) || acquiring
        }
        if (commission) {
            this.type = 'commission'
            resultFormula.fromTotalAmountFee = Big('0').toFixed(2) // Commission is only from receipt amount
            resultFormula.fromReceiptAmountFee = Big(get(commission, 'percent', 0)).add(Big(get(acquiring, 'percent', 0))).toFixed(2)
            this.minCommission = Big(get(commission, 'minAmount') || '0').add(Big(get(acquiring, 'minAmount') || '0'))
            this.maxCommission = Big(get(commission, 'maxAmount') || '0').add(Big(get(acquiring, 'maxAmount') || '0'))
        }
        this.formula = Object.fromEntries(
            Object.entries(resultFormula)
                .map(([recipient, percent]) => ([recipient, Big(percent).mul(Big('0.01'))]))
        )
    }

    validateFormula () {
        if (this.type === 'unknown') {
            throw new Error(`${FEE_DISTRIBUTION_INCOMPLETE_FORMULA}] needs to have service or commission recipient`)
        }
        if (this.formula.organization && !this.formula.organization.eq(Big('0'))) {
            const difference = this.formula.organization.minus(this.formula.fromTotalAmountFee).minus(this.formula.fromReceiptAmountFee)
            if (Number(difference) < 0 ) {
                const explain = `${difference} = ${this.formula.organization.toString()} - ${this.formula.fromTotalAmountFee.toString()} - ${this.formula.fromReceiptAmountFee.toString()}`
                this.logger.error({
                    msg: `${FEE_DISTRIBUTION_UNSUPPORTED_FORMULA}]`,
                    data: { explain },
                })
                throw new Error(`${FEE_DISTRIBUTION_UNSUPPORTED_FORMULA}] ${explain}`)
            }
        }
    }

    validateDistribution (toPay) {
        const { summa, recipientSum, explicitFee, implicitFee, fromTotalAmountFee, fromReceiptAmountFee } = toPay
        const payDifference = Number(summa.minus(recipientSum).minus(explicitFee).minus(implicitFee).toFixed(2))
        if (payDifference !== 0) {
            this.logger.error({ msg: `${FEE_TOTAL_SUM_CHECK_FAILED}]`, data: { toPay } })
        }
        const commissionDifference = Math.abs(Number(explicitFee.plus(implicitFee).minus(fromReceiptAmountFee).minus(fromTotalAmountFee)))
        if (commissionDifference !== 0) {
            this.logger.error({ msg: `${FEE_TOTAL_COMMISSION_CHECK_FAILED}]`, data: { toPay } })
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
            let overSum = summa.mul(totalCommission)
            overSum = Big(Math.max(Number(overSum), 0))
            // for payments with 0 -> explicitFee will be 0, not minimum allowed
            if (!this.minCommission.eq(0) && summa.gt(0)) {
                overSum = Big(Math.max(Number(this.minCommission), Number(overSum)))
            }
            if (!this.maxCommission.eq(0)) {
                overSum = Big(Math.min(Number(this.maxCommission), Number(overSum)))
            }
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

const compactDistributionSettings  = (settings = []) => {
    return settings.reduce((allDistributions, distribution) => {
        if (distribution.category) {
            if (!allDistributions[distribution.category]) {
                allDistributions[distribution.category] = {}
            }
            const { recipient, percent = 0, minAmount = '0', maxAmount = '0' } = distribution
            allDistributions[distribution.category][recipient] = { percent, minAmount, maxAmount }
        } else {
            const { recipient, ...settings } = distribution
            allDistributions[recipient] = settings
        }
        return allDistributions
    }, {})
}


const getAcquiringIntegrationContextFormula = async (context, acquiringContextId) => {
    let {
        integration: {
            explicitFeeDistributionSchema: acquiringDistributionSchema,
        },
        implicitFeeDistributionSchema: contextDistributionSchema,
    } = await AcquiringIntegrationContextApi.getOne(
        context,
        { id: acquiringContextId },
        'integration { explicitFeeDistributionSchema { recipient percent minAmount maxAmount category } } ' +
        'implicitFeeDistributionSchema { recipient percent minAmount maxAmount category }',
    )
    if (!Array.isArray(acquiringDistributionSchema)) {
        acquiringDistributionSchema = []
    }
    if (!Array.isArray(contextDistributionSchema)) {
        contextDistributionSchema = []
    }
    return compactDistributionSettings(acquiringDistributionSchema.concat(contextDistributionSchema))
}

module.exports = {
    FeeDistribution,
    getAcquiringIntegrationContextFormula,
    compactDistributionSettings,
}