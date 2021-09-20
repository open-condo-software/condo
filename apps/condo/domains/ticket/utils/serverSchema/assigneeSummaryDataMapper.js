const sum = require('lodash/sum')
const fieldMapLambda = (aggregatedData) => sum(Object.values(aggregatedData))

const assigneeSummaryDataMapper = ({ row = {}, constants = {} }) => ({
    header: {
        ru: ['Ответственный', 'Адрес', 'В работе', 'Выполнена', 'Отменена', 'Отложена', 'Закрыта', 'Открыта'],
        en: ['Assignee', 'Address', 'In progress', 'Done', 'Canceled', 'Deferred', 'Closed', 'Opened'],
    },
    rows: {
        assignee: () => constants.assignee.split('@').join(''),
        address: () => constants.address.split('@').join(''),
        processing: () => fieldMapLambda(row),
        completed: () => fieldMapLambda(row),
        canceled: () => fieldMapLambda(row),
        deferred: () => fieldMapLambda(row),
        closed: () => fieldMapLambda(row),
        new_or_reopened: () => fieldMapLambda(row),
    },
})

module.exports = assigneeSummaryDataMapper
