const { faker } = require('@faker-js/faker')
const pickBy = require('lodash/pickBy')

const { generateUUIDv4 } = require('@open-condo/miniapp-utils')

const { RUSSIA_COUNTRY } = require('@condo/domains/common/constants/countries.js')
const { SBBOL_IMPORT_NAME } = require('@condo/domains/organization/integrations/sbbol/constants')
const { generateTin } = require('@condo/domains/organization/utils/testSchema')

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

const EXAMPLE_GET_CLIENT_INFO = {
    shortName: 'ООО "ТО-Партнер-661-01"',
    fullName: 'Общество с ограниченной ответственностью ТО-Партнер-661-01"',
    ogrn: '1137746216611',
    inn: '7776343373',
    orgForm: 'Общество с ограниченной ответственностью',
    addresses: [
        {
            type: 'Юридический',
            country: '643',
            zip: '141282',
            region: 'Россия',
            area: null,
            city: 'Москва',
            settlementType: 'г.',
            settlement: 'Москва',
            street: 'Московская',
            house: '123',
            building: '321',
            flat: '333',
            fullAddress: '121222, Россия, г.Москва, г. Москва, ул.Космонавтов, д.1, корп./стр.1, кв.1',
            comment: null,
        },
    ],
    accounts: [
        {
            number: '40702810638155352218',
            name: 'ООО "ТО-Партнер-661-01"',
            currencyCode: '810',
            bic: '044525225',
            type: 'calculated',
            passive: true,
            openDate: '2000-02-01',
            closeDate: null,
            state: 'OPEN',
            mode: 'STANDART',
            dbo: true,
            business: false,
            businessNewType: false,
            notDelay: false,
            urgent: false,
            minBalance: null,
            overdraft: null,
            comment: null,
            cdiPermDocQnt: null,
            cdiPermDocSum: null,
            cdiAcptDocQnt: null,
            cdiAcptDocSum: null,
            cdiCart2DocQnt: null,
            cdiCart2DocSum: null,
            debitBlocked: false,
            debitBlockedCause: null,
            debitBlockedInitiator: null,
            debitBlockedTaxAuthorityCode: null,
            debitBlockedBeginDate: null,
            debitBlockedEndDate: null,
            creditBlocked: false,
            creditBlockedCause: null,
            creditBlockedInitiator: null,
            creditBlockedTaxAuthorityCode: null,
            creditBlockedBeginDate: null,
            creditBlockedEndDate: null,
            blockedSums: [],
            blockedQueuesInfo: [],
            blockedSumQueuesInfo: [],
        },
        {
            number: '40702810338837867402',
            name: 'ООО "ТО-Партнер-661-01"',
            currencyCode: '810',
            bic: '044525225',
            type: 'calculated',
            passive: true,
            openDate: '2000-02-01',
            closeDate: null,
            state: 'OPEN',
            mode: 'STANDART',
            dbo: true,
            business: false,
            businessNewType: false,
            notDelay: false,
            urgent: false,
            minBalance: null,
            overdraft: null,
            comment: null,
            cdiPermDocQnt: null,
            cdiPermDocSum: null,
            cdiAcptDocQnt: null,
            cdiAcptDocSum: null,
            cdiCart2DocQnt: null,
            cdiCart2DocSum: null,
            debitBlocked: false,
            debitBlockedCause: null,
            debitBlockedInitiator: null,
            debitBlockedTaxAuthorityCode: null,
            debitBlockedBeginDate: null,
            debitBlockedEndDate: null,
            creditBlocked: false,
            creditBlockedCause: null,
            creditBlockedInitiator: null,
            creditBlockedTaxAuthorityCode: null,
            creditBlockedBeginDate: null,
            creditBlockedEndDate: null,
            blockedSums: [],
            blockedQueuesInfo: [],
            blockedSumQueuesInfo: [],
        },
    ],
}

// just a mocked fake data for test purposes
const EXAMPLE_TOKEN_SET = {
    scope: 'openid PAYROLL name',
    // nosemgrep: generic.secrets.gitleaks.generic-api-key.generic-api-key
    access_token: 'c76fb018-27c9-43f7-a751-62646eda7e1a-1',
    token_type: 'Bearer',
    expires_in: 3600,
    // nosemgrep: generic.secrets.gitleaks.generic-api-key.generic-api-key
    refresh_token: '03e0be32-e72e-47ec-b740-a00b333a8ac4-1',
    // nosemgrep
    id_token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJnb3N0MzQuMTAtMjAxMiJ9.eyJzdWIiOiI2ODM4ZjM1MmI0YzQ0YjZjOGFmYTY0ZTFlZDJmNjg1NzM0MjE4NDAwNjZiZTU3MTgxZjNiN2IyYjc1NThkYmJlIiwiYXVkIjoiMTAwMTMiLCJhY3IiOiJsb2EtMyIsImF6cCI6IjEwMDEzIiwiYXV0aF90aW1lIjoxNTgyMzcwNDk5LCJhbXIiOiJ7cHdkLCBtY2EsIG1mYSwgb3RwLCBzbXN9IiwiaXNzIjoiaHR0cDovL3NidC1vYWZzLTYzODo5MDgwL2ljZGsiLCJleHAiOjE1ODIzNzA4MDEsImlhdCI6MTU4MjM3MDUwMSwibm9uY2UiOiI3YmU2NmFjOS1kMDdjLTQ5NjctYWRlZC1jYTI3MGEyN2U5ZTgiLCJ1c2wiOiJQYXJ0bmVyMzMyMiJ9.IWCyZzOk5nT0GWfhi9n3Nqy8Ii8mJ1eeFS7YRoE-l74lqo6BLksCuaVXt2ErMZYmDyyZscu7ISm0n-YsSrgZPQ',
}

