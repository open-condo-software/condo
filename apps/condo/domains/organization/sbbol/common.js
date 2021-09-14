const Ajv = require('ajv')
const SBBOL_IMPORT_NAME = 'sbbol'
const SBBOL_SESSION_KEY = 'sbbol'

const EXAMPLE_USER_INFO = {
    sub: 'f164e8c81fa7b5cd43d5d03164cf74764b2402d6314c67daa0964d8e691fd543',
    iss: 'https://edupirfintech.sberbank.ru:9443',
    inn: '7784523718',
    orgJuridicalAddress: '121222, Россия, г.Москва, г. Москва, ул.Космонавтов, д.1, корп./стр.1, кв.1',
    orgFullName: 'Общество с ограниченной ответственностью ТО-Партнер-626-01"',
    OrgName: 'ООО "ТО-Партнер-626-01"',
    tbIdentCode: '38',
    userGuid: 'c429a86d-38fc-3ac3-e054-00144ffb59b5',
    individualExecutiveAgency: 0,
    terBank: 'Московский Банк Сбербанка РФ',
    userSignatureType: 'Единственная подпись',
    aud: '111286',
    userCryptoType: 'SMS',
    userGroups: 'Руководитель',
    summOfferSmartCredit: 0,
    orgLawFormShort: 'ООО',
    HashOrgId: '8c80ef870028888bc444c27ba90873619cc7a6c99febd89f0e9fee155219b752',
    offerSmartCredit: false,
    orgOgrn: '1137746216261',
    isIdentified: false,
    inquiryOrder: true,
    phone_number: '79057362611',
    orgLawForm: 'Общество с ограниченной ответственностью',
    email: 'Client_Test62611@test.ru',
}

const SbbolUserInfoSchema = {
    type: 'object',
    properties: {
        // Organization's field
        OrgName: { type: 'string' },
        orgOgrn: { type: 'string' },
        orgLawFormShort: { type: 'string' },
        // Organization's meta fields
        inn: { type: 'string' },
        orgKpp: { type: 'string' },
        orgJuridicalAddress: { type: 'string' },
        orgFullName: { type: 'string' },
        terBank: { type: 'string' },
        // Organization's admin user fields
        userGuid: { type: 'string' },
        email: { type: 'string' },
        phone_number: { type: 'string' },
    },
    required: ['inn', 'OrgName', 'orgJuridicalAddress', 'email', 'userGuid', 'phone_number'],
    additionalProperties: true,
}

const SbbolUserInfoJSONValidation = new Ajv().compile(SbbolUserInfoSchema)

module.exports = {
    SbbolUserInfoJSONValidation,
    SBBOL_IMPORT_NAME,
    SBBOL_SESSION_KEY,
    EXAMPLE_USER_INFO,
}