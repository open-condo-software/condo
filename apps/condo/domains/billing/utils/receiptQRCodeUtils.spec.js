/**
 * @jest-environment node
 */
const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const Big = require('big.js')
const dayjs = require('dayjs')

const { getById } = require('@open-condo/keystone/schema')
const { catchErrorFrom, setFakeClientMode, makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')

const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/acquiring/constants/context')
const { addAcquiringIntegrationAndContext } = require('@condo/domains/acquiring/utils/testSchema')
const { createTestBankAccount } = require('@condo/domains/banking/utils/testSchema')
const {
    createValidRuRoutingNumber,
    createValidRuNumber,
} = require('@condo/domains/banking/utils/testSchema/bankAccount')
const { getCountrySpecificQRCodeParser } = require('@condo/domains/billing/utils/countrySpecificQRCodeParsers')
const { RUSSIA_COUNTRY } = require('@condo/domains/common/constants/countries')
const { createTestOrganization } = require('@condo/domains/organization/utils/testSchema')
const { createTestProperty } = require('@condo/domains/property/utils/testSchema')

const {
    DEFAULT_PERIODS_EDGE_DATE,
    getQRCodeMissedFields,
    getQRCodeField,
    getQRCodeFields,
    formatPeriodFromQRCode,
    compareQRCodeWithLastReceipt,
    findAuxiliaryData,
    getQRCodePaymPeriod,
} = require('./receiptQRCodeUtils')
const {
    addBillingIntegrationAndContext,
    createTestBillingProperty,
    createTestBillingAccount,
    createTestBillingRecipient,
    createTestBillingReceipt,
    createTestRecipient,
} = require('./testSchema')

describe('receiptQRCodeUtils', () => {

    const parseRUReceiptQRCode = getCountrySpecificQRCodeParser(RUSSIA_COUNTRY)
    let adminClient

    setFakeClientMode(index, { excludeApps: ['NextApp', 'AdminUIApp', 'OIDCMiddleware'] })

    beforeAll(async () => {
        adminClient = await makeLoggedInAdminClient()
    })

    describe('RU QR-codes decoded correctly', () => {
        const cases = [
            [1, 'ÀÒÌÎÑÔÅÐÀ', 'АТМОСФЕРА'], // Got from real QR-code
            // Got from conversion (https://convertcyrillic.com/)
            // curl 'https://convertcyrillic.com/api/conversionservice' --data-raw '={"sourceEncoding":"Russian.Unicode","targetEncoding":"Russian.KOI8","text":"Привет"}'
            [1, 'Ïðèâåò', 'Привет'],
            [2, 'Привет', 'Привет'],
            // curl 'https://convertcyrillic.com/api/conversionservice' --data-raw '={"sourceEncoding":"Russian.Unicode","targetEncoding":"Russian.CP1251","text":"Привет"}'
            [3, 'ðÒÉ×ÅÔ', 'Привет'],
        ]

        test.each(cases)('%p %p -> %p', (tag, dataFromQRCode, expectedData) => {
            const qrStr = `ST0001${tag}|field1=Hello|Field2=world|foo=${dataFromQRCode}`
            const parsed = parseRUReceiptQRCode(qrStr)
            expect(parsed).toEqual({
                field1: 'Hello',
                Field2: 'world',
                foo: expectedData,
            })
        })
    })

    test('must throw an error on invalid QR-code', async () => {
        await catchErrorFrom(
            async () => {
                parseRUReceiptQRCode('ST0012|field1=Hello|Field2=world')
            },
            (err) => {
                expect(err).toEqual(expect.objectContaining({ message: 'Invalid QR code' }))
            },
        )
    })

    test('can get field case-insensitively', () => {
        const qrStr = 'ST00012|field1=Hello|Field2=world|someField=!!'
        const parsed = parseRUReceiptQRCode(qrStr)
        expect(parsed).toEqual({
            field1: 'Hello',
            Field2: 'world',
            someField: '!!',
        })

        expect(getQRCodeField(parsed, 'Field1')).toBe('Hello')
        expect(getQRCodeField(parsed, 'SomeField')).toBe('!!')
    })

    test('Fields returned as requested', () => {
        const qrStr = 'ST00012|field1=Hello|Field2=world|someField=!!|paymPeriod=01.2024'
        const parsed = parseRUReceiptQRCode(qrStr)
        const fields = getQRCodeFields(parsed, ['field1', 'FIELD2', 'somefield', 'PaymPeriod'])

        expect(fields).toEqual({
            field1: 'Hello',
            FIELD2: 'world',
            somefield: '!!',
            PaymPeriod: '01.2024',
        })
    })

    test('check for required fields', () => {
        const parsed = parseRUReceiptQRCode('ST00012|field1=Hello|Field2=world|foo=bar baz')
        const missedFields = getQRCodeMissedFields(parsed)

        expect(missedFields).toEqual(['BIC', 'PayerAddress', 'Sum', 'PersAcc', 'PayeeINN', 'PersonalAcc'])
    })

    test('check for required fields except one', () => {
        const parsed = parseRUReceiptQRCode('ST00012|field1=Hello|Field2=world|foo=bar baz|persAcc=01.2024')
        const missedFields = getQRCodeMissedFields(parsed)

        expect(missedFields).toEqual(['BIC', 'PayerAddress', 'Sum', 'PayeeINN', 'PersonalAcc'])
    })

    test('format period from QR-code', () => {
        expect(formatPeriodFromQRCode('05.2024')).toBe('2024-05-01')
    })

    describe('resolvers', () => {

        /** @type {TRUQRCodeFields} */
        let qrCodeObj
        let billingIntegrationContext, billingProperty, billingAccount, billingRecipient

        beforeAll(async () => {
            const [o10n] = await createTestOrganization(adminClient)
            const [property] = await createTestProperty(adminClient, o10n)

            const bic = createValidRuRoutingNumber()
            qrCodeObj = {
                BIC: bic,
                PayerAddress: property.address,
                PaymPeriod: '06.2024',
                Sum: '10000',
                PersAcc: faker.random.numeric(8),
                PayeeINN: o10n.tin,
                PersonalAcc: createValidRuNumber(bic),
            }

            ;({ billingIntegrationContext } = await addBillingIntegrationAndContext(adminClient, o10n, {}, { status: CONTEXT_FINISHED_STATUS }))
            await addAcquiringIntegrationAndContext(adminClient, o10n, {}, { status: CONTEXT_FINISHED_STATUS })

            await createTestBankAccount(adminClient, o10n, {
                number: qrCodeObj.PersonalAcc,
                routingNumber: qrCodeObj.BIC,
            })
            ;[billingProperty] = await createTestBillingProperty(adminClient, billingIntegrationContext)
            ;[billingAccount] = await createTestBillingAccount(adminClient, billingIntegrationContext, billingProperty, { number: qrCodeObj.PersAcc })
            ;[billingRecipient] = await createTestBillingRecipient(adminClient, billingIntegrationContext, {
                bankAccount: qrCodeObj.PersonalAcc,
                bic: qrCodeObj.BIC,
            })
        })

        describe('when there is no billing receipt', () => {
            test('no last billing receipt', async () => {
                const resolvers = {
                    onNoReceipt: jest.fn(),
                    onReceiptPeriodEqualsQrCodePeriod: jest.fn(),
                    onReceiptPeriodNewerThanQrCodePeriod: jest.fn(),
                    onReceiptPeriodOlderThanQrCodePeriod: jest.fn(),
                }
                await compareQRCodeWithLastReceipt(qrCodeObj, resolvers)

                expect(resolvers.onNoReceipt).toBeCalledTimes(1)
                expect(resolvers.onReceiptPeriodEqualsQrCodePeriod).toBeCalledTimes(0)
                expect(resolvers.onReceiptPeriodNewerThanQrCodePeriod).toBeCalledTimes(0)
                expect(resolvers.onReceiptPeriodOlderThanQrCodePeriod).toBeCalledTimes(0)
            })
        })

        describe('when there is a billing receipt is existing', () => {

            let billingReceiptForComparison

            beforeAll(async () => {
                const [billingReceipt] = await createTestBillingReceipt(adminClient, billingIntegrationContext, billingProperty, billingAccount, {
                    period: '2024-06-01',
                    receiver: { connect: { id: billingRecipient.id } },
                    recipient: createTestRecipient({
                        bic: billingRecipient.bic,
                    }),
                    toPay: Big(qrCodeObj.Sum).div(100),
                })

                billingReceiptForComparison = await getById('BillingReceipt', billingReceipt.id)
            })

            test('last billing receipt period equals qr-code period', async () => {
                const resolvers = {
                    onNoReceipt: jest.fn(),
                    onReceiptPeriodEqualsQrCodePeriod: jest.fn(),
                    onReceiptPeriodNewerThanQrCodePeriod: jest.fn(),
                    onReceiptPeriodOlderThanQrCodePeriod: jest.fn(),
                }
                await compareQRCodeWithLastReceipt(qrCodeObj, resolvers)

                expect(resolvers.onNoReceipt).toBeCalledTimes(0)
                expect(resolvers.onReceiptPeriodEqualsQrCodePeriod).toBeCalledTimes(1)
                expect(resolvers.onReceiptPeriodNewerThanQrCodePeriod).toBeCalledTimes(0)
                expect(resolvers.onReceiptPeriodOlderThanQrCodePeriod).toBeCalledTimes(0)

                expect(resolvers.onReceiptPeriodEqualsQrCodePeriod).toHaveBeenCalledWith(billingReceiptForComparison)
            })

            test('last billing receipt have newer period than qr-code period', async () => {
                const resolvers = {
                    onNoReceipt: jest.fn(),
                    onReceiptPeriodEqualsQrCodePeriod: jest.fn(),
                    onReceiptPeriodNewerThanQrCodePeriod: jest.fn(),
                    onReceiptPeriodOlderThanQrCodePeriod: jest.fn(),
                }
                await compareQRCodeWithLastReceipt({ ...qrCodeObj, PaymPeriod: '05.2024' }, resolvers)

                expect(resolvers.onNoReceipt).toBeCalledTimes(0)
                expect(resolvers.onReceiptPeriodEqualsQrCodePeriod).toBeCalledTimes(0)
                expect(resolvers.onReceiptPeriodNewerThanQrCodePeriod).toBeCalledTimes(1)
                expect(resolvers.onReceiptPeriodOlderThanQrCodePeriod).toBeCalledTimes(0)

                expect(resolvers.onReceiptPeriodNewerThanQrCodePeriod).toHaveBeenCalledWith(billingReceiptForComparison)
            })

            test('last billing receipt period is older that qr-code period', async () => {
                const resolvers = {
                    onNoReceipt: jest.fn(),
                    onReceiptPeriodEqualsQrCodePeriod: jest.fn(),
                    onReceiptPeriodNewerThanQrCodePeriod: jest.fn(),
                    onReceiptPeriodOlderThanQrCodePeriod: jest.fn(),
                }
                await compareQRCodeWithLastReceipt({ ...qrCodeObj, PaymPeriod: '07.2024' }, resolvers)

                expect(resolvers.onNoReceipt).toBeCalledTimes(0)
                expect(resolvers.onReceiptPeriodEqualsQrCodePeriod).toBeCalledTimes(0)
                expect(resolvers.onReceiptPeriodNewerThanQrCodePeriod).toBeCalledTimes(0)
                expect(resolvers.onReceiptPeriodOlderThanQrCodePeriod).toBeCalledTimes(1)

                expect(resolvers.onReceiptPeriodOlderThanQrCodePeriod).toHaveBeenCalledWith(billingReceiptForComparison)
            })
        })
    })

    test('Auxiliary data has correct format', async () => {
        const [o10n] = await createTestOrganization(adminClient)
        const [property] = await createTestProperty(adminClient, o10n)

        const bic = createValidRuRoutingNumber()
        const qrCodeObj = {
            BIC: bic,
            PayerAddress: `${property.address}, кв 1`,
            PaymPeriod: '06.2024',
            Sum: '10000',
            PersAcc: faker.random.numeric(8),
            PayeeINN: o10n.tin,
            PersonalAcc: createValidRuNumber(bic),
        }

        const {
            billingIntegration,
            billingIntegrationContext,
        } = await addBillingIntegrationAndContext(adminClient, o10n, {}, { status: CONTEXT_FINISHED_STATUS })
        const {
            acquiringIntegration,
            acquiringIntegrationContext,
        } = await addAcquiringIntegrationAndContext(adminClient, o10n, {}, { status: CONTEXT_FINISHED_STATUS })

        const auxiliaryData = await findAuxiliaryData(qrCodeObj, { address: undefined })

        expect(auxiliaryData).toMatchObject({
            normalizedAddress: expect.objectContaining({
                addressKey: property.addressKey,
                unitType: 'flat',
                unitName: '1',
            }),
            contexts: {
                [o10n.id]: {
                    billingContext: expect.objectContaining({
                        id: billingIntegrationContext.id,
                        integration: billingIntegration.id,
                    }),
                    acquiringContext: expect.objectContaining({
                        id: acquiringIntegrationContext.id,
                        integration: acquiringIntegration.id,
                    }),
                },
            },
        })
    })

    test('Auxiliary data: throw an error if address not found', async () => {
        const [o10n] = await createTestOrganization(adminClient)
        const [property] = await createTestProperty(adminClient, o10n)

        const bic = createValidRuRoutingNumber()
        const qrCodeObj = {
            BIC: bic,
            PayerAddress: `${property.address}, кв 1`,
            PaymPeriod: '06.2024',
            Sum: '10000',
            PersAcc: faker.random.numeric(8),
            PayeeINN: o10n.tin,
            PersonalAcc: createValidRuNumber(bic),
        }

        await addBillingIntegrationAndContext(adminClient, o10n, {}, { status: CONTEXT_FINISHED_STATUS })
        await addAcquiringIntegrationAndContext(adminClient, o10n, {}, { status: CONTEXT_FINISHED_STATUS })

        await catchErrorFrom(
            async () => await findAuxiliaryData({ ...qrCodeObj, PayerAddress: `${property.address}, кв` }, { address: new Error('error about address') }),
            (err) => {
                expect(err.message).toMatch('error about address')
            }
        )
    })

    describe('Detect PaymPeriod', () => {
        test('When no period in qr-code receiptUploadDate exists', async () => {
            const [o10n] = await createTestOrganization(adminClient)

            const bic = createValidRuRoutingNumber()
            const qrCodeObj = {
                BIC: bic,
                PayerAddress: faker.address.streetAddress(),
                Sum: '10000',
                PersAcc: faker.random.numeric(8),
                PayeeINN: o10n.tin,
                PersonalAcc: createValidRuNumber(bic),
            }

            const periodsEdgeDay = 10

            const { billingIntegrationContext } = await addBillingIntegrationAndContext(adminClient, o10n, {}, {
                status: CONTEXT_FINISHED_STATUS,
                settings: { dv: 1, receiptUploadDate: periodsEdgeDay },
            })

            const now = dayjs()
            const currentDay = now.date()
            const PaymPeriod = getQRCodePaymPeriod(qrCodeObj, billingIntegrationContext)

            if (currentDay < periodsEdgeDay) {
                expect(PaymPeriod).toBe(now.subtract(1, 'month').format('MM.YYYY'))
            } else {
                expect(PaymPeriod).toBe(now.format('MM.YYYY'))
            }
        })

        test('When no period in qr-code receiptUploadDate not exists', async () => {
            const [o10n] = await createTestOrganization(adminClient)

            const bic = createValidRuRoutingNumber()
            const qrCodeObj = {
                BIC: bic,
                PayerAddress: faker.address.streetAddress(),
                Sum: '10000',
                PersAcc: faker.random.numeric(8),
                PayeeINN: o10n.tin,
                PersonalAcc: createValidRuNumber(bic),
            }

            const periodsEdgeDay = DEFAULT_PERIODS_EDGE_DATE

            const { billingIntegrationContext } = await addBillingIntegrationAndContext(adminClient, o10n, {}, {
                status: CONTEXT_FINISHED_STATUS,
            })

            const now = dayjs()
            const currentDay = now.date()
            const PaymPeriod = getQRCodePaymPeriod(qrCodeObj, billingIntegrationContext)

            if (currentDay < periodsEdgeDay) {
                expect(PaymPeriod).toBe(now.subtract(1, 'month').format('MM.YYYY'))
            } else {
                expect(PaymPeriod).toBe(now.format('MM.YYYY'))
            }
        })

        test('When period exists in qr-code', async () => {
            const [o10n] = await createTestOrganization(adminClient)

            const bic = createValidRuRoutingNumber()
            const qrCodeObj = {
                BIC: bic,
                PayerAddress: faker.address.streetAddress(),
                Sum: '10000',
                PersAcc: faker.random.numeric(8),
                PayeeINN: o10n.tin,
                paymPeriod: '07.2023',
                PersonalAcc: createValidRuNumber(bic),
            }

            const periodsEdgeDay = 10

            const { billingIntegrationContext } = await addBillingIntegrationAndContext(adminClient, o10n, {}, {
                status: CONTEXT_FINISHED_STATUS,
                settings: { dv: 1, receiptUploadDate: periodsEdgeDay },
            })

            const PaymPeriod = getQRCodePaymPeriod(qrCodeObj, billingIntegrationContext)

            expect(PaymPeriod).toBe('07.2023')
        })
    })
})
