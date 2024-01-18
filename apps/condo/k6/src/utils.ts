import http from 'k6/http'

import { buildFakeAddressAndMeta } from '../../domains/property/utils/testSchema/factories'

const BASE_API_URL = __ENV.BASE_URL + '/admin/api'
const AUTH_REQS = { email: __ENV.AUTH_EMAIL, password: __ENV.AUTH_PASSWORD }

const setupCondoAuth = () => {
    const payload = {
        operationName: null,
        variables: {},
        query: `mutation {authenticateUserWithPassword(email: "${AUTH_REQS.email}" password: "${AUTH_REQS.password}") {token}}`,
    }

    const response = http.post(BASE_API_URL, JSON.stringify(payload), { headers: { 'Content-Type': 'application/json' } })

    return {
        token: response.json('data.authenticateUserWithPassword.token'),
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
            dv: 1,
            sender: {
                dv: 1,
                fingerprint: 'k6-load-test',
            },
            name: 'k6-test',
            tin: '0000000000',
            meta: {
                dv: 1,
            },
            type: 'MANAGING_COMPANY',
            country: 'ru',
        },
    },
})

const createProperty = (data) => {
    const { address } = buildFakeAddressAndMeta()

    return sendAuthorizedRequest(data, {
        operationName: 'createProperty',
        query: 'mutation createProperty($data:PropertyCreateInput!){obj:createProperty(data:$data){id}}',
        variables: {
            data: {
                dv: 1, sender: { dv: 1, fingerprint: 'k6-load-test' },
                address: address, //'р Mississippi, г New Ollie, ул Roberts Club, д 65421183 б 56198',
                organization: { connect: { id: data.organizationId } },
                type: 'building',
            },
        },
    })
}

export {
    setupCondoAuth,
    createOrganization,
    createProperty,
    BASE_API_URL,
}
