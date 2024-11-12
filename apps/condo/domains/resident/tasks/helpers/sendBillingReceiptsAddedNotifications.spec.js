/**
 * @jest-environment node
 */

const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const { getRedisClient } = require('@open-condo/keystone/redis')
const { setFakeClientMode, makeLoggedInAdminClient, waitFor, setAllFeatureFlags} = require('@open-condo/keystone/test.utils')

const { TestUtils, ResidentTestMixin } = require('@condo/domains/billing/utils/testSchema/testUtils')
const { _internalScheduleTaskByNameByTestClient } = require('@condo/domains/common/utils/testSchema')
const {
    BILLING_RECEIPT_ADDED_WITH_NO_DEBT_TYPE,
    BILLING_RECEIPT_ADDED_TYPE,
} = require('@condo/domains/notification/constants/constants')
const { Message } = require('@condo/domains/notification/utils/testSchema')
const { FLAT_UNIT_TYPE } = require('@condo/domains/property/constants/common')
const { Resident } = require('@condo/domains/resident/utils/testSchema')

const { makeBillingReceiptWithResident } = require('./spec.helpers')

const { makeMessageKey, makeAccountKey, getMessageTypeAndDebt, sendBillingReceiptsAddedNotificationForOrganizationContext } = require('../sendBillingReceiptsAddedNotificationForOrganizationContextTask')


