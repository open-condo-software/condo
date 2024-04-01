import { faker } from '@faker-js/faker/locale/ru'
import http from 'k6/http'

import { buildFakeAddressAndMeta } from '../../domains/property/utils/testSchema/factories'
import { MIN_PASSWORD_LENGTH } from '@condo/domains/user/constants/common'

const BASE_API_URL = __ENV.BASE_URL + '/admin/api'
const AUTH_REQS = { email: __ENV.AUTH_EMAIL, password: __ENV.AUTH_PASSWORD }
const DV_SENDER = { dv: 1, sender: { dv: 1, fingerprint: 'k6-load-test' } }

const setupCondoAuth = (useEnv = false) => {
    const payload = {
        operationName: null,
        variables: {},
        query: `mutation {authenticateUserWithPassword(email: "${AUTH_REQS.email}" password: "${AUTH_REQS.password}") {token}}`,
    }

    const response = http.post(BASE_API_URL, JSON.stringify(payload), { headers: { 'Content-Type': 'application/json' } })
    const token = response.json('data.authenticateUserWithPassword.token')

    if (useEnv) {
        return {
            token,
            cookie: response.cookies['keystone.sid'][0]['value'],
        }
    }

    // Create separate account for tests
    const email = `${new Date().getTime()}-k6-load-test@example.com`
    const password = faker.internet.password(MIN_PASSWORD_LENGTH)
    const createUserResponse = sendAuthorizedRequest({ token }, {
        operationName: null,
        query: 'mutation ($data: UserCreateInput!) { createUser (data: $data) { id } }',
        variables: {
            data: {
                name: 'k6-test-user',
                email,
                password,
                ...DV_SENDER,
            },
        },
    })

    if (createUserResponse.json('data.createUser.id') === undefined) {
        console.error(JSON.stringify(createUserResponse.json('errors')))
        throw new Error('Unable to create user for k6 test case run')
    }

    const testUserResponse = http.post(BASE_API_URL, JSON.stringify({
        operationName: null, variables: {},
        query: `mutation {authenticateUserWithPassword(email: "${email}" password: "${password}") {token}}`,
    }), { headers: { 'Content-Type': 'application/json' } })

    return {
        token: testUserResponse.json('data.authenticateUserWithPassword.token'),
        cookie: testUserResponse.cookies['keystone.sid'][0]['value'],
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

const getOrganizationEmployeeId = (data) => sendAuthorizedRequest(data, {
    operationName: 'getList',
    query: 'query getList($where:OrganizationEmployeeWhereInput){allOrganizationEmployees(where:$where){id}}',
    variables: { where: { organization: { id: data.organizationId } } },
})

const createProperty = (data) => {
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
        query: 'mutation createProperty($data:PropertyCreateInput!){obj:createProperty(data:$data){id}}',
        variables: {
            data: {
                ...DV_SENDER,
                address: address,
                organization: { connect: { id: data.organizationId } },
                type: 'building',
                map: propertyMap,
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

export {
    setupCondoAuth,
    createOrganization,
    createProperty,
    createBillingIntegration,
    createBillingIntegrationOrganizationContext,
    sendAuthorizedRequest,
    getOrganizationEmployeeId,
    BASE_API_URL,
}
