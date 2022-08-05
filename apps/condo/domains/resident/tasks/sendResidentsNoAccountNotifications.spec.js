/**
 * @jest-environment node
 */
const { setFakeClientMode, makeLoggedInAdminClient } = require('@core/keystone/test.utils')

const { Message } = require('@condo/domains/notification/utils/testSchema')
const { BILLING_RECEIPT_AVAILABLE_NO_ACCOUNT_TYPE } = require('@condo/domains/notification/constants/constants')

const { makeBillingReceiptWithResident } = require('./spec.helpers')
const { makeMessageKey, sendResidentsNoAccountNotificationsForPeriod } = require('./sendResidentsNoAccountNotifications')

const index = require('@app/condo/index')

describe('sendResidentsNoAccountNotifications', () => {
    setFakeClientMode(index)

    it('sends notification of BILLING_RECEIPT_ADDED_WITH_DEBT_TYPE for resident without billing account', async () => {
        const admin = await makeLoggedInAdminClient()
        const { receipt, resident } = await makeBillingReceiptWithResident({}, true)

        await sendResidentsNoAccountNotificationsForPeriod(receipt.period, receipt.context.id, receipt.period)

        const notificationKey = makeMessageKey(receipt.period, resident.property.id, resident.id)
        const messageWhere = {
            type: BILLING_RECEIPT_AVAILABLE_NO_ACCOUNT_TYPE,
            uniqKey: notificationKey,
        }
        const message = await Message.getOne(admin, messageWhere)

        expect(message).toBeDefined()
        expect(message.organization.id).toEqual(resident.residentOrganization.id)
    })

    it('sends nothing for receipt with resident having billing account', async () => {
        const admin = await makeLoggedInAdminClient()
        const { receipt, resident } = await makeBillingReceiptWithResident({}, false)

        await sendResidentsNoAccountNotificationsForPeriod(receipt.period, receipt.context.id, receipt.period)

        const notificationKey = makeMessageKey(receipt.period, resident.property.id, resident.id)
        const messageWhere = {
            type: BILLING_RECEIPT_AVAILABLE_NO_ACCOUNT_TYPE,
            uniqKey: notificationKey,
        }
        const message = await Message.getOne(admin, messageWhere)

        expect(message).toBeUndefined()
    })

    it('sends only one notification for same receipt', async () => {
        const admin = await makeLoggedInAdminClient()
        const { receipt, resident } = await makeBillingReceiptWithResident({}, true)

        await sendResidentsNoAccountNotificationsForPeriod(receipt.period, receipt.context.id, receipt.period)
        await sendResidentsNoAccountNotificationsForPeriod(receipt.period, receipt.context.id, receipt.period)

        const notificationKey = makeMessageKey(receipt.period, resident.property.id, resident.id)
        const messageWhere = {
            type: BILLING_RECEIPT_AVAILABLE_NO_ACCOUNT_TYPE,
            uniqKey: notificationKey,
        }
        const messages = await Message.getAll(admin, messageWhere)

        expect(messages).toHaveLength(1)
        expect(messages[0].organization.id).toEqual(resident.residentOrganization.id)
    })
})