describe('sendBillingReceiptsAddedNotificationForOrganizationContext', () => {
    setFakeClientMode(index)
    let admin
    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
    })
    describe('notifications', () => {
        it('sends notification of BILLING_RECEIPT_ADDED_TYPE for toPay > 0', async () => {
            const { receipt, resident, billingContext } = await makeBillingReceiptWithResident({ toPay: '10000', toPayDetails: { charge: '1000', formula: '', balance: '9000', penalty: '0' } } )

            await sendBillingReceiptsAddedNotificationForOrganizationContext({ ...billingContext, organization: billingContext.organization.id }, dayjs(receipt.createdAt).subtract(1, 'hour').toISOString(), 'testTaskId')

            const notificationKey = makeMessageKey('testTaskId', receipt.period, receipt.account.number, receipt.category.id, resident.id)
            const messageWhere = {
                type: BILLING_RECEIPT_ADDED_TYPE,
                uniqKey: notificationKey,
            }
            const message = await Message.getOne(admin, messageWhere)
            expect(message).not.toBeUndefined()
            expect(message.organization.id).toEqual(resident.organization.id)
        })

        it('sends only one notification of BILLING_RECEIPT_ADDED_TYPE for same user but multiple billing receipts', async () => {
            const { receipt, resident, billingContext, residentUser } = await makeBillingReceiptWithResident({ toPay: '10000', toPayDetails: { charge: '1000', formula: '', balance: '9000', penalty: '0' } } )
            const { receipt: receipt1, resident: resident1, billingContext: billingContext1 } = await makeBillingReceiptWithResident({ toPay: '10000', toPayDetails: { charge: '1000', formula: '', balance: '9000', penalty: '0' } }, undefined, residentUser)

            expect(resident.user.id).toEqual(resident1.user.id)

            await sendBillingReceiptsAddedNotificationForOrganizationContext({ ...billingContext, organization: billingContext.organization.id }, dayjs(receipt.createdAt).subtract(1, 'hour').toISOString(), 'testTaskId')
            await sendBillingReceiptsAddedNotificationForOrganizationContext({ ...billingContext1, organization: billingContext1.organization.id }, dayjs(receipt1.createdAt).subtract(1, 'hour').toISOString(), 'testTaskId')

            const notificationKey = makeMessageKey('testTaskId', receipt.period, receipt.account.number, receipt.category.id, resident.id)
            const notificationKey1 = makeMessageKey(receipt1.period, receipt1.account.number, receipt1.category.id, resident1.id)
            const messageWhere = {
                type: BILLING_RECEIPT_ADDED_TYPE,
                uniqKey_in: [notificationKey, notificationKey1],
            }
            const messages = await Message.getAll(admin, messageWhere)

            expect(messages).toHaveLength(1)
            expect(messages[0].organization.id).toEqual(resident.organization.id)
        })


        it('sends notification of BILLING_RECEIPT_ADDED_TYPE for toPay > 0 and missing toPayDetails', async () => {
            const { receipt, resident, billingContext } = await makeBillingReceiptWithResident({ toPay: '10000' } )

            await sendBillingReceiptsAddedNotificationForOrganizationContext({ ...billingContext, organization: billingContext.organization.id }, dayjs(receipt.createdAt).subtract(1, 'hour').toISOString(), 'testTaskId')

            const notificationKey = makeMessageKey('testTaskId', receipt.period, receipt.account.number, receipt.category.id, resident.id)
            const messageWhere = {
                type: BILLING_RECEIPT_ADDED_TYPE,
                uniqKey: notificationKey,
            }
            const message = await Message.getOne(admin, messageWhere)

            expect(message).not.toBeUndefined()
            expect(message.organization.id).toEqual(resident.organization.id)
        })

        it('does not send notification of BILLING_RECEIPT_ADDED_WITH_NO_DEBT for toPay = 0.0', async () => {
            const { receipt, resident, billingContext } = await makeBillingReceiptWithResident({ toPay: '0.0' })

            await sendBillingReceiptsAddedNotificationForOrganizationContext({ ...billingContext, organization: billingContext.organization.id }, dayjs(receipt.createdAt).subtract(1, 'hour').toISOString(), undefined, 'testTaskId')

            const notificationKey = makeMessageKey('testTaskId', receipt.period, receipt.account.number, receipt.category.id, resident.id)
            const messageWhere = {
                type: BILLING_RECEIPT_ADDED_WITH_NO_DEBT_TYPE,
                uniqKey: notificationKey,
            }
            const message = await Message.getOne(admin, messageWhere)

            expect(message).toBeUndefined()
        })

        it('does not send notification of BILLING_RECEIPT_ADDED_WITH_NO_DEBT for toPay < 0', async () => {
            const { receipt, resident, billingContext } = await makeBillingReceiptWithResident({ toPay: '-1.0' })

            await sendBillingReceiptsAddedNotificationForOrganizationContext({ ...billingContext, organization: billingContext.organization.id }, dayjs(receipt.createdAt).subtract(1, 'hour').toISOString(), undefined, 'testTaskId')

            const notificationKey = makeMessageKey('testTaskId', receipt.period, receipt.account.number, receipt.category.id, resident.id)
            const messageWhere = {
                type: BILLING_RECEIPT_ADDED_WITH_NO_DEBT_TYPE,
                uniqKey: notificationKey,
            }
            const message = await Message.getOne(admin, messageWhere)

            expect(message).toBeUndefined()
        })

        it('sends only one notification for same receipt', async () => {
            const { receipt, resident, billingContext } = await makeBillingReceiptWithResident()

            await sendBillingReceiptsAddedNotificationForOrganizationContext({ ...billingContext, organization: billingContext.organization.id }, dayjs(receipt.createdAt).subtract(1, 'hour').toISOString(), 'testTaskId')
            await sendBillingReceiptsAddedNotificationForOrganizationContext({ ...billingContext, organization: billingContext.organization.id }, dayjs(receipt.createdAt).subtract(1, 'hour').toISOString(), 'testTaskId')

            const notificationKey = makeMessageKey('testTaskId', receipt.period, receipt.account.number, receipt.category.id, resident.id)
            const messageWhere = {
                type: BILLING_RECEIPT_ADDED_TYPE,
                uniqKey: notificationKey,
            }
            const messages = await Message.getAll(admin, messageWhere)

            expect(messages).toHaveLength(1)
            expect(messages[0].organization.id).toEqual(resident.organization.id)
        })

        it('sends nothing for receipt with no ServiceConsumer record', async () => {
            const { receipt, resident, billingContext } = await makeBillingReceiptWithResident({}, true)

            await sendBillingReceiptsAddedNotificationForOrganizationContext({ ...billingContext, organization: billingContext.organization.id }, dayjs(receipt.createdAt).subtract(1, 'hour').toISOString(), undefined, 'testTaskId')

            const notificationKey = makeMessageKey('testTaskId', receipt.period, receipt.account.number, receipt.category.id, resident.id)
            const messageWhere = {
                type: BILLING_RECEIPT_ADDED_TYPE,
                uniqKey: notificationKey,
            }
            const message = await Message.getOne(admin, messageWhere)

            expect(message).toBeUndefined()
        })

        it('sends nothing to deleted resident', async () => {
            const { receipt, resident, billingContext } = await makeBillingReceiptWithResident({ toPay: '10000', toPayDetails: { charge: '1000', formula: '', balance: '9000', penalty: '0' } } )
            const resident1 = await Resident.softDelete(admin, resident.id)

            expect(resident1.deletedAt).not.toBeNull()

            await sendBillingReceiptsAddedNotificationForOrganizationContext({ ...billingContext, organization: billingContext.organization.id }, dayjs(receipt.createdAt).subtract(1, 'hour').toISOString(), 'testTaskId')

            const notificationKey = makeMessageKey('testTaskId', receipt.period, receipt.account.number, receipt.category.id, resident.id)
            const messageWhere = {
                type: BILLING_RECEIPT_ADDED_TYPE,
                uniqKey: notificationKey,
            }
            const message = await Message.getOne(admin, messageWhere)

            expect(message).toBeUndefined()
        })

    })

    describe('Helper functions', () => {
        it('calculates correct messageType and debt for toPay <= 0', () => {
            const { messageType, debt } = getMessageTypeAndDebt(0, 0)

            expect(messageType).toEqual(BILLING_RECEIPT_ADDED_WITH_NO_DEBT_TYPE)
            expect(debt).toEqual(0)
        })

        it('calculates correct messageType and debt for toPay > 0 and toPayCharge > 0', () => {
            const { messageType, debt } = getMessageTypeAndDebt(10000, 1000)

            expect(messageType).toEqual(BILLING_RECEIPT_ADDED_TYPE)
            expect(debt).toBeNull()
        })

        it('calculates correct messageType and debt for toPay > 0 and toPaycharge === null', () => {
            const { messageType, debt } = getMessageTypeAndDebt(10000, null)

            expect(messageType).toEqual(BILLING_RECEIPT_ADDED_TYPE)
            expect(debt).toBeNull()
        })

        it('calculates correct accountKey', () => {
            const key = makeAccountKey('   AAAA   ', '    bBbB    ', ' ccCC 19    ')
            const key1 = makeAccountKey('   ББББ   ', '    ГггГ    ', ' ддДД 23    ')

            expect(key).toEqual('aaaa:bbbb:cccc 19')
            expect(key1).toEqual('бббб:гггг:дддд 23')
        })
    })

    describe('Real-life test cases', () => {
        let environment, redisClient
        beforeAll(async () => {
            environment = new TestUtils([ResidentTestMixin])
            await environment.init()
            redisClient = getRedisClient()
        })

        it('send push after RegisterBillingReceipts', async () => {
            const accountNumber = faker.random.alphaNumeric(12)

            const resident = await environment.createResident({ unitName: '1', unitType: FLAT_UNIT_TYPE })
            const addressUnit = {
                unitName: resident.unitName,
                unitType: resident.unitType,
            }
            const [receipt] = await environment.createReceipts([
                environment.createJSONReceipt({ accountNumber, address: resident.address, addressMeta: addressUnit }),
            ])
            const [serviceConsumer] = await environment.createServiceConsumer(resident, accountNumber)

            const [res] = await _internalScheduleTaskByNameByTestClient(admin, { taskName: 'sendBillingReceiptNotificationsWorkDaysTask' })
            expect(res.id).toBeDefined()

            const messageWhere = {
                user: { id: resident.user.id },
                type: BILLING_RECEIPT_ADDED_TYPE,
            }

            // Doesn't work due to feature flag
            await waitFor(async () => {
                const message = await Message.getOne(admin, messageWhere)

                expect(message.id).toBeDefined()
            }, { delay: 2 * 1000 })
            await waitFor(async () => {
                const lastSync = await redisClient.get(`LAST_SEND_BILLING_RECEIPT_NOTIFICATION_CREATED_AT:${receipt[0].context.id}`)
                expect(dayjs(lastSync).toISOString()).toEqual(dayjs(receipt[0].context.lastReport.finishTime).toISOString())
            }, { delay: 2 * 1000 })
        })

    })
})