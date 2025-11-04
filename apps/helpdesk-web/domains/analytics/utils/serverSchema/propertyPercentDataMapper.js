const sum = require('lodash/sum')

const getFieldPercentValue = (row, constants) => {
    const { totalCounts, address } = constants
    const statusCounts = Object.entries(row).filter(obj => obj[0] === address).map(e => e[1])
    return (sum(statusCounts) / totalCounts[address] * 100).toFixed(2) + ' %'
}

const propertyPercentDataMapper = ({ row = {}, constants = {} }) => ({
    header: {
        ru: ['Адрес', 'В работе', 'Выполнена', 'Отменена', 'Отложена', 'Закрыта', 'Открыта'],
        en: ['Address', 'In progress', 'Done', 'Canceled', 'Deferred', 'Closed', 'Opened'],
    },
    rows: {
        address: () => constants.address.split('@').join(''),
        processing: () => getFieldPercentValue(row, constants),
        completed: () => getFieldPercentValue(row, constants),
        canceled: () => getFieldPercentValue(row, constants),
        deferred: () => getFieldPercentValue(row, constants),
        closed: () => getFieldPercentValue(row, constants),
        new_or_reopened: () => getFieldPercentValue(row, constants),
    },
})

module.exports = propertyPercentDataMapper
