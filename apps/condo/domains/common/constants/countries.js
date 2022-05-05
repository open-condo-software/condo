const { RU_LOCALE, EN_LOCALE, DEFAULT_LOCALE } = require('./locale')

const DEFAULT_ENGLISH_COUNTRY = 'en'
const RUSSIA_COUNTRY = 'ru'

const COUNTRIES = {
    [DEFAULT_ENGLISH_COUNTRY]: {
        'role.admin.name': 'Admin',
        'role.dispatcher.name': 'Dispatcher',
        'role.manager.name': 'Manager',
        'role.foreman.name': 'Foreman',
        'role.technician.name' : 'Technician',
        // statusTransitions: {},  // TODO(pahaz): write logic for transitions
        phonePattern: /^[+]1[0-9-. ()]{7,}[0-9]$/gi,
        locale: EN_LOCALE,
    },
    [RUSSIA_COUNTRY]: {
        'role.admin.name': 'Администратор',
        'role.dispatcher.name': 'Диспетчер',
        'role.manager.name': 'Управляющий',
        'role.foreman.name': 'Мастер участка',
        'role.technician.name' : 'Техник',
        // statusTransitions: {},  // TODO(pahaz): write logic for transitions
        phonePattern: /^[+]?[0-9-. ()]{7,}[0-9]$/gi,
        locale: RU_LOCALE,
    },
}

module.exports = {
    DEFAULT_ENGLISH_COUNTRY,
    RUSSIA_COUNTRY,
    COUNTRIES,
    DEFAULT_LOCALE,
    EN_LOCALE,
    RU_LOCALE,
}
