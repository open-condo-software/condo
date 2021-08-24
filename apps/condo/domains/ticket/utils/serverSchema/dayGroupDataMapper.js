const dayGroupDataMapper = ({ row = {}, constants = {} }) => {
    const { date, address } = constants
    return {
        header: {
            ru: ['Адрес', 'Дата', 'В работе', 'Выполнена', 'Отменена', 'Отложена', 'Закрыта', 'Открыта'],
            en: ['Address', 'Date', 'In progress', 'Done', 'Canceled', 'Deferred', 'Closed', 'Opened'],
        },
        rows: {
            address: () => address.replaceAll('@', ''),
            date: () => date,
            processing: () => row.processing[date],
            completed: () => row.completed[date],
            canceled: () => row.canceled[date],
            deferred: () => row.deferred[date],
            closed: () => row.closed[date],
            new_or_reopened: () => row.new_or_reopened[date],
        },
    }
}
module.exports = dayGroupDataMapper
