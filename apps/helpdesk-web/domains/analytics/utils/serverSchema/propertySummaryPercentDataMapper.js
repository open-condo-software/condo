const sum = require('lodash/sum')

const getFieldPercentSummaryValue = (row, constants) => {
    const { totalCount } = constants
    const statusCounts = Object.values(row)
    return (sum(statusCounts) / totalCount * 100).toFixed(2) + ' %'
}

const propertySummaryPercentDataMapper = ({ row = {}, constants = {} }) => ({
    header: {
        ru: ['Адрес', 'В работе', 'Выполнена', 'Отменена', 'Отложена', 'Закрыта', 'Открыта'],
        en: ['Address', 'In progress', 'Done', 'Canceled', 'Deferred', 'Closed', 'Opened'],
    },
    rows: {
        address: () => constants.address.split('@').join(''),
        processing: () => getFieldPercentSummaryValue(row, constants),
        completed: () => getFieldPercentSummaryValue(row, constants),
        canceled: () => getFieldPercentSummaryValue(row, constants),
        deferred: () => getFieldPercentSummaryValue(row, constants),
        closed: () => getFieldPercentSummaryValue(row, constants),
        new_or_reopened: () => getFieldPercentSummaryValue(row, constants),
    },
})

module.exports = propertySummaryPercentDataMapper
