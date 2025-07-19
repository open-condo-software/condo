import { faker } from '@faker-js/faker/locale/ru'
import http from 'k6/http'

import { buildFakeAddressAndMeta } from '../../domains/property/utils/testSchema/factories'
import { MIN_PASSWORD_LENGTH } from '@condo/domains/user/constants/common'

const BASE_API_URL = __ENV.BASE_URL + '/admin/api'
const AUTH_REQS = { email: __ENV.AUTH_EMAIL, password: __ENV.AUTH_PASSWORD }
const DV_SENDER = { dv: 1, sender: { dv: 1, fingerprint: 'k6-load-test' } }

const setupCondoAuth = () => {
    const payload = {
        operationName: null,
        variables: {},
        query: `mutation {authenticateUserWithPassword(email: "${AUTH_REQS.email}" password: "${AUTH_REQS.password}") {token}}`,
    }

    const response = http.post(BASE_API_URL, JSON.stringify(payload), { headers: { 'Content-Type': 'application/json' } })
    const token = response.json('data.authenticateUserWithPassword.token')

    return {
        token,
        cookie: response.cookies['keystone.sid'][0]['value'],
    }
}

const sendAuthorizedRequest = (data, payload) => {
    return http.post(BASE_API_URL, JSON.stringify(payload), {
        headers: {
            'Authorization': `Bearer ${data.token}`,
            'Content-Type': 'application/json',
        },
    })
}

const createOrganization = (data) => sendAuthorizedRequest(data, {
    operationName: 'registerNewOrganization',
    query: 'mutation registerNewOrganization($data:RegisterNewOrganizationInput!){obj:registerNewOrganization(data:$data){id}}',
    variables: {
        data: {
            ...DV_SENDER,
            name: 'k6-test',
            tin: '3703048756',
            meta: {
                dv: 1,
            },
            type: 'MANAGING_COMPANY',
            country: 'ru',
        },
    },
})

const resetOrganization = (data) => {
    return sendAuthorizedRequest(data, {
        operationName: 'resetOrganization',
        query: 'mutation resetOrganization($data: ResetOrganizationInput!) { result: resetOrganization(data: $data) { status } }',
        variables: { data: { ...DV_SENDER, organizationId: data.organizationId } },
    })
}

const createTicket = (data) => sendAuthorizedRequest(data, {
    operationName: 'createTicket',
    query: 'mutation createTicket($data: TicketCreateInput) {obj: createTicket(data: $data) {id}}',
    variables: {
        data: {
            ...DV_SENDER,
            organization: { connect: { id: data.organizationId } },
            status: { connect: { id: '6ef3abc4-022f-481b-90fb-8430345ebfc2' } },
            classifier: { connect: { id: '92b39cea-72f0-4c52-9d32-5a4ffe5240d2' } },
            property: { connect: { id: data.propertyId } },
            source: { connect: { id: '779d7bb6-b194-4d2c-a967-1f7321b2787f' } },
            unitName: faker.random.alphaNumeric(3),
            unitType: 'flat',
            details: 'Api created ticket ' + __VU,
        },
    },
})

const createMeter = (data) => sendAuthorizedRequest(data, {
    operationName: 'createMeter',
    query: 'mutation createMeter($data: MeterCreateInput) {obj: createMeter(data: $data) {id}}',
    variables: {
        data: {
            ...DV_SENDER,
            organization: { connect: { id: data.organizationId } },
            property: { connect: { id: data.propertyId } },
            unitName: faker.random.alphaNumeric(3),
            unitType: 'flat',
            numberOfTariffs: 1,
            resource: { connect: { id: 'ffc3f0c3-5044-4093-93ce-d7e92176dfe2' } },
            number: faker.random.alphaNumeric(10),
            accountNumber: faker.random.alphaNumeric(10),
        },
    },
})

const getOrganizationEmployeeId = (data) => sendAuthorizedRequest(data, {
    operationName: 'getList',
    query: 'query getList($where:OrganizationEmployeeWhereInput){allOrganizationEmployees(where:$where){id}}',
    variables: { where: { organization: { id: data.organizationId } } },
})

const getOrganizationEmployees = (token, where) => sendAuthorizedRequest({ token }, {
    operationName: 'getList',
    query: 'query getList($where:OrganizationEmployeeWhereInput){allOrganizationEmployees(where:$where){ id user { id } }}',
    variables: { where },
})

const signInAsUser = (token, userId) => sendAuthorizedRequest({ token }, {
    operationName: 'signinAsUser',
    query: 'mutation signinAsUser($data:SigninAsUserInput!){signinAsUser(data:$data){ token user { id } }}',
    variables: {
        data: {
            id: userId,
            ...DV_SENDER,
        },
    },
})

