const dayjs = require('dayjs')

const { ERRORS } = require('@condo/domains/billing/constants/registerBillingReceiptService')
const { createStageContext } = require('@condo/domains/billing/schema/resolvers/resolver')
const { isValidBillingYear } = require('@condo/domains/billing/schema/resolvers/utils')

function resolvePeriods (receiptIndex, { context }) {
    const stage = createStageContext({ name: 'period', context })
    for (const [index, receipt] of Object.entries(receiptIndex)) {
        const { month, year } = receipt
        if (!(1 <= month && month <= 12 )) {
            receiptIndex[index].error = stage.error(ERRORS.WRONG_MONTH, index)
            continue
        }
        if (!isValidBillingYear(year)) {
            receiptIndex[index].error = stage.error(ERRORS.WRONG_YEAR, index)
            continue
        }
        receiptIndex[index].period = dayjs().year(year).month(month - 1).format('YYYY-MM-01')
    }
    return stage.result(receiptIndex)
}

module.exports = {
    resolvePeriods,
}
