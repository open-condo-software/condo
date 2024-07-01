import { check, sleep } from 'k6'
import { browser } from 'k6/experimental/browser'
import http from 'k6/http'

import {
    setupCondoAuth,
    createOrganization,
    createProperty,
    sendAuthorizedRequest,
    getOrganizationEmployeeId,
} from './utils'

const BASE_APP_URL = __ENV.BASE_URL + '/ticket'
const DURATION = '60s'

export const options = {
    tags: { testid: 'ticket', serverUrl: __ENV.BASE_URL },
    scenarios: {
        queryTicketsWithPropertyScopes: {
            exec: 'queryTicketsWithPropertyScopes',
            executor: 'per-vu-iterations',
            vus: 10,
            iterations: 1,
            maxDuration: DURATION,
        },
    },
    thresholds: {
        http_req_failed: ['rate<0.01'],
        browser_http_req_duration: ['p(95) < 4000', 'med < 1500'],
        http_req_duration: ['p(95)<3000', 'med<2000'],
        browser_web_vital_fcp: ['p(95) < 8000', 'med < 4000'],
        browser_web_vital_lcp: ['p(95) < 15000', 'med < 11000'],
    },
}

export function setup () {
    const { token, cookie } = setupCondoAuth()

    const createdOrganization = createOrganization({ token })
    const organizationId = createdOrganization.json('data.obj.id')

    const organizationEmployee = getOrganizationEmployeeId({ token, organizationId })
    const createdProperty = createProperty({ token, organizationId })

    return {
        token, cookie, organizationId,
        organizationLinkId: organizationEmployee.json('data.allOrganizationEmployees.0.id'),
        propertyId: createdProperty.json('data.obj.id'),
    }
}

const generateAddress = (number) => {
    return `г Магадан, пр-кт Ленина, д ${number}`
}

export default function (data) {
    const { token, cookie } = setupCondoAuth()

    const createdOrganization = createOrganization({ token })
    const organizationId = createdOrganization.json('data.obj.id')

    const organizationEmployee = getOrganizationEmployeeId({ token, organizationId })

    const properties = []

    for (let i = 1; i < 10; i++) {
        const createdProperty = createProperty({ token, organizationId, address: generateAddress(i) })
        properties.push(createdProperty)
    }

    const organizationLinkId = organizationEmployee.json('data.allOrganizationEmployees.0.id')
}