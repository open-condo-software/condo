const sum = require('lodash/sum')

const fieldMapLambda = (row, constants) => {
    const { totalCounts, address } = constants
    const statusCounts = Object.entries(row).filter(obj => obj[0] === address).map(e => e[1])
    return (sum(statusCounts) / totalCounts[address] * 100).toFixed(2) + ' %'
}

const assigneePercentSingleDataMapper = ({ row = {}, constants = {} }) => ({
    header: {
        ru: ['Ответственный', 'Адрес', 'В работе', 'Выполнена', 'Отменена', 'Отложена', 'Закрыта', 'Открыта'],
        en: ['Assignee', 'Address', 'In progress', 'Done', 'Canceled', 'Deferred', 'Closed', 'Opened'],
    },
    rows: {
        assignee: () => constants.assignee.split('@').join(''),
        address: () => constants.address.split('@').join(''),
        processing: () => fieldMapLambda(row, constants),
        completed: () => fieldMapLambda(row, constants),
        canceled: () => fieldMapLambda(row, constants),
        deferred: () => fieldMapLambda(row, constants),
        closed: () => fieldMapLambda(row, constants),
        new_or_reopened: () => fieldMapLambda(row, constants),
    },
})

module.exports = assigneePercentSingleDataMapper
