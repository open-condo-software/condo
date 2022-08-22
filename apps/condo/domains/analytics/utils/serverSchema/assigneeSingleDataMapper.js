const sum = require('lodash/sum')

const assigneeSingleDataMapper = ({ row = {}, constants = {} }) => ({
    header: {
        ru: ['Ответственный', 'Адрес', 'В работе', 'Выполнена', 'Отменена', 'Отложена', 'Закрыта', 'Открыта'],
        en: ['Assignee', 'Address', 'In progress', 'Done', 'Canceled', 'Deferred', 'Closed', 'Opened'],
    },
    rows: {
        assignee: () => constants.assignee,
        address: () => constants.address,
        processing: () => sum(
            Object.entries(row).filter(rowEntry => rowEntry[0] === constants.assignee).map(value => value[1])
        ),
        completed: () => sum(
            Object.entries(row).filter(rowEntry => rowEntry[0] === constants.assignee).map(value => value[1])
        ),
        canceled: () => sum(
            Object.entries(row).filter(rowEntry => rowEntry[0] === constants.assignee).map(value => value[1])
        ),
        deferred: () => sum(
            Object.entries(row).filter(rowEntry => rowEntry[0] === constants.assignee).map(value => value[1])
        ),
        closed: () => sum(
            Object.entries(row).filter(rowEntry => rowEntry[0] === constants.assignee).map(value => value[1])
        ),
        new_or_reopened: () => sum(
            Object.entries(row).filter(rowEntry => rowEntry[0] === constants.assignee).map(value => value[1])
        ),
    },
})

module.exports = assigneeSingleDataMapper
