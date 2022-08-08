/**
 * @jest-environment node
 */
const { setFakeClientMode, makeLoggedInAdminClient } = require('@core/keystone/test.utils')

const { Message } = require('@condo/domains/notification/utils/testSchema')
const {
    BILLING_RECEIPT_ADDED_WITH_NO_DEBT_TYPE,
    BILLING_RECEIPT_ADDED_TYPE,
} = require('@condo/domains/notification/constants/constants')

const { makeBillingReceiptWithResident } = require('./spec.helpers')
const { makeMessageKey, getMessageTypeAndDebt, sendBillingReceiptsAddedNotificationsForPeriod } = require('./sendBillingReceiptsAddedNotifications')

const index = require('@app/condo/index')

describe('sendBillingReceiptsAddedNotificationsForPeriod', () => {
    setFakeClientMode(index)

    describe('notifications', () => {
        it('sends notification of BILLING_RECEIPT_ADDED_TYPE for toPay > 0', async () => {
            const admin = await makeLoggedInAdminClient()
            const { receipt, resident } = await makeBillingReceiptWithResident({ toPay: '10000', toPayDetails: { charge: '1000', formula: '', balance: '9000', penalty: '0' } } )
            let lastDt
            const setLastDt = (dt) => lastDt = dt

            await sendBillingReceiptsAddedNotificationsForPeriod({ id_in: [receipt.id] }, setLastDt)

            const notificationKey = makeMessageKey(receipt.period, receipt.account.id, receipt.category.id, resident.id)
            const messageWhere = {
                type: BILLING_RECEIPT_ADDED_TYPE,
                uniqKey: notificationKey,
            }
            const message = await Message.getOne(admin, messageWhere)

            expect(message).not.toBeNull()
            expect(lastDt).toEqual(receipt.createdAt)
            expect(message.organization.id).toEqual(resident.organization.id)
        })

        it('sends notification of BILLING_RECEIPT_ADDED_TYPE for toPay > 0 and missing toPayDetails', async () => {
            const admin = await makeLoggedInAdminClient()
            const { receipt, resident } = await makeBillingReceiptWithResident({ toPay: '10000' } )
            let lastDt
            const setLastDt = (dt) => lastDt = dt

            await sendBillingReceiptsAddedNotificationsForPeriod({ id_in: [receipt.id] }, setLastDt)

            const notificationKey = makeMessageKey(receipt.period, receipt.account.id, receipt.category.id, resident.id)
            const messageWhere = {
                type: BILLING_RECEIPT_ADDED_TYPE,
                uniqKey: notificationKey,
            }
            const message = await Message.getOne(admin, messageWhere)

            expect(message).not.toBeNull()
            expect(lastDt).toEqual(receipt.createdAt)
            expect(message.organization.id).toEqual(resident.organization.id)
        })

        it('sends notification of BILLING_RECEIPT_ADDED_WITH_NO_DEBT_TYPE for toPay = 0.0', async () => {
            const admin = await makeLoggedInAdminClient()
            const { receipt, resident } = await makeBillingReceiptWithResident({ toPay: '0.0' })

            await sendBillingReceiptsAddedNotificationsForPeriod({ id_in: [receipt.id] })

            const notificationKey = makeMessageKey(receipt.period, receipt.account.id, receipt.category.id, resident.id)
            const messageWhere = {
                type: BILLING_RECEIPT_ADDED_WITH_NO_DEBT_TYPE,
                uniqKey: notificationKey,
            }
            const message = await Message.getOne(admin, messageWhere)

            expect(message).not.toBeNull()
        })

        it('sends notification of BILLING_RECEIPT_ADDED_WITH_NO_DEBT_TYPE for toPay < 0', async () => {
            const admin = await makeLoggedInAdminClient()
            const { receipt, resident } = await makeBillingReceiptWithResident({ toPay: '-1.0' })

            await sendBillingReceiptsAddedNotificationsForPeriod({ id_in: [receipt.id] })

            const notificationKey = makeMessageKey(receipt.period, receipt.account.id, receipt.category.id, resident.id)
            const messageWhere = {
                type: BILLING_RECEIPT_ADDED_WITH_NO_DEBT_TYPE,
                uniqKey: notificationKey,
            }
            const message = await Message.getOne(admin, messageWhere)

            expect(message).not.toBeNull()
            expect(message.organization.id).toEqual(resident.organization.id)
        })

        it('sends only one notification for same receipt', async () => {
            const admin = await makeLoggedInAdminClient()
            const { receipt, resident } = await makeBillingReceiptWithResident()

            await sendBillingReceiptsAddedNotificationsForPeriod({ id_in: [receipt.id] })
            await sendBillingReceiptsAddedNotificationsForPeriod({ id_in: [receipt.id] })

            const notificationKey = makeMessageKey(receipt.period, receipt.account.id, receipt.category.id, resident.id)
            const messageWhere = {
                type: BILLING_RECEIPT_ADDED_TYPE,
                uniqKey: notificationKey,
            }
            const messages = await Message.getAll(admin, messageWhere)

            expect(messages).toHaveLength(1)
            expect(messages[0].organization.id).toEqual(resident.organization.id)
        })

        it('sends nothing for receipt with no ServiceConsumer record', async () => {
            const admin = await makeLoggedInAdminClient()
            const { receipt, resident } = await makeBillingReceiptWithResident({}, true)

            await sendBillingReceiptsAddedNotificationsForPeriod({ id_in: [receipt.id] })

            const notificationKey = makeMessageKey(receipt.period, receipt.account.id, receipt.category.id, resident.id)
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
    })

})