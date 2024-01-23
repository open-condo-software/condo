import { faker } from '@faker-js/faker/locale/ru'
import dayjs from 'dayjs'
import { check } from 'k6'
import http from 'k6/http'

import {
    setupCondoAuth,
    createOrganization,
    createBillingIntegration,
    createBillingIntegrationOrganizationContext,
    sendAuthorizedRequest,
} from './utils'

const DURATION = '60s'

export const options = {
    scenarios: {
        appHealthcheck: {
            exec: 'healthcheck',
            executor: 'constant-arrival-rate',
            duration: DURATION,
            rate: 2,
            timeUnit: '1s',
            preAllocatedVUs: 2,
        },
        registerBillingReceipts: {
            exec: 'registerBillingReceiptsService',
            executor: 'constant-arrival-rate',
            duration: DURATION,
            rate: 10,
            timeUnit: '1s',
            preAllocatedVUs: 15,
        },
    },
    thresholds: {
        http_req_failed: ['rate<0.01'],
        // browser_http_req_duration: ['p(95) < 1000'],
        http_req_duration: ['p(95)<2000'],
        // browser_web_vital_fcp: ['p(95) < 2000'],
        // browser_web_vital_lcp: ['p(95) < 4000'],
    },
}

export function setup () {
    const { token, cookie } = setupCondoAuth()

    const createdOrganization = createOrganization({ token })
    const organizationId = createdOrganization.json('data.obj.id')
    // createProperty({ token, organizationId })
    const billingIntegration = createBillingIntegration({ token })

    const billingContext = createBillingIntegrationOrganizationContext(
        { token },
        { id: organizationId },
        billingIntegration.json('data.obj')
    )

    return {
        token,
        cookie,
        organizationId,
        billingContext: billingContext.json('data.obj'),
    }
}

export function healthcheck () {
    const appHealthcheck = http.get(__ENV.BASE_URL + '/server-health?checks=postgres,redis')

    check(appHealthcheck, {
        'healthcheck should return 200': (res) => res.status === 200,
        'postgres should pass': (res) => res.json('postgres') === 'pass',
        'redis should pass': (res) => res.json('redis') === 'pass',
    })
}

const randomNumber = (numDigits) => {
    const min = 10 ** (numDigits - 1)
    const max = 10 ** numDigits - 1
    return faker.datatype.number({ min, max })
}
const createAddressWithUnit = () => `${faker.address.cityName()} ${faker.address.streetAddress(true)}`
const generateServicesData = (count = 3, toPay = '') => {
    const services = []

    for (let i = 0; i < count; i++) {
        services.push({
            id: faker.datatype.number().toString(),
            name: faker.random.alphaNumeric(),
            toPay: toPay !== '' ? toPay : faker.datatype.number().toString(),
            toPayDetails: {
                formula: 'charge + penalty',
                charge: faker.datatype.number().toString(),
                penalty: faker.datatype.number().toString(),
            },
        })
    }
    return services
}
const createRecipient = (extra = {}) => ({
    tin: faker.random.numeric(8),
    routingNumber: faker.random.numeric(5),
    bankAccount: faker.random.numeric(12),
    ...extra,
})

const createJSONReceipt = (extra = {}) => {
    const [month, year] = dayjs().add(-1, 'month').format('MM-YYYY').split('-').map(Number)
    return Object.fromEntries(Object.entries({
        importId: faker.datatype.uuid(),
        address: createAddressWithUnit(),
        accountNumber: randomNumber(10).toString(),
        toPay: faker.finance.amount(-100, 5000),
        month, year,
        services: generateServicesData(faker.datatype.number({ min: 3, max: 5 })),
        ...createRecipient(),
        raw: extra,
        ...extra,
    }).filter(([, value]) => !!value))
}

export function registerBillingReceiptsService (data) {
    const receipt1 = createJSONReceipt()
    const receipt2 = createJSONReceipt({
        ...receipt1,
        importId: null,
        address: createAddressWithUnit(),
        accountNumber: randomNumber(10).toString(),
    })

    const response = sendAuthorizedRequest(data, {
        operationName: 'registerBillingReceipts',
        query: 'mutation registerBillingReceipts($data:RegisterBillingReceiptsInput!){result:registerBillingReceipts(data:$data){id}}',
        variables: {
            data: {
                dv: 1, sender: { dv: 1, fingerprint: 'k6-load-test' },
                context: { id: data.billingContext.id },
                receipts: [receipt1, receipt2, createJSONReceipt()],
            },
        },
    })

    check(response, {
        'status is 200': (res) => res.status === 200,
        // @ts-ignore-next-line
        'receipts is created': (res) => res.json('data.result').every(e => e.id !== undefined),
    })
}
