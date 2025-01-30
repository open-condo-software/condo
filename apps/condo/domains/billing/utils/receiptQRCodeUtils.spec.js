/**
 * @jest-environment node
 */
const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const Big = require('big.js')
const dayjs = require('dayjs')
const iconv = require('iconv-lite')

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

const { keystone } = index

const TEST_STRING = 'ST00011|Name=ООО «УК ЭкоГрад»|PersonalAcc=40902830202010056769|BankName=ПАО СБЕРБАНК|BIC=048073601|CorrespAcc=30102110300320000206|PayeeINN=0524967340|persAcc=5018435412|payerAddress=ул.Ивана Спатара, д.14, кв.32|lastName=Иванов|firstName=Иван|middleName=Иванович|Sum=12351'

describe('receiptQRCodeUtils', () => {

    const parseRUReceiptQRCode = getCountrySpecificQRCodeParser(RUSSIA_COUNTRY)

    let context
    let adminClient

    setFakeClientMode(index, { excludeApps: ['NextApp', 'AdminUIApp', 'OIDCMiddleware'] })

    beforeAll(async () => {
        context = await keystone.createContext({ skipAccessControl: true })
        adminClient = await makeLoggedInAdminClient()
    })

    describe('RU QR-codes decoded correctly', () => {
        const cases = [ // Got from real QR-code
            // [testName, testData]
            ['utf-8', iconv.encode(TEST_STRING, 'UTF-8').toString('base64')],
            ['cp1251', iconv.encode(TEST_STRING, 'cp1251').toString('base64')],
        ]

        test.each(cases)('from %p', (testName, qrStr) => {
            const parsed = parseRUReceiptQRCode(qrStr)
            expect(parsed).toEqual({
                'Name': 'ООО «УК ЭкоГрад»',
                'PersonalAcc': '40902830202010056769',
                'BankName': 'ПАО СБЕРБАНК',
                'BIC': '048073601',
                'CorrespAcc': '30102110300320000206',
                'PayeeINN': '0524967340',
                'persAcc': '5018435412',
                'payerAddress': 'ул.Ивана Спатара, д.14, кв.32',
                'lastName': 'Иванов',
                'firstName': 'Иван',
                'middleName': 'Иванович',
                'Sum': '12351',
            })
        })
    })

    test('must throw an error on invalid QR-code', async () => {
        await catchErrorFrom(
            async () => {
                parseRUReceiptQRCode(iconv.encode('ST0012|field1=Hello|Field2=world', 'UTF-8').toString('base64'))
            },
            (err) => {
                expect(err).toEqual(expect.objectContaining({ message: 'Invalid QR code' }))
            },
        )
    })

    test('can get field case-insensitively', () => {
        const qrStr = Buffer.from('ST00012|field1=Hello|Field2=world|someField=!!').toString('base64')
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
        const qrStr = Buffer.from('ST00012|field1=Hello|Field2=world|someField=!!|paymPeriod=01.2024').toString('base64')
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
        const parsed = parseRUReceiptQRCode(Buffer.from('ST00012|field1=Hello|Field2=world|foo=bar baz').toString('base64'))
        const missedFields = getQRCodeMissedFields(parsed)

        expect(missedFields).toEqual(['BIC', 'Sum', 'PersAcc', 'PayeeINN', 'PersonalAcc'])
    })

    test('check for required fields except one', () => {
        const parsed = parseRUReceiptQRCode(Buffer.from('ST00012|field1=Hello|Field2=world|foo=bar baz|persAcc=01.2024').toString('base64'))
        const missedFields = getQRCodeMissedFields(parsed)

        expect(missedFields).toEqual(['BIC', 'Sum', 'PayeeINN', 'PersonalAcc'])
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
                await compareQRCodeWithLastReceipt(context, qrCodeObj, resolvers)

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

                billingReceiptForComparison = {
                    id: billingReceipt.id,
                    period: billingReceipt.period,
                    toPay: billingReceipt.toPay,
                }
            })

            test('last billing receipt period equals qr-code period', async () => {
                const resolvers = {
                    onNoReceipt: jest.fn(),
                    onReceiptPeriodEqualsQrCodePeriod: jest.fn(),
                    onReceiptPeriodNewerThanQrCodePeriod: jest.fn(),
                    onReceiptPeriodOlderThanQrCodePeriod: jest.fn(),
                }
                await compareQRCodeWithLastReceipt(context, qrCodeObj, resolvers)

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
                await compareQRCodeWithLastReceipt(context, { ...qrCodeObj, PaymPeriod: '05.2024' }, resolvers)

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
                await compareQRCodeWithLastReceipt(context, { ...qrCodeObj, PaymPeriod: '07.2024' }, resolvers)

                expect(resolvers.onNoReceipt).toBeCalledTimes(0)
                expect(resolvers.onReceiptPeriodEqualsQrCodePeriod).toBeCalledTimes(0)
                expect(resolvers.onReceiptPeriodNewerThanQrCodePeriod).toBeCalledTimes(0)
                expect(resolvers.onReceiptPeriodOlderThanQrCodePeriod).toBeCalledTimes(1)

                expect(resolvers.onReceiptPeriodOlderThanQrCodePeriod).toHaveBeenCalledWith(billingReceiptForComparison)
            })
        })
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
