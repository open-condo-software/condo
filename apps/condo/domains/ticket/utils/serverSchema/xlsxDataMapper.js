const xlsxDataMapper = ({ domainName, rows }) => {
    return {
        header: {
            ru: ['Адрес', 'Дата', 'В работе', 'Выполнена', 'Отменена', 'Отложена', 'Закрыта', 'Открыта'],
            en: ['Address', 'Date', 'In progress', 'Done', 'Canceled', 'Deferred', 'Closed', 'Opened'],
        },
        rows: {
            address: (row) => row.address,
            date: (row) => row.date,
            processing: (row) => row.processing,
            completed: (row) => row.completed,
            canceled: (row) => row.canceled,
            deferred: (row) => row.deferred,
            closed: (row) => row.closed,
            new_or_reopened: (row) => row.new_or_reopened,
        },
    }
}

module.exports = xlsxDataMapper
