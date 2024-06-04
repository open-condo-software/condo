/**
 * @jest-environment node
 */
const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const Big = require('big.js')

const { getById } = require('@open-condo/keystone/schema')
const { catchErrorFrom, setFakeClientMode, makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')

const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/acquiring/constants/context')
const { addAcquiringIntegrationAndContext } = require('@condo/domains/acquiring/utils/testSchema')
const { createTestBankAccount } = require('@condo/domains/banking/utils/testSchema')
const {
    createValidRuRoutingNumber,
    createValidRuNumber,
} = require('@condo/domains/banking/utils/testSchema/bankAccount')
const { createTestOrganization } = require('@condo/domains/organization/utils/testSchema')
const { createTestProperty } = require('@condo/domains/property/utils/testSchema')

const {
    getQRCodeMissedFields,
    parseReceiptQRCode,
    formatPeriodFromQRCode,
    compareQRCodeWithLastReceipt,
    findAuxiliaryData,
} = require('./receiptQRCodeUtils')
const {
    addBillingIntegrationAndContext,
    createTestBillingProperty,
    createTestBillingAccount,
    createTestBillingRecipient, createTestBillingReceipt, createTestRecipient,
} = require('./testSchema')

describe('receiptQRCodeUtils', () => {

    let adminClient

    setFakeClientMode(index, { excludeApps: ['NextApp', 'AdminUIApp', 'OIDCMiddleware'] })

    beforeAll(async () => {
        adminClient = await makeLoggedInAdminClient()
    })

    test('QR-code fields parsed correctly', () => {
        const parsed = parseReceiptQRCode('ST00012|field1=Hello|Field2=world|foo=bar baz')
        expect(parsed).toEqual({
            field1: 'Hello',
            Field2: 'world',
            foo: 'bar baz',
        })
    })

    test('must throw an error on invalid QR-code', async () => {
        await catchErrorFrom(
            async () => {
                parseReceiptQRCode('ST0012|field1=Hello|Field2=world')
            },
            (err) => {
                expect(err).toEqual(expect.objectContaining({ message: 'Invalid QR code' }))
            },
        )
    })

    test('check for required fields', () => {
        const parsed = parseReceiptQRCode('ST00012|field1=Hello|Field2=world|foo=bar baz')
        const missedFields = getQRCodeMissedFields(parsed)

        expect(missedFields).toEqual(['BIC', 'PayerAddress', 'PaymPeriod', 'Sum', 'PersAcc', 'PayeeINN', 'PersonalAcc'])
    })

    test('format period from QR-code', () => {
        expect(formatPeriodFromQRCode('05.2024')).toBe('2024-05-01')
    })

    describe('resolvers', () => {

        /** @type {TQRCodeFields} */
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
})
