const sum = require('lodash/sum')
const fieldMapLambda = (row, constants) => {
    const { totalCount } = constants
    const statusCounts = Object.values(row)
    return (sum(statusCounts) / totalCount * 100).toFixed(2) + ' %'
}

const executorPercentSummaryDataMapper = ({ row = {}, constants = {} }) => ({
    header: {
        ru: ['Исполнитель', 'Адрес', 'В работе', 'Выполнена', 'Отменена', 'Отложена', 'Закрыта', 'Открыта'],
        en: ['Executor', 'Address', 'In progress', 'Done', 'Canceled', 'Deferred', 'Closed', 'Opened'],
    },
    rows: {
        executor: () => constants.executor.split('@').join(''),
        address: () => constants.address.split('@').join(''),
        processing: () => fieldMapLambda(row, constants),
        completed: () => fieldMapLambda(row, constants),
        canceled: () => fieldMapLambda(row, constants),
        deferred: () => fieldMapLambda(row, constants),
        closed: () => fieldMapLambda(row, constants),
        new_or_reopened: () => fieldMapLambda(row, constants),
    },
})

module.exports = executorPercentSummaryDataMapper
