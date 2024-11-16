/**
 * @jest-environment node
 */

const index = require('@app/condo/index')
const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

const { getRedisClient } = require('@open-condo/keystone/redis')
const { makeLoggedInAdminClient, setFeatureFlag, setFakeClientMode, waitFor } = require('@open-condo/keystone/test.utils')


const { registerBillingReceiptsByTestClient } = require('@condo/domains/billing/utils/testSchema')
const { TestUtils, ResidentTestMixin } = require('@condo/domains/billing/utils/testSchema/testUtils')
const { SEND_BILLING_RECEIPTS_NOTIFICATIONS_TASK } = require('@condo/domains/common/constants/featureflags')
const { _internalScheduleTaskByNameByTestClient } = require('@condo/domains/common/utils/testSchema')
const {
    BILLING_RECEIPT_ADDED_WITH_NO_DEBT_TYPE,
    BILLING_RECEIPT_ADDED_TYPE,
} = require('@condo/domains/notification/constants/constants')
const { Message } = require('@condo/domains/notification/utils/testSchema')
const { FLAT_UNIT_TYPE } = require('@condo/domains/property/constants/common')
const { REDIS_LAST_DATE_KEY, REDIS_LAST_DATE_KEY_PREFIX, BILLING_RECEIPTS_NOTIFIED_USERS_PREFIX } = require('@condo/domains/resident/constants')
const { makeBillingReceiptWithResident } = require('@condo/domains/resident/tasks/helpers/spec.helpers')
const { makeAccountKey, getMessageTypeAndDebt, sendBillingReceiptsAddedNotificationForOrganizationContext } = require('@condo/domains/resident/tasks/sendBillingReceiptsAddedNotificationForOrganizationContextTask')
const { Resident } = require('@condo/domains/resident/utils/testSchema')