const EXAMPLE_TRANSACTION = {
    'transactionId': 3986693,
    'uuid': '169d9043-3a1f-330d-a566-c261a64d5891', // should be unique across multiple transaction example records
    'operationDate': '2022-11-08T00:00:00',
    'number': '42', // should be unique across multiple transaction example records
    'operationCode': '01',
    'amount': {
        'amount': 1.00,
        'currencyName': 'RUB',
    },
    'amountRub': {
        'amount': 1.00,
        'currencyName': 'RUB',
    },
    'paymentPurpose': 'кредит',
    'priority': '3',
    'direction': 'CREDIT',
    'documentDate': '2022-11-08',
    'filial': null,
    'revaln': null,
    'correspondingAccount': '40702810355898603683',
    'swiftTransfer': null,
    'curTransfer': null,
    'rurTransfer': {
        'payerAccount': '40702810355898603683',
        'payerName': 'Общий ответ',
        'payerInn': '7721662525',
        'payerKpp': '770701001',
        'payerBankName': 'СЕВЕРО-ЗАПАДНЫЙ БАНК ПАО СБЕРБАНК, Г. Санкт-Петербург',
        'payerBankBic': '044030653',
        'payerBankCorrAccount': '30101810500000000653',
        'payeeAccount': '40702810240720307170',
        'payeeName': 'Общий ответ',
        'payeeInn': '7774358617',
        'payeeKpp': '111111111',
        'payeeBankName': 'ПАО СБЕРБАНК, Г. Москва',
        'payeeBankBic': '044525225',
        'payeeBankCorrAccount': '30101810400000000225',
        'receiptDate': '2022-11-08',
        'valueDate': '2022-11-08',
        'deliveryKind': '0',
        'payingCondition': null,
        'departmentalInfo': {
            'uip': '0',
            'drawerStatus101': null,
            'kbk': null,
            'oktmo': null,
            'reasonCode106': null,
            'taxPeriod107': null,
            'docNumber108': null,
            'docDate109': null,
            'paymentKind110': null,
        },
        'cartInfo': null,
        'purposeCode': '1',
    },
}

const EXAMPLE_SUMMARY = {
    composedDateTime: '2023-03-30T00:00:00',
    lastMovementDate: '2017-08-17',
    openingRate: null,
    openingBalance: { amount: '100.10', currencyName: 'RUB' },
    openingBalanceRub: { amount: '100.10', currencyName: 'RUB' },
    closingBalance: { amount: '100.10', currencyName: 'RUB' },
    closingBalanceRub: { amount: '100.10', currencyName: 'RUB' },
    debitTurnover: { amount: '616147.76', currencyName: 'RUB' },
    debitTurnoverRub: { amount: '616147.76', currencyName: 'RUB' },
    debitTransactionsNumber: 15,
    creditTurnover: { amount: '616147.76', currencyName: 'RUB' },
    creditTurnoverRub: { amount: '616147.76', currencyName: 'RUB' },
    creditTransactionsNumber: 15,
}

class MockSbbolResponses {
    static getUserInfo () {
        const inn = generateTin(RUSSIA_COUNTRY)
        return {
            ...EXAMPLE_USER_INFO,
            inn,
            phone_number: faker.phone.number('+792########'),
            email: faker.internet.email(),
            HashOrgId: generateUUIDv4(),
            userGuid: generateUUIDv4(),
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
            access_token: generateUUIDv4(),
            refresh_token: generateUUIDv4(),
        }
    }

    static getClientInfo (tin, accountNumber1, accountNumber2, routingNumber) {
        return {
            ...EXAMPLE_GET_CLIENT_INFO,
            inn: tin,
            accounts: [
                ...EXAMPLE_GET_CLIENT_INFO.accounts.map((account, index) => {
                    if (accountNumber1 && index === 0) return {
                        ...account,
                        number: accountNumber1,
                        bic: routingNumber,
                    }
                    if (accountNumber2 && index === 1) return {
                        ...account,
                        number: accountNumber2,
                        bic: routingNumber,
                    }
                }),
            ],
        }
    }

    static getStatementTransactions () {
        return Array(5).fill(EXAMPLE_TRANSACTION).map( transaction => {
            const clonedTransaction = pickBy(transaction)
            clonedTransaction.number = faker.datatype.number(1000000).toString()
            clonedTransaction.uuid = generateUUIDv4()
            return clonedTransaction
        })
    }

    static getStatementSummary () {
        return EXAMPLE_SUMMARY
    }

}

module.exports = {
    MockSbbolResponses,
}
