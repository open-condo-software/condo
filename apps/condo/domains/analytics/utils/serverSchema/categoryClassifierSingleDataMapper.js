const sum = require('lodash/sum')

const categoryClassifierSingleDataMapper = ({ row = {}, constants = {} }) => ({
    header: {
        ru: ['Категория', 'Адрес', 'В работе', 'Выполнена', 'Отменена', 'Отложена', 'Закрыта', 'Открыта'],
        en: ['Category', 'Address', 'In progress', 'Done', 'Canceled', 'Deferred', 'Closed', 'Opened'],
    },
    rows: {
        categoryClassifier: () => constants.categoryClassifier,
        address: () => constants.address,
        processing: () => sum(
            Object.entries(row).filter(rowEntry => rowEntry[0] === constants.categoryClassifier).map(value => value[1])
        ),
        completed: () => sum(
            Object.entries(row).filter(rowEntry => rowEntry[0] === constants.categoryClassifier).map(value => value[1])
        ),
        canceled: () => sum(
            Object.entries(row).filter(rowEntry => rowEntry[0] === constants.categoryClassifier).map(value => value[1])
        ),
        deferred: () => sum(
            Object.entries(row).filter(rowEntry => rowEntry[0] === constants.categoryClassifier).map(value => value[1])
        ),
        closed: () => sum(
            Object.entries(row).filter(rowEntry => rowEntry[0] === constants.categoryClassifier).map(value => value[1])
        ),
        new_or_reopened: () => sum(
            Object.entries(row).filter(rowEntry => rowEntry[0] === constants.categoryClassifier).map(value => value[1])
        ),
    },
})

module.exports = categoryClassifierSingleDataMapper
