const dayjs = require('dayjs')

const { createStageContext } = require('@condo/domains/billing/schema/resolvers/resolver')

function resolvePeriods (receiptIndex, { context }) {
    const stage = createStageContext({ name: 'period', context })
    for (const [index, receipt] of Object.entries(receiptIndex)) {
        const { month, year } = receipt
        receiptIndex[index].period = dayjs().year(year).month(month - 1).format('YYYY-MM-01')
    }
    return stage.result(receiptIndex)
}

module.exports = {
    resolvePeriods,
}
