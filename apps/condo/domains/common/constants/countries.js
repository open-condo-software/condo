const RU_COUNTRY = {
    adminRoleName: 'Администратор',
    phonePattern: /^[+]?[0-9-. ()]{7,}[0-9]$/gi,
}

const EN_COUNTRY = {
    adminRoleName: 'Admin',
}

const COUNTRIES = ['ru', 'us']


module.exports = {
    COUNTRIES,
    ru: RU_COUNTRY,
    en: EN_COUNTRY,
}
