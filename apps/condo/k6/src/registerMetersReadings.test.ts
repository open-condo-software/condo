import { faker } from '@faker-js/faker/locale/ru'
import dayjs from 'dayjs'
import { check } from 'k6'

import { COLD_WATER_METER_RESOURCE_ID } from '@condo/domains/meter/constants/constants'
import { FLAT_UNIT_TYPE } from '@condo/domains/property/constants/common'

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
        registerMetersReadings: {
            exec: 'registerMetersReadings',
            executor: 'constant-vus',
            duration: DURATION,
            vus: 1,
        },
    },
    thresholds: {
        http_req_failed: ['rate<0.01'],
        http_req_duration: ['med<1000'],
    },
}

const METER_READINGS_COUNT = 500

const createTestReadingData = (property, extraAttrs = {}) => ({
    address: property.address,
    addressInfo: {
        unitType: FLAT_UNIT_TYPE,
        unitName: faker.random.alphaNumeric(4),
        globalId: faker.datatype.uuid(),
    },
    accountNumber: faker.random.alphaNumeric(12),
    meterNumber: faker.random.numeric(8),
    meterResource: { id: COLD_WATER_METER_RESOURCE_ID },
    date: dayjs().toISOString(),
    value1: faker.random.numeric(3),
    value2: faker.random.numeric(4),
    meterMeta: {
        numberOfTariffs: 2,
    },
    ...extraAttrs,
})

export function setup () {
    const { token } = setupCondoAuth()

    const createdOrganization = createOrganization({ token })
    const organizationId = createdOrganization.json('data.obj.id')

    getOrganizationEmployeeId({ token, organizationId })
    const createdPropertyResponse = createProperty({ token, organizationId })
    const property = createdPropertyResponse.json('data.obj')

    const readings = []
    for (let i = 0; i < METER_READINGS_COUNT; i++) {
        const reading = createTestReadingData(property)
        readings.push(reading)
    }

    return {
        token,
        organizationId,
        propertyId: createdPropertyResponse.json('data.obj.id'),
        readings,
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
                readings: data.readings,
            },
        },
    }
    const response = sendAuthorizedRequest(data, payload)

    check(response, {
        'registerMetersReadings status is 200': (res) => res.status === 200,
        'registerMetersReadings response provided': (res) => {
            const result = res.json('data.result')

            if (Array.isArray(result)) {
                return result.length === METER_READINGS_COUNT
            }

            return false
        },
    })
}
