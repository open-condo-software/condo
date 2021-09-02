const dayGroupDataMapper = ({ row = {}, constants = {} }) => ({
    header: {
        ru: ['Адрес', 'Дата', 'В работе', 'Выполнена', 'Отменена', 'Отложена', 'Закрыта', 'Открыта'],
        en: ['Address', 'Date', 'In progress', 'Done', 'Canceled', 'Deferred', 'Closed', 'Opened'],
    },
    rows: {
        address: () => constants.address.split('@').join(''),
        date: () => constants.date,
        processing: () => row.processing[constants.date],
        completed: () => row.completed[constants.date],
        canceled: () => row.canceled[constants.date],
        deferred: () => row.deferred[constants.date],
        closed: () => row.closed[constants.date],
        new_or_reopened: () => row.new_or_reopened[constants.date],
    },
})

module.exports = dayGroupDataMapper
