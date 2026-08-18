import { faker } from '@faker-js/faker/locale/ru'
import dayjs from 'dayjs'
import { check } from 'k6'
import { Counter } from 'k6/metrics'

import {
    setupCondoAuth,
    createOrganization,
    createBillingIntegration,
    createBillingIntegrationOrganizationContext,
    sendAuthorizedRequest,
    areReceiptsCreated,
    getBalancerPeer,
} from './utils'

const DURATION = '60s'
const RECEIPT_COUNT = 100
const BILLING_BALANCER_HEADERS = {
    'X-Target': 'billing',
    'X-Balancer-Debug': '1',
}

const balancerPeerHits = new Counter('balancer_peer_hits')
const seenPeers = {}

export const options = {
    tags: { testid: 'podLoadBalance', serverUrl: __ENV.BASE_URL },
    scenarios: {
        registerBillingReceipts: {
            exec: 'registerBillingReceiptsService',
            executor: 'constant-vus',
            duration: DURATION,
            vus: 8,
        },
    },
    thresholds: {
        http_req_failed: ['rate<0.01'],
        http_req_duration: ['med<14000'],
        checks: ['rate>0.85'],
        'checks{check:has balancer peer}': ['rate>0.95'],
        'checks{check:avoids sticking to one pod}': ['rate>0.8'],
    },
}

export function setup () {
    const { token } = setupCondoAuth()

    const createdOrganization = createOrganization({ token })
    const organizationId = createdOrganization.json('data.obj.id')
    const billingIntegration = createBillingIntegration({ token })

    const billingContext = createBillingIntegrationOrganizationContext(
        { token },
        { id: organizationId },
        billingIntegration.json('data.obj'),
        { status: 'Finished' },
    )

    return {
        token,
        organizationId,
        billingContext: billingContext.json('data.obj'),
    }
}

const randomNumber = (numDigits) => {
    const min = 10 ** (numDigits - 1)
    const max = 10 ** numDigits - 1
    return faker.datatype.number({ min, max })
}

const createAddressWithUnit = () => __ENV.BASE_URL === 'http://localhost:3000'
    ? `${faker.address.cityName()} ${faker.address.streetAddress(true)}`
    : 'г Нижний Новгород, пр-кт Ленина, д 88 к 78, кв 1'

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
    tin: '3703048756',
    routingNumber: '046577674',
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
    const receipts = []
    const bankAccount = faker.random.numeric(12)

    for (let i = 0; i < RECEIPT_COUNT; i++) {
        receipts.push(createJSONReceipt({ bankAccount }))
    }

    const response = sendAuthorizedRequest(data, {
        operationName: 'registerBillingReceipts',
        query: 'mutation registerBillingReceipts($data:RegisterBillingReceiptsInput!){result:registerBillingReceipts(data:$data){id}}',
        variables: {
            data: {
                dv: 1, sender: { dv: 1, fingerprint: 'k6-load-test' },
                context: { id: data.billingContext.id },
                receipts,
            },
        },
    }, BILLING_BALANCER_HEADERS)

    const peer = getBalancerPeer(response)
    if (peer) {
        seenPeers[peer] = 1
        balancerPeerHits.add(1, { peer })
    }

    check(response, {
        'receipt creation status is 200': (res) => res.status === 200,
        'receipts is created': (res) => areReceiptsCreated(res),
        'has balancer peer': () => Boolean(peer),
        // Overlapping slow billing mutations should not pin a VU onto one pod.
        'avoids sticking to one pod': () => __ITER < 5 || Object.keys(seenPeers).length >= 2,
    })
}
