const sum = require('lodash/sum')
const fieldMapLambda = (aggregatedData) => sum(Object.values(aggregatedData))

const categoryClassifierSummaryDataMapper = ({ row = {}, constants = {} }) => ({
    header: {
        ru: ['Категория', 'Адрес', 'В работе', 'Выполнена', 'Отменена', 'Отложена', 'Закрыта', 'Открыта'],
        en: ['Category', 'Address', 'In progress', 'Done', 'Canceled', 'Deferred', 'Closed', 'Opened'],
    },
    rows: {
        categoryClassifier: () => constants.categoryClassifier.split('@').join(''),
        address: () => constants.address.split('@').join(''),
        processing: () => fieldMapLambda(row),
        completed: () => fieldMapLambda(row),
        canceled: () => fieldMapLambda(row),
        deferred: () => fieldMapLambda(row),
        closed: () => fieldMapLambda(row),
        new_or_reopened: () => fieldMapLambda(row),
    },
})

module.exports = categoryClassifierSummaryDataMapper
