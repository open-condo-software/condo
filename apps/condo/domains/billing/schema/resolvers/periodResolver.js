const dayjs = require('dayjs')

const { ERRORS, MAX_YEARS_DIFFERENCE } = require('@condo/domains/billing/constants/registerBillingReceiptService')
const { Resolver } = require('@condo/domains/billing/schema/resolvers/resolver')

class PeriodResolver extends Resolver {
    constructor ({ billingContext, context }) {
        super(billingContext, context, { name: 'period' })
    }
    async processReceipts (receiptIndex) {
        for (const [index, receipt] of Object.entries(receiptIndex)) {
            const { month, year } = receipt
            if (!(0 <= month && month <= 12 )) {
                receiptIndex[index].error = this.error(ERRORS.WRONG_MONTH)
                continue
            }
            const currentYear = Number(dayjs().format('YYYY'))
            if (Math.abs(currentYear - year) > MAX_YEARS_DIFFERENCE ) {
                receiptIndex[index].error = this.error(ERRORS.WRONG_YEAR)
                continue
            }
            receiptIndex[index].period = dayjs().year(year).month(month - 1).format('YYYY-MM-01')
        }
        return this.result(receiptIndex)
    }
}

module.exports = {
    PeriodResolver,
}