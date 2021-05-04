const { RU_LOCALE, EN_LOCALE } = require('./locale')

const DEFAULT_ENGLISH_COUNTRY = 'en'
const RUSSIA_COUNTRY = 'ru'
const COUNTRIES = {
    [DEFAULT_ENGLISH_COUNTRY]: {
        adminRoleName: 'Admin',
        // statusTransitions: {},  // TODO(pahaz): write logic for transitions
        phonePattern: /^[+]1[0-9-. ()]{7,}[0-9]$/gi,
        locale: EN_LOCALE,
    },
    [RUSSIA_COUNTRY]: {
        adminRoleName: 'Администратор',
        // statusTransitions: {},  // TODO(pahaz): write logic for transitions
        phonePattern: /^[+]?[0-9-. ()]{7,}[0-9]$/gi,
        locale: RU_LOCALE,
    },
}

module.exports = {
    DEFAULT_ENGLISH_COUNTRY, RUSSIA_COUNTRY,
    COUNTRIES,
}
