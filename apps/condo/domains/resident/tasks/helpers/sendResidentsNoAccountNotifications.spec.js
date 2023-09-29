/**
 * @jest-environment node
 */

const index = require('@app/condo/index')

const { setFakeClientMode, makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')

const { BILLING_RECEIPT_AVAILABLE_NO_ACCOUNT_TYPE } = require('@condo/domains/notification/constants/constants')
const { Message } = require('@condo/domains/notification/utils/testSchema')
const { Resident } = require('@condo/domains/resident/utils/testSchema')

const { makeMessageKey, sendResidentsNoAccountNotificationsForPeriod } = require('./sendResidentsNoAccountNotifications')
const { makeBillingReceiptWithResident } = require('./spec.helpers')


describe('sendResidentsNoAccountNotifications', () => {
    afterAll( () => {
        if (global.gc) {
            global.gc()
        }
    })

    setFakeClientMode(index)

    let admin

    beforeAll( async () => {
        admin = await makeLoggedInAdminClient()
    })

    it('sends notification of BILLING_RECEIPT_ADDED_WITH_DEBT_TYPE for resident without billing account', async () => {
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

    it('sends nothing for deleted resident without billing account', async () => {
        const { receipt, resident } = await makeBillingReceiptWithResident({}, true)

        await Resident.softDelete(admin, resident.id)

        await sendResidentsNoAccountNotificationsForPeriod(receipt.period, receipt.context.id, receipt.period)

        const notificationKey = makeMessageKey(receipt.period, resident.property.id, resident.id)
        const messageWhere = {
            type: BILLING_RECEIPT_AVAILABLE_NO_ACCOUNT_TYPE,
            uniqKey: notificationKey,
        }
        const message = await Message.getOne(admin, messageWhere)

        expect(message).toBeUndefined()
    })

    it('sends nothing for integration with enabled skipNoAccountNotifications flag', async () => {
        const { receipt, resident } = await makeBillingReceiptWithResident({}, false, undefined, { skipNoAccountNotifications: true })

        const notificationKey = makeMessageKey(receipt.period, resident.property.id, resident.id)
        const messageWhere = {
            type: BILLING_RECEIPT_AVAILABLE_NO_ACCOUNT_TYPE,
            uniqKey: notificationKey,
        }
        const message = await Message.getOne(admin, messageWhere)

        expect(message).toBeUndefined()
    })

})