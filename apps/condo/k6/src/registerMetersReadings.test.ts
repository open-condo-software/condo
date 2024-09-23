import { check } from 'k6'

import {
    createOrganization,
    createProperty,
    getOrganizationEmployeeId,
    sendAuthorizedRequest,
    setupCondoAuth,
} from './utils'

const DURATION = '60s'

export const options = {
    tags: { testid: 'registerMetersReadings', serverUrl: __ENV.BASE_URL },
    scenarios: {
        registerBillingReceiptFile: {
            exec: 'registerMetersReadings',
            executor: 'constant-vus',
            duration: DURATION,
            vus: 1,
        },
    },
    thresholds: {
        http_req_failed: ['rate<0.01'],
        http_req_duration: ['med<5000'],
    },
}

export function setup () {
    const { token } = setupCondoAuth(true)

    const createdOrganization = createOrganization({ token })
    const organizationId = createdOrganization.json('data.obj.id')

    getOrganizationEmployeeId({ token, organizationId })
    const createdProperty = createProperty({ token, organizationId })

    return {
        token,
        organizationId,
        propertyId: createdProperty.json('data.obj.id'),
    }
}

export function registerMetersReadings (data) {
    const payload = {
        operationName: 'registerMetersReadings',
        query: 'mutation registerMetersReadings($data: RegisterMetersReadingsInput!) {result: registerMetersReadings(data: $data) {id}}',
        variables: {
            data: {
                dv: 1,
                sender: { dv: 1, fingerprint: 'k6-load-test' },
                organization: { id: data.organizationId },
                readings: [

                ],
            },
        },
    }
    const response = sendAuthorizedRequest(data, payload)

    check(response, {
        'registerMetersReadings status is 200': (res) => res.status === 200,
    })
}