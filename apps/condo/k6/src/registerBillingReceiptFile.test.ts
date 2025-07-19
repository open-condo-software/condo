import { faker } from '@faker-js/faker/locale/ru'
import dayjs from 'dayjs'
import { check } from 'k6'
import crypto from 'k6/crypto'
import encoding from 'k6/encoding'

import {
    setupCondoAuth,
    createOrganization,
    createBillingIntegration,
    createBillingIntegrationOrganizationContext,
    sendAuthorizedRequest,
    registerBillingReceiptFile,
} from './utils'

const RECEIPT_PER_ACCOUNT_NUMBER = 50
const TOTAL_RECEIPT_NUMBER = 100
const DURATION = '60s'

export const options = {
    tags: { testid: 'registerBillingReceiptFile', serverUrl: __ENV.BASE_URL },
    scenarios: {
        registerBillingReceiptFile: {
            exec: 'registerBillingReceiptFileCase',
            executor: 'constant-vus',
            duration: DURATION,
            vus: 1,
        },
    },
    thresholds: {
        http_req_failed: ['rate<0.01'],
        http_req_duration: ['med<7000'],
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
    const data = {
        token,
        organizationId,
        billingContext: billingContext.json('data.obj'),
    }

    const { receipts } = registerBillingReceipts(data)

    const fileSize = 1024 * 1024 * 10 // 1024 bytes (kb) * 1024 => mb * 10 => 10mb
    const bytes = crypto.randomBytes(fileSize)
    const base64EncodedPDF = encoding.b64encode(bytes)

    return {
        ...data,
        receipts,
        base64EncodedPDF,
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

const registerBillingReceipts = (data) => {
    const receipts = []
    const bankAccount = faker.random.numeric(12)
    const unitName = `${faker.datatype.number({ min: 1, max: 10000 })}`
    const address = 'г Нижний Новгород, пр-кт Ленина, д 88 к 78'
    const addressWithUnit = address + ', кв ' + unitName
    const accountNumberPrefix = faker.datatype.uuid()

    let accountIndex = 0
    let accountCounter = 0
    for (let i = 0; i < TOTAL_RECEIPT_NUMBER; i++) {
        receipts.push(createJSONReceipt({ bankAccount, address: addressWithUnit, accountNumber: `${accountNumberPrefix}${accountIndex}` }))
        accountCounter++

        if (accountCounter >= RECEIPT_PER_ACCOUNT_NUMBER) {
            accountCounter = 0
            accountIndex++
        }
    }

    const response = sendAuthorizedRequest(data, {
        operationName: 'registerBillingReceipts',
        query: 'mutation registerBillingReceipts($data:RegisterBillingReceiptsInput!){ result:registerBillingReceipts(data:$data){id property { id address addressKey } importId } }',
        variables: {
            data: {
                dv: 1, sender: { dv: 1, fingerprint: 'k6-load-test' },
                context: { id: data.billingContext.id },
                receipts,
            },
        },
    })

    const receiptsResponse = response.json('data.result') as Array<{
        id: string, property: { id: string, address: string, addressKey: string }
    }>

    check(response, {
        'receipt creation status is 200': (res) => res.status === 200,
        'receipts is created': () => receiptsResponse.every(e => e.id !== undefined),
    })

    return {
        receipts: receiptsResponse,
        unitName,
        address,
        accountNumberPrefix,
    }
}

export function registerBillingReceiptFileCase (data) {
    const receipt = data.receipts[Math.floor(Math.random() * data.receipts.length)] // NOSONAR
    const response = registerBillingReceiptFile(
        data,
        data.billingContext.id,
        receipt.id,
        data.base64EncodedPDF,
    )
    const registerResponse = response.json('data.obj') as {
        id: string
        status: string
    }

    check(response, {
        'resident billing receipt file response is 200': (res) => res.status === 200,
        'resident billing receipt file id data provided': () => registerResponse.id !== undefined,
        'resident billing receipt file status data provided': () => registerResponse.status === 'CREATED' || registerResponse.status === 'UPDATED' || registerResponse.status === 'SKIPPED',
    })
}
