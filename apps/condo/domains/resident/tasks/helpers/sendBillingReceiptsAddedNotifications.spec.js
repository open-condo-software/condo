/**
 * @jest-environment node
 */

const index = require('@app/condo/index')

const { setFakeClientMode, makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')

const {
    BILLING_RECEIPT_ADDED_WITH_NO_DEBT_TYPE,
    BILLING_RECEIPT_ADDED_TYPE,
} = require('@condo/domains/notification/constants/constants')
const { Message } = require('@condo/domains/notification/utils/testSchema')
const { Resident } = require('@condo/domains/resident/utils/testSchema')

const { makeMessageKey, makeAccountKey, getMessageTypeAndDebt, sendBillingReceiptsAddedNotificationsForPeriod } = require('./sendBillingReceiptsAddedNotifications')
const { makeBillingReceiptWithResident } = require('./spec.helpers')


describe('sendBillingReceiptsAddedNotificationsForPeriod', () => {
    afterAll( () => {
        if (global.gc) {
            global.gc()
        }
    })

    setFakeClientMode(index)

    describe('notifications', () => {
        it('sends notification of BILLING_RECEIPT_ADDED_TYPE for toPay > 0', async () => {
            const admin = await makeLoggedInAdminClient()
            const { receipt, resident } = await makeBillingReceiptWithResident({ toPay: '10000', toPayDetails: { charge: '1000', formula: '', balance: '9000', penalty: '0' } } )
            let lastDt
            const setLastDt = (dt) => lastDt = dt

            await sendBillingReceiptsAddedNotificationsForPeriod({ id_in: [receipt.id] }, setLastDt)

            const notificationKey = makeMessageKey(receipt.period, receipt.account.number, receipt.category.id, resident.id)
            const messageWhere = {
                type: BILLING_RECEIPT_ADDED_TYPE,
                uniqKey: notificationKey,
            }
            const message = await Message.getOne(admin, messageWhere)

            expect(message).not.toBeUndefined()
            expect(lastDt).toEqual(receipt.createdAt)
            expect(message.organization.id).toEqual(resident.organization.id)
        })

        it('sends only one notification of BILLING_RECEIPT_ADDED_TYPE for same user but multiple billing receipts', async () => {
            const admin = await makeLoggedInAdminClient()
            const { receipt, resident, residentUser } = await makeBillingReceiptWithResident({ toPay: '10000', toPayDetails: { charge: '1000', formula: '', balance: '9000', penalty: '0' } } )
            const { receipt: receipt1, resident: resident1 } = await makeBillingReceiptWithResident({ toPay: '10000', toPayDetails: { charge: '1000', formula: '', balance: '9000', penalty: '0' } }, undefined, residentUser)

            expect(resident.user.id).toEqual(resident1.user.id)

            let lastDt
            const setLastDt = (dt) => lastDt = dt

            await sendBillingReceiptsAddedNotificationsForPeriod({ id_in: [receipt.id] }, setLastDt)

            const notificationKey = makeMessageKey(receipt.period, receipt.account.number, receipt.category.id, resident.id)
            const notificationKey1 = makeMessageKey(receipt1.period, receipt1.account.number, receipt1.category.id, resident1.id)
            const messageWhere = {
                type: BILLING_RECEIPT_ADDED_TYPE,
                uniqKey_in: [notificationKey, notificationKey1],
            }
            const messages = await Message.getAll(admin, messageWhere)

            expect(messages).toHaveLength(1)
            expect(lastDt).toEqual(receipt.createdAt)
            expect(messages[0].organization.id).toEqual(resident.organization.id)
        })


        it('sends notification of BILLING_RECEIPT_ADDED_TYPE for toPay > 0 and missing toPayDetails', async () => {
            const admin = await makeLoggedInAdminClient()
            const { receipt, resident } = await makeBillingReceiptWithResident({ toPay: '10000' } )
            let lastDt
            const setLastDt = (dt) => lastDt = dt

            await sendBillingReceiptsAddedNotificationsForPeriod({ id_in: [receipt.id] }, setLastDt)

            const notificationKey = makeMessageKey(receipt.period, receipt.account.number, receipt.category.id, resident.id)
            const messageWhere = {
                type: BILLING_RECEIPT_ADDED_TYPE,
                uniqKey: notificationKey,
            }
            const message = await Message.getOne(admin, messageWhere)

            expect(message).not.toBeUndefined()
            expect(lastDt).toEqual(receipt.createdAt)
            expect(message.organization.id).toEqual(resident.organization.id)
        })

        it('does not send notification of BILLING_RECEIPT_ADDED_WITH_NO_DEBT for toPay = 0.0', async () => {
            const admin = await makeLoggedInAdminClient()
            const { receipt, resident } = await makeBillingReceiptWithResident({ toPay: '0.0' })

            await sendBillingReceiptsAddedNotificationsForPeriod({ id_in: [receipt.id] })

            const notificationKey = makeMessageKey(receipt.period, receipt.account.number, receipt.category.id, resident.id)
            const messageWhere = {
                type: BILLING_RECEIPT_ADDED_WITH_NO_DEBT_TYPE,
                uniqKey: notificationKey,
            }
            const message = await Message.getOne(admin, messageWhere)

            expect(message).toBeUndefined()
        })

        it('does not send notification of BILLING_RECEIPT_ADDED_WITH_NO_DEBT for toPay < 0', async () => {
            const admin = await makeLoggedInAdminClient()
            const { receipt, resident } = await makeBillingReceiptWithResident({ toPay: '-1.0' })

            await sendBillingReceiptsAddedNotificationsForPeriod({ id_in: [receipt.id] })

            const notificationKey = makeMessageKey(receipt.period, receipt.account.number, receipt.category.id, resident.id)
            const messageWhere = {
                type: BILLING_RECEIPT_ADDED_WITH_NO_DEBT_TYPE,
                uniqKey: notificationKey,
            }
            const message = await Message.getOne(admin, messageWhere)

            expect(message).toBeUndefined()
        })

        it('sends only one notification for same receipt', async () => {
            const admin = await makeLoggedInAdminClient()
            const { receipt, resident } = await makeBillingReceiptWithResident()

            await sendBillingReceiptsAddedNotificationsForPeriod({ id_in: [receipt.id] })
            await sendBillingReceiptsAddedNotificationsForPeriod({ id_in: [receipt.id] })

            const notificationKey = makeMessageKey(receipt.period, receipt.account.number, receipt.category.id, resident.id)
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

            const notificationKey = makeMessageKey(receipt.period, receipt.account.number, receipt.category.id, resident.id)
            const messageWhere = {
                type: BILLING_RECEIPT_ADDED_TYPE,
                uniqKey: notificationKey,
            }
            const message = await Message.getOne(admin, messageWhere)

            expect(message).toBeUndefined()
        })

        it('sends nothing to deleted resident', async () => {
            const admin = await makeLoggedInAdminClient()
            const { receipt, resident } = await makeBillingReceiptWithResident({ toPay: '10000', toPayDetails: { charge: '1000', formula: '', balance: '9000', penalty: '0' } } )
            const resident1 = await Resident.softDelete(admin, resident.id)

            expect(resident1.deletedAt).not.toBeNull()

            let lastDt
            const setLastDt = (dt) => lastDt = dt

            await sendBillingReceiptsAddedNotificationsForPeriod({ id_in: [receipt.id] }, setLastDt)

            const notificationKey = makeMessageKey(receipt.period, receipt.account.number, receipt.category.id, resident.id)
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

})