const createProperty = (data, extraAttrs = {}) => {
    const { address: fakeAddress } = buildFakeAddressAndMeta()

    const address = __ENV.BASE_URL === 'http://localhost:3000'
        ? fakeAddress
        : 'г Нижний Новгород, пр-кт Ленина, д 88 к 78'

    const propertyMap = {
        dv: 1,
        type: 'building',
        sections: Array.from({ length: 7 }).map((_, i) => {
            const section = i + 1
            return {
                id: `${section}`,
                type: 'section',
                index: section,
                name: `${section}`,
                floors: [],
            }
        }),
    }

    propertyMap.sections.forEach(section => {
        section.floors = Array.from({ length: 5 }).map((_, j) => {
            const id = section.id + 10
            return {
                id,
                type: 'floor',
                index: j + 1,
                name: `${id}`,
                units: Array.from({ length: 25 }).map((_, k) => {
                    const unitId = id + k + 100
                    return {
                        id: `${unitId}`,
                        label: `${unitId}`,
                        name: null,
                        type: 'unit',
                        unitType: 'flat',
                    }
                }),
            }
        })
    })

    return sendAuthorizedRequest(data, {
        operationName: 'createProperty',
        query: 'mutation createProperty($data:PropertyCreateInput!){obj:createProperty(data:$data){id address addressKey}}',
        variables: {
            data: {
                ...DV_SENDER,
                address: address,
                organization: { connect: { id: data.organizationId } },
                type: 'building',
                map: propertyMap,
                ...extraAttrs,
            },
        },
    })
}

const createBillingIntegration = (data, extraAttrs = {}) => {
    const name = faker.company.name().replace(/ /, '-').toUpperCase() + ' TEST BILLING INTEGRATION'
    const currencyCode = 'RUB'

    return sendAuthorizedRequest(data, {
        operationName: 'createBillingIntegration',
        query: 'mutation createBillingIntegration($data:BillingIntegrationCreateInput!){obj:createBillingIntegration(data:$data){id}}',
        variables: {
            data: {
                ...DV_SENDER,
                name, currencyCode,
                isHidden: true,
                shortDescription: faker.commerce.productDescription(),
                detailedDescription: faker.lorem.paragraphs(2),
                instruction: faker.lorem.paragraphs(5),
                targetDescription: faker.company.catchPhrase(),
                receiptsLoadingTime: `${faker.datatype.number({ min: 10, max: 100 })} days`,
                bannerColor: '#9b9dfa', bannerTextColor: 'WHITE',
                ...extraAttrs,
            },
        },
    })
}

const createBillingIntegrationOrganizationContext = (data, organization, integration, extraAttrs = {}) => {
    return sendAuthorizedRequest(data, {
        operationName: 'createBillingIntegrationOrganizationContext',
        query: 'mutation createBillingIntegrationOrganizationContext($data:BillingIntegrationOrganizationContextCreateInput!){obj:createBillingIntegrationOrganizationContext(data:$data){id}}',
        variables: {
            data: {
                ...DV_SENDER,
                settings: { dv: 1, 'billing data source': 'https://api.dom.gosuslugi.ru/' },
                state: { dv: 1 },
                organization: { connect: { id: organization.id } },
                integration: { connect: { id: integration.id } },
                ...extraAttrs,
            },
        },
    })
}

const registerResident = (data, address, unitName, unitType = 'flat', extraAttrs = {}) => {
    return sendAuthorizedRequest(data, {
        operationName: 'registerResident',
        query: 'mutation registerResident ($data: RegisterResidentInput!) { obj: registerResident(data: $data) { id } }',
        variables: {
            data: {
                ...DV_SENDER,
                address, unitName, unitType,
                ...extraAttrs,
            },
        },
    })
}

const registerResidentServiceConsumers = (data, residentId, accountNumber, extraAttrs = {}) => {
    return sendAuthorizedRequest(data, {
        operationName: 'registerResidentServiceConsumers',
        query: 'mutation registerResidentServiceConsumers ($data: RegisterResidentServiceConsumersInput!) { obj: registerResidentServiceConsumers(data: $data) { id } }',
        variables: {
            data: {
                ...DV_SENDER,
                resident: { id: residentId }, accountNumber,
                ...extraAttrs,
            },
        },
    })
}

const allResidentBillingReceipts = (data, residentId, extraAttrs = {}) => {
    return sendAuthorizedRequest(data, {
        operationName: 'allResidentBillingReceipts',
        query: 'query allResidentBillingReceipts($where: ResidentBillingReceiptWhereInput) { allResidentBillingReceipts(where: $where) { id } }',
        variables: {
            where: {
                serviceConsumer: { resident: { id: residentId } },
                ...extraAttrs,
            },
        },
    })
}

const registerBillingReceiptFile = (data, billingContextId, receiptId, base64EncodedPDF, extraAttrs = {}) => {
    return sendAuthorizedRequest(data, {
        operationName: 'registerBillingReceiptFile',
        query: 'mutation registerBillingReceiptFile ($data: RegisterBillingReceiptFileInput!) { obj: registerBillingReceiptFile(data: $data) { id status } }',
        variables: {
            data: {
                ...DV_SENDER,
                context: { id: billingContextId },
                receipt: { id: receiptId },
                base64EncodedPDF,
                ...extraAttrs,
            },
        },
    })
}


export {
    allResidentBillingReceipts,
    setupCondoAuth,
    createOrganization,
    createProperty,
    createTicket,
    createMeter,
    createBillingIntegration,
    createBillingIntegrationOrganizationContext,
    sendAuthorizedRequest,
    getOrganizationEmployeeId,
    getOrganizationEmployees,
    registerResident,
    registerResidentServiceConsumers,
    registerBillingReceiptFile,
    signInAsUser,
    resetOrganization,
    BASE_API_URL,
}
