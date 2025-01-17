import { check } from 'k6'

import {
    setupCondoAuth,
    createOrganization,
    createProperty,
    sendAuthorizedRequest,
    getOrganizationEmployeeId, createTicket, createMeter,
} from './utils'

const DURATION = '60s'

export const options = {
    tags: { testid: 'tour', serverUrl: __ENV.BASE_URL },
    scenarios: {
        syncTourSteps: {
            exec: 'syncTourSteps',
            executor: 'constant-arrival-rate',
            duration: DURATION,
            rate: 5,
            timeUnit: '1s',
            preAllocatedVUs: 7,
        },
    },
    thresholds: {
        http_req_failed: ['rate<0.01'],
        http_req_duration: ['med<1000'],
    },
}

export function setup () {
    const { token } = setupCondoAuth()

    const createdOrganization = createOrganization({ token })
    const organizationId = createdOrganization.json('data.obj.id')

    getOrganizationEmployeeId({ token, organizationId })
    const createdProperty = createProperty({ token, organizationId })

    const data = {
        token,
        organizationId,
        propertyId: createdProperty.json('data.obj.id'),
    }

    for (let i = 0; i < 200; i++) {
        createTicket(data)
        createMeter(data)
    }

    return data
}

export function syncTourSteps (data) {
    const payload = {
        operationName: 'syncTourSteps',
        query: 'mutation syncTourSteps($data: SyncTourStepsInput!) {result: syncTourSteps(data: $data) {ok}}',
        variables: {
            data: {
                dv: 1,
                sender: { dv: 1, fingerprint: 'k6-load-test' },
                organization: { id: data.organizationId },
            },
        },
    }
    const response = sendAuthorizedRequest(data, payload)

    check(response, {
        'syncTourSteps status is 200': (res) => res.status === 200,
        'syncTourSteps': (res) => res.json('result.ok') === 'true',
    })
}
