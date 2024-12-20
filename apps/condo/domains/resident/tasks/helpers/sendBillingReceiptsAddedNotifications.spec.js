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
const {
    BILLING_RECEIPT_ADDED_WITH_NO_DEBT_TYPE,
    BILLING_RECEIPT_ADDED_TYPE,
} = require('@condo/domains/notification/constants/constants')
const { Message } = require('@condo/domains/notification/utils/testSchema')
const { FLAT_UNIT_TYPE } = require('@condo/domains/property/constants/common')
const { LAST_SEND_BILLING_RECEIPT_NOTIFICATION_DATE } = require('@condo/domains/resident/constants')
const { sendBillingReceiptNotifications, sendBillingReceiptsAddedNotifications } = require('@condo/domains/resident/tasks/helpers')
const { makeBillingReceiptWithResident } = require('@condo/domains/resident/tasks/helpers/spec.helpers')
const { makeAccountKey, getMessageTypeAndDebt, sendBillingReceiptsAddedNotificationForOrganizationContext } = require('@condo/domains/resident/tasks/sendBillingReceiptsAddedNotificationForOrganizationContextTask')
const { Resident } = require('@condo/domains/resident/utils/testSchema')
const { User } = require('@condo/domains/user/utils/testSchema')

describe('sendBillingReceiptsAddedNotificationForOrganizationContext', () => {
    setFakeClientMode(index)
    let admin

    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
    })

    describe('notifications', () => {
        test('Should not send push to deleted user', async () => {
            const { receipt, resident, billingContext } = await makeBillingReceiptWithResident({ toPay: '10000', toPayDetails: { charge: '1000', formula: '', balance: '9000', penalty: '0' } } )
            await User.softDelete(admin, resident.user.id)
            await sendBillingReceiptsAddedNotificationForOrganizationContext({ ...billingContext, organization: billingContext.organization.id }, dayjs(receipt.createdAt).subtract(1, 'hour').toISOString())

            const messageWhere = {
                user: { id: resident.user.id },
                type: BILLING_RECEIPT_ADDED_TYPE,
            }

            const messages = await Message.getAll(admin, messageWhere)
            expect(messages).toHaveLength(0)
        })

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

            await sendBillingReceiptsAddedNotificationForOrganizationContext({ ...billingContext, organization: billingContext.organization.id }, dayjs(receipt.createdAt).subtract(1, 'hour').toISOString())

            const messageWhere = {
                user: { id: resident.user.id },
                type: BILLING_RECEIPT_ADDED_TYPE,
            }

            const messages = await Message.getAll(admin, messageWhere)
            expect(messages).toHaveLength(0)
        })

        test('Should not send notification of BILLING_RECEIPT_ADDED_WITH_NO_DEBT for toPay < 0', async () => {
            const { receipt, resident, billingContext } = await makeBillingReceiptWithResident({ toPay: '-1.0' })

            await sendBillingReceiptsAddedNotificationForOrganizationContext({ ...billingContext, organization: billingContext.organization.id }, dayjs(receipt.createdAt).subtract(1, 'hour').toISOString())

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

            await sendBillingReceiptsAddedNotificationForOrganizationContext({ ...billingContext, organization: billingContext.organization.id }, dayjs(receipt.createdAt).subtract(1, 'hour').toISOString())

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
        const redisClient = getRedisClient()

        beforeAll(async () => {
            setFeatureFlag(SEND_BILLING_RECEIPTS_NOTIFICATIONS_TASK, true)
        })

        beforeEach(async () => {
            redisClient.del(LAST_SEND_BILLING_RECEIPT_NOTIFICATION_DATE)
        })

        test('Should send push if user have receipts', async () => {
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
            await environment.createServiceConsumer(resident, accountNumber)
            await sendBillingReceiptsAddedNotifications(dayjs().subtract(1, 'h').toISOString())

            const messageWhere = {
                user: { id: resident.user.id },
                type: BILLING_RECEIPT_ADDED_TYPE,
            }

            await waitFor(async () => {
                const messages = await Message.getAll(environment.clients.admin, messageWhere)

                expect(messages).toHaveLength(1)
            }, { delay: 2000 })
        })

        test('Should not send push for old lastReport', async () => {
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
            await environment.createServiceConsumer(resident, accountNumber)
            await sendBillingReceiptsAddedNotifications(dayjs().add(1, 'h').toISOString())

            const messageWhere = {
                user: { id: resident.user.id },
                type: BILLING_RECEIPT_ADDED_TYPE,
            }

            await waitFor(async () => {
                const messages = await Message.getAll(environment.clients.admin, messageWhere)

                expect(messages).toHaveLength(0)
            }, { delay: 2000 })
        })

        test('Should send only one push for one user with different residents', async () => {
            await redisClient.set(LAST_SEND_BILLING_RECEIPT_NOTIFICATION_DATE, dayjs().toISOString())
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

            await sendBillingReceiptsAddedNotifications(dayjs().subtract(1, 'h').toISOString())
            expect(resident1.user.id ).toEqual(resident2.user.id )

            const messageWhere = {
                user: { id: resident1.user.id },
                type: BILLING_RECEIPT_ADDED_TYPE,
            }

            await waitFor(async () => {
                const messages = await Message.getAll(environment.clients.admin, messageWhere)

                expect(messages).toHaveLength(1)
            }, { delay: 2000 })
        })

        test('Should not send pushes more often than one time a day', async () => {
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

            await sendBillingReceiptsAddedNotifications(dayjs().subtract(1, 'h').toISOString())

            await waitFor(async () => {
                const messages = await Message.getAll(environment.clients.admin, messageWhere)

                expect(messages).toHaveLength(1)
            }, { delay: 2000 })

            await environment.createReceipts([
                environment.createJSONReceipt({ accountNumber, address: resident.address, addressMeta: addressUnit }),
            ])

            await sendBillingReceiptsAddedNotifications(dayjs().toISOString())

            await waitFor(async () => {
                const messages = await Message.getAll(environment.clients.admin, messageWhere)

                expect(messages).toHaveLength(1)
            }, { delay: 2000 })
        })

        test('Should not create subtasks and just add redisKey if cron task is started for the first time', async () => {
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
            await environment.createServiceConsumer(resident, accountNumber)

            await sendBillingReceiptNotifications()
            const messageWhere = {
                user: { id: resident.user.id },
                type: BILLING_RECEIPT_ADDED_TYPE,
            }

            await waitFor(async () => {
                const messages = await Message.getAll(environment.clients.admin, messageWhere)

                expect(messages).toHaveLength(0)
            }, { delay: 2000 })
        })

        test('Should create subtask if redis key exists', async () => {
            await redisClient.set(LAST_SEND_BILLING_RECEIPT_NOTIFICATION_DATE, dayjs().toISOString())
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
            await environment.createServiceConsumer(resident, accountNumber)

            await sendBillingReceiptNotifications(dayjs().toISOString())

            const messageWhere = {
                user: { id: resident.user.id },
                type: BILLING_RECEIPT_ADDED_TYPE,
            }

            await waitFor(async () => {
                const messages = await Message.getAll(environment.clients.admin, messageWhere)

                expect(messages).toHaveLength(1)
            }, { delay: 2000 })
        })

        test('Should send push if next day came', async () => {
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
                deletedAt: null,
            }
            await environment.createServiceConsumer(resident, accountNumber)

            await sendBillingReceiptsAddedNotifications(dayjs().subtract(1, 'h').toISOString())
            let firstMessageId = null
            await waitFor(async () => {
                const messages = await Message.getAll(environment.clients.admin, messageWhere)
                expect(messages).toHaveLength(1)
                firstMessageId = messages[0].id
                await Message.softDelete(environment.clients.admin, firstMessageId)
            }, { delay: 2000 })

            await environment.createReceipts([
                environment.createJSONReceipt({ accountNumber, address: resident.address, addressMeta: addressUnit }),
            ])

            await sendBillingReceiptsAddedNotifications(dayjs().subtract(1, 'h').toISOString())

            await waitFor(async () => {
                const messages = await Message.getAll(environment.clients.admin, messageWhere)

                expect(messages).toHaveLength(1)
                expect(messages[0].id).not.toEqual(firstMessageId)
            }, { delay: 2000 })
        })

        test('Should send push if new receipts were loaded when user already got push', async () => {
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
                environment.createJSONReceipt({ accountNumber, address: resident.address, addressMeta: addressUnit }),
                environment.createJSONReceipt({ accountNumber, address: resident.address, addressMeta: addressUnit }),
            ])

            const messageWhere = {
                user: { id: resident.user.id },
                type: BILLING_RECEIPT_ADDED_TYPE,
                deletedAt: null,
            }
            await environment.createServiceConsumer(resident, accountNumber)

            await waitFor(async () => {
                await sendBillingReceiptsAddedNotifications(dayjs().subtract(1, 'h').toISOString())
            }, { delay: 500 })

            await environment.createReceipts([
                environment.createJSONReceipt({ accountNumber, address: resident.address, addressMeta: addressUnit }),
                environment.createJSONReceipt({ accountNumber, address: resident.address, addressMeta: addressUnit }),
                environment.createJSONReceipt({ accountNumber, address: resident.address, addressMeta: addressUnit }),
            ])

            let firstMessageId = null

            await waitFor(async () => {
                const messages = await Message.getAll(environment.clients.admin, messageWhere)
                expect(messages).toHaveLength(1)
                firstMessageId = messages[0].id
                await Message.softDelete(environment.clients.admin, firstMessageId)
            }, { delay: 2000 })

            await sendBillingReceiptsAddedNotifications(dayjs().subtract(1, 'h').toISOString())

            await waitFor(async () => {
                const messages = await Message.getAll(environment.clients.admin, messageWhere)

                expect(messages).toHaveLength(1)
                expect(messages[0].id).not.toEqual(firstMessageId)
            }, { delay: 2000 })
        })

        test('Should not send push for archive receipts', async () => {
            const environment = new TestUtils([ResidentTestMixin])
            await environment.init()
            const accountNumber = faker.random.alphaNumeric(12)

            const resident = await environment.createResident({ unitName: '1', unitType: FLAT_UNIT_TYPE })
            const addressUnit = {
                unitName: resident.unitName,
                unitType: resident.unitType,
            }
            const [ receipts ] = await environment.createReceipts([
                environment.createJSONReceipt({ accountNumber, address: resident.address, addressMeta: addressUnit, year: 2024, month: 1 }),
                environment.createJSONReceipt({ accountNumber, address: resident.address, addressMeta: addressUnit, year: 2024, month: 2 }),
            ])
            await environment.createServiceConsumer(resident, accountNumber)
            await sendBillingReceiptsAddedNotifications(dayjs().subtract(1, 'h').toISOString())

            const messageWhere = {
                user: { id: resident.user.id },
                type: BILLING_RECEIPT_ADDED_TYPE,
            }

            await waitFor(async () => {
                const messages = await Message.getAll(environment.clients.admin, messageWhere)
                expect(messages).toHaveLength(1)
                expect(messages[0].meta.data.billingReceiptId).toEqual(receipts.filter(r => r.period === '2024-02-01')[0].id)
            }, { delay: 2000 })
        })

        test('Should send pushes for several users in one context', async () => {
            const environment = new TestUtils([ResidentTestMixin])
            await environment.init()
            const anotherEnvironment = new TestUtils([ResidentTestMixin])
            await anotherEnvironment.init()

            const accountNumber1 = faker.random.alphaNumeric(12)
            const accountNumber2 = faker.random.alphaNumeric(12)

            const resident1 = await environment.createResident({ unitName: '1', unitType: FLAT_UNIT_TYPE })
            const resident2 = await anotherEnvironment.createResident({ unitName: '1', unitType: FLAT_UNIT_TYPE })

            const addressUnit1 = {
                unitName: resident1.unitName,
                unitType: resident1.unitType,
            }

            const addressUnit2 = {
                unitName: resident2.unitName,
                unitType: resident2.unitType,
            }

            await environment.createReceipts([
                environment.createJSONReceipt({ accountNumber: accountNumber1, address: resident1.address, addressMeta: addressUnit1 }),
                environment.createJSONReceipt({ accountNumber: accountNumber2, address: resident2.address, addressMeta: addressUnit2 }),
            ])

            await environment.createServiceConsumer(resident1, accountNumber1)
            await environment.createServiceConsumer(resident2, accountNumber2)

            await sendBillingReceiptsAddedNotifications(dayjs().subtract(1, 'h').toISOString())

            const messageWhere = {
                user: { id_in: [resident1.user.id, resident2.user.id ] },
                type: BILLING_RECEIPT_ADDED_TYPE,
            }

            await waitFor(async () => {
                const messages = await Message.getAll(environment.clients.admin, messageWhere)

                expect(messages).toHaveLength(2)
                expect(messages[0].user.id).not.toEqual(messages[1].user.id)
            }, { delay: 2000 })
        })

        test('Should not send push for paid receipts', async () => {
            const environment = new TestUtils([ResidentTestMixin])
            await environment.init()
            const accountNumber = faker.random.alphaNumeric(12)

            const resident = await environment.createResident({ unitName: '1', unitType: FLAT_UNIT_TYPE })
            const addressUnit = {
                unitName: resident.unitName,
                unitType: resident.unitType,
            }
            const [[{ id: receiptId }]] = await environment.createReceipts([
                environment.createJSONReceipt({ accountNumber, address: resident.address, addressMeta: addressUnit, year: 2024, month: 1, toPay: '1000' }),
            ])
            const [{ id: serviceConsumerId }] = await environment.createServiceConsumer(resident, accountNumber)
            await environment.payForReceipt(receiptId, serviceConsumerId)
            await sendBillingReceiptsAddedNotifications(dayjs().subtract(1, 'h').toISOString())

            const messageWhere = {
                user: { id: resident.user.id },
                type: BILLING_RECEIPT_ADDED_TYPE,
            }

            await waitFor(async () => {
                const messages = await Message.getAll(environment.clients.admin, messageWhere)
                expect(messages).toHaveLength(0)
            }, { delay: 2000 })
        })
    })
})