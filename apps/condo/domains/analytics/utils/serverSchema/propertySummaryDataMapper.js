const sum = require('lodash/sum')
const fieldMapLambda = (aggregatedData) => sum(Object.values(aggregatedData))

const propertySummaryDataMapper = ({ row = {}, constants = {} }) => ({
    header: {
        ru: ['Адрес', 'В работе', 'Выполнена', 'Отменена', 'Отложена', 'Закрыта', 'Открыта'],
        en: ['Address', 'In progress', 'Done', 'Canceled', 'Deferred', 'Closed', 'Opened'],
    },
    rows: {
        address: () => constants.address.split('@').join(''),
        processing: () => fieldMapLambda(row),
        completed: () => fieldMapLambda(row),
        canceled: () => fieldMapLambda(row),
        deferred: () => fieldMapLambda(row),
        closed: () => fieldMapLambda(row),
        new_or_reopened: () => fieldMapLambda(row),
    },
})

module.exports = propertySummaryDataMapper
