const faker = require('faker')
const { v4: uuid } = require('uuid')
const { TIN_LENGTH } = require('@condo/domains/organization/constants/common')
const { SBBOL_IMPORT_NAME } = require('@condo/domains/organization/integrations/sbbol/common')
const { RUSSIA_COUNTRY } = require('@condo/domains/common/constants/countries.js')

const EXAMPLE_USER_INFO = {
    sub: 'f164e8c81fa7b5cd43d5d03164cf74764b2402d6314c67daa0964d8e691fd543',
    iss: 'https://edupirfintech.sberbank.ru:9443',
    inn: '7784523718',
    orgJuridicalAddress: '121222, Россия, г.Москва, г. Москва, ул.Космонавтов, д.1, корп./стр.1, кв.1',
    orgFullName: 'Общество с ограниченной ответственностью ТО-Партнер-626-01"',
    OrgName: 'ООО "ТО-Партнер-626-01"',
    userGuid: 'c429a86d-38fc-3ac3-e054-00144ffb59b5',
    individualExecutiveAgency: 0,
    terBank: 'Московский Банк Сбербанка РФ',
    userSignatureType: 'Единственная подпись',
    aud: '111286',
    userCryptoType: 'SMS',
    userGroups: 'Руководитель',
    orgLawFormShort: 'ООО',
    HashOrgId: '8c80ef870028888bc444c27ba90873619cc7a6c99febd89f0e9fee155219b752',
    orgOgrn: '1137746216261',
    isIdentified: false,
    inquiryOrder: true,
    phone_number: '+79057362611',
    orgLawForm: 'Общество с ограниченной ответственностью',
    accounts: [
        {
            corrAccountNumber: '30101810400000000225',
            accountNumber: '40702810538833411733',
            bic: '044525225',
        },
        {
            corrAccountNumber: '30101810400000000225',
            accountNumber: '40702810738203653934',
            bic: '044525225',
        },
        {
            corrAccountNumber: '30101810400000000225',
            accountNumber: '40702840238454404334',
            bic: '044525225',
        },
        {
            corrAccountNumber: '30101810400000000225',
            accountNumber: '40702840738350644756',
            bic: '044525225',
        },
    ],
    email: 'Client_Test62611@test.ru',
}
const EXAMPLE_TOKEN_SET = {
    scope: 'openid PAYROLL name',
    access_token: 'c76fb018-27c9-43f7-a751-62646eda7e1a-1',
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: '03e0be32-e72e-47ec-b740-a00b333a8ac4-1',
    id_token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJnb3N0MzQuMTAtMjAxMiJ9.eyJzdWIiOiI2ODM4ZjM1MmI0YzQ0YjZjOGFmYTY0ZTFlZDJmNjg1NzM0MjE4NDAwNjZiZTU3MTgxZjNiN2IyYjc1NThkYmJlIiwiYXVkIjoiMTAwMTMiLCJhY3IiOiJsb2EtMyIsImF6cCI6IjEwMDEzIiwiYXV0aF90aW1lIjoxNTgyMzcwNDk5LCJhbXIiOiJ7cHdkLCBtY2EsIG1mYSwgb3RwLCBzbXN9IiwiaXNzIjoiaHR0cDovL3NidC1vYWZzLTYzODo5MDgwL2ljZGsiLCJleHAiOjE1ODIzNzA4MDEsImlhdCI6MTU4MjM3MDUwMSwibm9uY2UiOiI3YmU2NmFjOS1kMDdjLTQ5NjctYWRlZC1jYTI3MGEyN2U5ZTgiLCJ1c2wiOiJQYXJ0bmVyMzMyMiJ9.IWCyZzOk5nT0GWfhi9n3Nqy8Ii8mJ1eeFS7YRoE-l74lqo6BLksCuaVXt2ErMZYmDyyZscu7ISm0n-YsSrgZPQ',
}

class MockSbbolResponses {

    static generateInn () {
        const rnd = () => faker.datatype.number({
            min: 1,
            max: 9,
        })
        const innBase = [rnd(), rnd(), rnd(), rnd(), rnd(), rnd(), rnd(), rnd(), rnd()]

        const RU_TIN_DIGITS = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8, 0]
        const n = RU_TIN_DIGITS.slice(-10)
        let sum = 0

        for (let i = 0; i < innBase.length; i++) sum += innBase[i] * n[i]

        const baseRest = sum % 11 % 10
        innBase.push(baseRest)

        return parseInt(innBase.join(''))
    }

    static getUserInfo () {
        const inn = MockSbbolResponses.generateInn()
        return {
            ...EXAMPLE_USER_INFO,
            inn,
            phone_number: faker.phone.phoneNumber('+792########'),
            email: faker.internet.email(),
            HashOrgId: uuid(),
            userGuid: uuid(),
        }
    }

    static getUserAndOrganizationInfo () {
        const userInfo = MockSbbolResponses.getUserInfo()
        if (!userInfo.phone_number.startsWith('+')) {
            userInfo.phone_number = `+${userInfo.phone_number}`
        }
        const dvSenderFields = {
            dv: 1,
            sender: { dv: 1, fingerprint: `test-${SBBOL_IMPORT_NAME}` },
        }
        const organizationData = {
            ...dvSenderFields,
            name: userInfo.OrgName,
            country: RUSSIA_COUNTRY,
            meta: {
                inn: userInfo.inn,
                kpp: userInfo.orgKpp,
                ogrn: userInfo.orgOgrn,
                address: userInfo.orgJuridicalAddress,
                fullname: userInfo.orgFullName,
                bank: userInfo.terBank,
            },
            importRemoteSystem: SBBOL_IMPORT_NAME,
            importId: userInfo.HashOrgId,
        }
        const userData = {
            ...dvSenderFields,
            name: userInfo.OrgName,
            importId: userInfo.userGuid,
            importRemoteSystem: SBBOL_IMPORT_NAME,
            email: userInfo.email,
            phone: userInfo.phone_number,
            isPhoneVerified: true,
            isEmailVerified: true,
            password: faker.internet.password(),
        }
        return { organizationData, userData, dvSenderFields }
    }

    static getTokenSet () {
        return {
            ...EXAMPLE_TOKEN_SET,
            access_token: uuid(),
            refresh_token: uuid(),
        }
    }
}

module.exports = {
    MockSbbolResponses,
}