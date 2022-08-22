const sum = require('lodash/sum')

const executorSingleDataMapper = ({ row = {}, constants = {} }) => ({
    header: {
        ru: ['Исполнитель', 'Адрес', 'В работе', 'Выполнена', 'Отменена', 'Отложена', 'Закрыта', 'Открыта'],
        en: ['Executor', 'Address', 'In progress', 'Done', 'Canceled', 'Deferred', 'Closed', 'Opened'],
    },
    rows: {
        executor: () => constants.executor,
        address: () => constants.address,
        processing: () => sum(
            Object.entries(row).filter(rowEntry => rowEntry[0] === constants.executor).map(value => value[1])
        ),
        completed: () => sum(
            Object.entries(row).filter(rowEntry => rowEntry[0] === constants.executor).map(value => value[1])
        ),
        canceled: () => sum(
            Object.entries(row).filter(rowEntry => rowEntry[0] === constants.executor).map(value => value[1])
        ),
        deferred: () => sum(
            Object.entries(row).filter(rowEntry => rowEntry[0] === constants.executor).map(value => value[1])
        ),
        closed: () => sum(
            Object.entries(row).filter(rowEntry => rowEntry[0] === constants.executor).map(value => value[1])
        ),
        new_or_reopened: () => sum(
            Object.entries(row).filter(rowEntry => rowEntry[0] === constants.executor).map(value => value[1])
        ),
    },
})

module.exports = executorSingleDataMapper