describe('sendBillingReceiptsAddedNotificationForOrganizationContext', () => {
    setFakeClientMode(index)
    let redisClient, admin

    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
        redisClient = getRedisClient()
        redisClient.del('LAST_SEND_BILLING_RECEIPT_NOTIFICATION_CREATED_AT')
    })

    describe('notifications', () => {
        test('Should send notification of BILLING_RECEIPT_ADDED_TYPE for toPay > 0', async () => {
            const { receipt, resident, billingContext } = await makeBillingReceiptWithResident({ toPay: '10000', toPayDetails: { charge: '1000', formula: '', balance: '9000', penalty: '0' } } )

            await sendBillingReceiptsAddedNotificationForOrganizationContext({ ...billingContext, organization: billingContext.organization.id }, dayjs(receipt.createdAt).subtract(1, 'hour').toISOString())

            const messageWhere = {
                user: { id: resident.user.id },
                type: BILLING_RECEIPT_ADDED_TYPE,
            }

            const messages = await Message.getAll(admin, messageWhere)
            expect(messages).toHaveLength(1)
            expect(messages[0].organization.id).toEqual(resident.organization.id)
        })

        test('Should send only one notification of BILLING_RECEIPT_ADDED_TYPE for same user but multiple billing receipts', async () => {
            const { receipt, resident, billingContext, residentUser } = await makeBillingReceiptWithResident({ toPay: '10000', toPayDetails: { charge: '1000', formula: '', balance: '9000', penalty: '0' } } )
            const { receipt: receipt1, resident: resident1, billingContext: billingContext1 } = await makeBillingReceiptWithResident({ toPay: '10000', toPayDetails: { charge: '1000', formula: '', balance: '9000', penalty: '0' } }, undefined, residentUser)

            expect(resident.user.id).toEqual(resident1.user.id)
            await sendBillingReceiptsAddedNotificationForOrganizationContext({ ...billingContext, organization: billingContext.organization.id }, dayjs(receipt.createdAt).subtract(1, 'hour').toISOString())
            await sendBillingReceiptsAddedNotificationForOrganizationContext({ ...billingContext1, organization: billingContext1.organization.id }, dayjs(receipt1.createdAt).subtract(1, 'hour').toISOString())

            const messageWhere = {
                user: { id: resident.user.id },
                type: BILLING_RECEIPT_ADDED_TYPE,
            }

            const messages = await Message.getAll(admin, messageWhere)
            expect(messages).toHaveLength(1)
            expect(messages[0].organization.id).toEqual(resident.organization.id)
        })

        test('Should send notification of BILLING_RECEIPT_ADDED_TYPE for toPay > 0 and missing toPayDetails', async () => {
            const { receipt, resident, billingContext } = await makeBillingReceiptWithResident({ toPay: '10000' } )

            await sendBillingReceiptsAddedNotificationForOrganizationContext({ ...billingContext, organization: billingContext.organization.id }, dayjs(receipt.createdAt).subtract(1, 'hour').toISOString())

            const messageWhere = {
                user: { id: resident.user.id },
                type: BILLING_RECEIPT_ADDED_TYPE,
            }

            const messages = await Message.getAll(admin, messageWhere)
            expect(messages).toHaveLength(1)
            expect(messages[0].organization.id).toEqual(resident.organization.id)
        })

        test('Should not send notification of BILLING_RECEIPT_ADDED_WITH_NO_DEBT for toPay = 0.0', async () => {
            const { receipt, resident, billingContext } = await makeBillingReceiptWithResident({ toPay: '0.0' })

            await sendBillingReceiptsAddedNotificationForOrganizationContext({ ...billingContext, organization: billingContext.organization.id }, dayjs(receipt.createdAt).subtract(1, 'hour').toISOString(), undefined)

            const messageWhere = {
                user: { id: resident.user.id },
                type: BILLING_RECEIPT_ADDED_TYPE,
            }

            const messages = await Message.getAll(admin, messageWhere)
            expect(messages).toHaveLength(0)
        })

        test('Should not send notification of BILLING_RECEIPT_ADDED_WITH_NO_DEBT for toPay < 0', async () => {
            const { receipt, resident, billingContext } = await makeBillingReceiptWithResident({ toPay: '-1.0' })

            await sendBillingReceiptsAddedNotificationForOrganizationContext({ ...billingContext, organization: billingContext.organization.id }, dayjs(receipt.createdAt).subtract(1, 'hour').toISOString(), undefined)

            const messageWhere = {
                user: { id: resident.user.id },
                type: BILLING_RECEIPT_ADDED_TYPE,
            }

            const messages = await Message.getAll(admin, messageWhere)
            expect(messages).toHaveLength(0)
        })

        test('Should send only one notification for same receipt', async () => {
            const { receipt, resident, billingContext } = await makeBillingReceiptWithResident()

            await sendBillingReceiptsAddedNotificationForOrganizationContext({ ...billingContext, organization: billingContext.organization.id }, dayjs(receipt.createdAt).subtract(1, 'hour').toISOString())
            await sendBillingReceiptsAddedNotificationForOrganizationContext({ ...billingContext, organization: billingContext.organization.id }, dayjs(receipt.createdAt).subtract(1, 'hour').toISOString())

            const messageWhere = {
                user: { id: resident.user.id },
                type: BILLING_RECEIPT_ADDED_TYPE,
            }

            const messages = await Message.getAll(admin, messageWhere)
            expect(messages).toHaveLength(1)
            expect(messages[0].organization.id).toEqual(resident.organization.id)
        })

        test('Should send nothing for receipt with no ServiceConsumer record', async () => {
            const { receipt, resident, billingContext } = await makeBillingReceiptWithResident({}, true)

            await sendBillingReceiptsAddedNotificationForOrganizationContext({ ...billingContext, organization: billingContext.organization.id }, dayjs(receipt.createdAt).subtract(1, 'hour').toISOString(), undefined)

            const messageWhere = {
                user: { id: resident.user.id },
                type: BILLING_RECEIPT_ADDED_TYPE,
            }

            const messages = await Message.getAll(admin, messageWhere)
            expect(messages).toHaveLength(0)
        })

        test('Should send nothing to deleted resident', async () => {
            const { receipt, resident, billingContext } = await makeBillingReceiptWithResident({ toPay: '10000', toPayDetails: { charge: '1000', formula: '', balance: '9000', penalty: '0' } } )
            const resident1 = await Resident.softDelete(admin, resident.id)

            expect(resident1.deletedAt).not.toBeNull()

            await sendBillingReceiptsAddedNotificationForOrganizationContext({ ...billingContext, organization: billingContext.organization.id }, dayjs(receipt.createdAt).subtract(1, 'hour').toISOString())

            const messageWhere = {
                user: { id: resident.user.id },
                type: BILLING_RECEIPT_ADDED_TYPE,
            }

            const messages = await Message.getAll(admin, messageWhere)
            expect(messages).toHaveLength(0)
        })


        test('Should handle notifications for multiple residents with different debts', async () => {
            const { receipt: receipt1, resident: resident1, billingContext: billingContext1 } = await makeBillingReceiptWithResident({ toPay: '5000' })
            const { receipt: receipt2, resident: resident2, billingContext: billingContext2 } = await makeBillingReceiptWithResident({ toPay: '15000' })

            await sendBillingReceiptsAddedNotificationForOrganizationContext({ ...billingContext1, organization: billingContext1.organization.id }, dayjs(receipt1.createdAt).subtract(1, 'hour').toISOString())
            await sendBillingReceiptsAddedNotificationForOrganizationContext({ ...billingContext2, organization: billingContext2.organization.id }, dayjs(receipt2.createdAt).subtract(1, 'hour').toISOString())

            const messages1 = await Message.getAll(admin, { user: { id: resident1.user.id }, type: BILLING_RECEIPT_ADDED_TYPE })
            const messages2 = await Message.getAll(admin, { user: { id: resident2.user.id }, type: BILLING_RECEIPT_ADDED_TYPE })

            expect(messages1).toHaveLength(1)
            expect(messages2).toHaveLength(1)
            expect(messages1[0].organization.id).toEqual(resident1.organization.id)
            expect(messages2[0].organization.id).toEqual(resident2.organization.id)
        })

        test('Should not create duplicate notifications if task is executed multiple times within the same period', async () => {
            const { receipt, resident, billingContext } = await makeBillingReceiptWithResident({ toPay: '15000' })

            const date = dayjs(receipt.createdAt).subtract(1, 'hour').toISOString()
            await sendBillingReceiptsAddedNotificationForOrganizationContext({ ...billingContext, organization: billingContext.organization.id }, date)
            await sendBillingReceiptsAddedNotificationForOrganizationContext({ ...billingContext, organization: billingContext.organization.id }, date)

            const messageWhere = {
                user: { id: resident.user.id },
                type: BILLING_RECEIPT_ADDED_TYPE,
            }

            const messages = await Message.getAll(admin, messageWhere)
            expect(messages).toHaveLength(1)
            expect(messages[0].organization.id).toEqual(resident.organization.id)
        })

        test('Should not send duplicate notifications from different contexts', async () => {
            const environment = new TestUtils([ResidentTestMixin])
            await environment.init()
            const { receipt, resident, billingContext, residentUser } = await makeBillingReceiptWithResident({ toPay: '5000' }, false)
            const { receipt: receipt1, resident: resident1, billingContext: billingContext1, residentUser: residentUser1 } = await makeBillingReceiptWithResident({ toPay: '5000' }, false, residentUser)

            await registerBillingReceiptsByTestClient(admin, {
                context: { id: billingContext.id },
                receipts: environment.createJSONReceipt(),
            })

            await registerBillingReceiptsByTestClient(admin, {
                context: { id: billingContext1.id },
                receipts: environment.createJSONReceipt(),
            })

            expect(resident.user.id).toEqual(resident1.user.id)
            
            await sendBillingReceiptsAddedNotificationForOrganizationContext({ ...billingContext, organization: billingContext.organization.id }, dayjs(receipt.createdAt).subtract(1, 'hour').toISOString())
            await sendBillingReceiptsAddedNotificationForOrganizationContext({ ...billingContext1, organization: billingContext1.organization.id }, dayjs(receipt1.createdAt).subtract(1, 'hour').toISOString())

            const messageWhere = {
                user: { id: resident.user.id },
                type: BILLING_RECEIPT_ADDED_TYPE,
            }

            const messages = await Message.getAll(admin, messageWhere)
            expect(messages).toHaveLength(1)
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
        let redisClient

        beforeAll(async () => {
            redisClient = getRedisClient()
        })

        beforeEach(async () => {
            setFeatureFlag(SEND_BILLING_RECEIPTS_NOTIFICATIONS_TASK, true)
            redisClient.del(REDIS_LAST_DATE_KEY)
        })

        // test('Should send pushes if no old way redis key', async () => {
        //     const environment = new TestUtils([ResidentTestMixin])
        //     await environment.init()
        //     const accountNumber = faker.random.alphaNumeric(12)
        //
        //     const resident = await environment.createResident({ unitName: '1', unitType: FLAT_UNIT_TYPE })
        //     const addressUnit = {
        //         unitName: resident.unitName,
        //         unitType: resident.unitType,
        //     }
        //     const [receipt] = await environment.createReceipts([
        //         environment.createJSONReceipt({ accountNumber, address: resident.address, addressMeta: addressUnit }),
        //     ])
        //     await environment.createServiceConsumer(resident, accountNumber)
        //     const [res] = await _internalScheduleTaskByNameByTestClient(admin, { taskName: 'sendBillingReceiptNotificationsWorkDaysTask' })
        //     expect(res.id).toBeDefined()
        //
        //     const messageWhere = {
        //         user: { id: resident.user.id },
        //         type: BILLING_RECEIPT_ADDED_TYPE,
        //     }
        //
        //     await waitFor(async () => {
        //         const messages = await Message.getAll(admin, messageWhere)
        //
        //         expect(messages).toHaveLength(1)
        //     }, { delay: 2000 })
        //     await waitFor(async () => {
        //         const lastSync = await redisClient.get(`${REDIS_LAST_DATE_KEY_PREFIX}${receipt[0].context.id}`)
        //         expect(dayjs(lastSync).toISOString()).toEqual(dayjs(receipt[0].context.lastReport.finishTime).toISOString())
        //     }, { delay: 2000 })
        // })

        test('Should send pushes if old way redis key is older than lastReport', async () => {
            const environment = new TestUtils([ResidentTestMixin])
            await environment.init()
            const accountNumber = faker.random.alphaNumeric(12)

            const resident = await environment.createResident({ unitName: '1', unitType: FLAT_UNIT_TYPE })
            const addressUnit = {
                unitName: resident.unitName,
                unitType: resident.unitType,
            }

            await redisClient.set(REDIS_LAST_DATE_KEY, new Date().toISOString())

            const [receipt] = await environment.createReceipts([
                environment.createJSONReceipt({ accountNumber, address: resident.address, addressMeta: addressUnit }),
            ])
            await environment.createServiceConsumer(resident, accountNumber)
            const [res] = await _internalScheduleTaskByNameByTestClient(admin, { taskName: 'sendBillingReceiptNotificationsWorkDaysTask' })
            expect(res.id).toBeDefined()

            const messageWhere = {
                user: { id: resident.user.id },
                type: BILLING_RECEIPT_ADDED_TYPE,
            }

            await waitFor(async () => {
                const messages = await Message.getAll(admin, messageWhere)

                expect(messages).toHaveLength(1)
            }, { delay: 2000 })
            await waitFor(async () => {
                const lastSync = await redisClient.get(`${REDIS_LAST_DATE_KEY_PREFIX}${receipt[0].context.id}`)
                expect(dayjs(lastSync).toISOString()).toEqual(dayjs(receipt[0].context.lastReport.finishTime).toISOString())
            }, { delay: 2000 })
        })

        test('Should not send pushes if old way redis key is newer than lastReport', async () => {
            const environment = new TestUtils([ResidentTestMixin])
            await environment.init()
            const accountNumber = faker.random.alphaNumeric(12)

            const resident = await environment.createResident({ unitName: '1', unitType: FLAT_UNIT_TYPE })
            const addressUnit = {
                unitName: resident.unitName,
                unitType: resident.unitType,
            }

            await environment.createReceipts([
                environment.createJSONReceipt({ accountNumber, address: resident.address, addressMeta: addressUnit }),
            ])

            await redisClient.set(REDIS_LAST_DATE_KEY, new Date().toISOString())

            await environment.createServiceConsumer(resident, accountNumber)
            const [res] = await _internalScheduleTaskByNameByTestClient(admin, { taskName: 'sendBillingReceiptNotificationsWorkDaysTask' })
            expect(res.id).toBeDefined()

            const messageWhere = {
                user: { id: resident.user.id },
                type: BILLING_RECEIPT_ADDED_TYPE,
            }

            await waitFor(async () => {
                const message = await Message.getOne(admin, messageWhere)

                expect(message).toBeUndefined()
            }, { delay: 2000 })
        })

        test('Should send only one push for one user with different residents', async () => {
            const environment = new TestUtils([ResidentTestMixin])
            await environment.init()
            const utilsForContext = new TestUtils([ResidentTestMixin])
            await utilsForContext.init()
            const accountNumber1 = faker.random.alphaNumeric(12)
            const accountNumber2 = faker.random.alphaNumeric(12)

            const resident1 = await environment.createResident({ unitName: '1', unitType: FLAT_UNIT_TYPE })
            const resident2 = await environment.createResident({ unitName: '2', unitType: FLAT_UNIT_TYPE })

            const addressUnitForResident1 = {
                unitName: resident1.unitName,
                unitType: resident1.unitType,
            }

            const addressUnitForResident2 = {
                unitName: resident2.unitName,
                unitType: resident2.unitType,
            }

            await environment.createReceipts([
                environment.createJSONReceipt({ accountNumber: accountNumber1, address: resident1.address, addressMeta: addressUnitForResident1 }),
            ])

            environment.context = utilsForContext.context

            await environment.createReceipts([
                environment.createJSONReceipt({ accountNumber: accountNumber2, address: resident2.address, addressMeta: addressUnitForResident2 }),
            ])

            await environment.createServiceConsumer(resident1, accountNumber1)
            await environment.createServiceConsumer(resident2, accountNumber2)

            const [res] = await _internalScheduleTaskByNameByTestClient(admin, { taskName: 'sendBillingReceiptNotificationsWorkDaysTask' })
            expect(res.id).toBeDefined()
            expect(resident1.user.id ).toEqual(resident2.user.id )

            const messageWhere = {
                user: { id: resident1.user.id },
                type: BILLING_RECEIPT_ADDED_TYPE,
            }

            await waitFor(async () => {
                const messages = await Message.getAll(admin, messageWhere)

                expect(messages).toHaveLength(1)
            }, { delay: 2000 })
        })

        test('Should not send pushes more often than USER_BILLING_RECEIPT_NOTIFICATION_PERIOD_IN_SEC time', async () => {
            const environment = new TestUtils([ResidentTestMixin])
            await environment.init()
            const accountNumber = faker.random.alphaNumeric(12)

            const resident = await environment.createResident({ unitName: '1', unitType: FLAT_UNIT_TYPE })
            const addressUnit = {
                unitName: resident.unitName,
                unitType: resident.unitType,
            }

            await environment.createReceipts([
                environment.createJSONReceipt({ accountNumber, address: resident.address, addressMeta: addressUnit }),
            ])

            const messageWhere = {
                user: { id: resident.user.id },
                type: BILLING_RECEIPT_ADDED_TYPE,
            }

            await environment.createServiceConsumer(resident, accountNumber)
            const [res1] = await _internalScheduleTaskByNameByTestClient(admin, { taskName: 'sendBillingReceiptNotificationsWorkDaysTask' })
            expect(res1.id).toBeDefined()

            await waitFor(async () => {
                const messages = await Message.getAll(admin, messageWhere)

                expect(messages).toHaveLength(1)
            }, { delay: 2000 })

            await environment.createReceipts([
                environment.createJSONReceipt({ accountNumber, address: resident.address, addressMeta: addressUnit }),
            ])

            const [res2] = await _internalScheduleTaskByNameByTestClient(admin, { taskName: 'sendBillingReceiptNotificationsWorkDaysTask' })
            expect(res2.id).toBeDefined()

            await waitFor(async () => {
                const messages = await Message.getAll(admin, messageWhere)

                expect(messages).toHaveLength(1)
            }, { delay: 2000 })

            await redisClient.del(BILLING_RECEIPTS_NOTIFIED_USERS_PREFIX + resident.user.id)

            await environment.createReceipts([
                environment.createJSONReceipt({ accountNumber, address: resident.address, addressMeta: addressUnit }),
            ])

            const [res3] = await _internalScheduleTaskByNameByTestClient(admin, { taskName: 'sendBillingReceiptNotificationsWorkDaysTask' })
            expect(res3.id).toBeDefined()

            await waitFor(async () => {
                const messages = await Message.getAll(admin, messageWhere)

                expect(messages).toHaveLength(2)
            }, { delay: 2000 })
        })
    })
})