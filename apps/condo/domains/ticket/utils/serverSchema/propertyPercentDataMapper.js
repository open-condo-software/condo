const sum = require('lodash/sum')

const propertyPercentDataMapper = ({ row = {}, constants = {} }) => ({
    header: {
        ru: ['Адрес', 'В работе', 'Выполнена', 'Отменена', 'Отложена', 'Закрыта', 'Открыта'],
        en: ['Address', 'In progress', 'Done', 'Canceled', 'Deferred', 'Closed', 'Opened'],
    },
    rows: {
        address: () => constants.address.split('@').join(''),
        processing: () => `${row.processing} %`,
        completed: () => `${row.completed} %`,
        canceled: () => `${row.canceled} %`,
        deferred: () => `${row.deferred} %`,
        closed: () => `${row.closed} %`,
        new_or_reopened: () => row.new_or_reopened,
    },
})

module.exports = propertyPercentDataMapper
