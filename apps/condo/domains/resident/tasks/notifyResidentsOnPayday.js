const dayjs = require('dayjs')
const locale_ru = require('dayjs/locale/ru')
const { get } = require('lodash')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { BillingReceipt, getPaymentsSum } = require('@condo/domains/billing/utils/serverSchema')
const { COUNTRIES } = require('@condo/domains/common/constants/countries')
const { RU_LOCALE } = require('@condo/domains/common/constants/locale')
const { loadListByChunks } = require('@condo/domains/common/utils/serverSchema')
const { SEND_BILLING_RECEIPTS_ON_PAYDAY_REMINDER_MESSAGE_TYPE, BILLING_RECEIPT_ADDED_TYPE, BILLING_RECEIPT_ADDED_WITH_DEBT_TYPE, BILLING_RECEIPT_ADDED_WITH_NO_DEBT_TYPE, BILLING_RECEIPT_AVAILABLE_NO_ACCOUNT_TYPE, BILLING_RECEIPT_AVAILABLE_TYPE, BILLING_RECEIPT_CATEGORY_AVAILABLE_TYPE } = require('@condo/domains/notification/constants/constants')
const { sendMessage, Message } = require('@condo/domains/notification/utils/serverSchema')
const { ServiceConsumer } = require('@condo/domains/resident/utils/serverSchema')



const logger = getLogger('notifyResidentsOnPayday')

const DV_SENDER = { dv: 1, sender: { dv: 1, fingerprint: 'notifyResidentsOnPayday' } }
const conflictingMessageTypes = [BILLING_RECEIPT_ADDED_TYPE, BILLING_RECEIPT_ADDED_WITH_DEBT_TYPE, BILLING_RECEIPT_ADDED_WITH_NO_DEBT_TYPE, BILLING_RECEIPT_AVAILABLE_NO_ACCOUNT_TYPE, BILLING_RECEIPT_AVAILABLE_TYPE, BILLING_RECEIPT_CATEGORY_AVAILABLE_TYPE, SEND_BILLING_RECEIPTS_ON_PAYDAY_REMINDER_MESSAGE_TYPE]

async function hasConflictingPushes (context, userId) {
    const now = dayjs()
    const userMessages = await Message.getAll(context, {
        user: { id: userId },
        createdAt_gte: now.set('hour', 0).set('minute', 0).set('second', 0).toISOString(),
        createdAt_lte: now.toISOString(),
    })

    for (const message of userMessages) {
        if (conflictingMessageTypes.find(type => type === message.type)) return true
    }
    return false
}

async function sendNotification (context, receipt) {
    const serviceConsumers = await ServiceConsumer.getAll(context, {
        accountNumber: get(receipt, 'account.number', null),
        deletedAt: null,
    })

    for (const consumer of serviceConsumers) {
        const resident = consumer.resident
        const userId = resident.user.id
        const lang = get(COUNTRIES, [get(receipt, 'organization.country', conf.DEFAULT_LOCALE), 'locale'], conf.DEFAULT_LOCALE)
        const now = dayjs().subtract(1, 'month')

        if (await hasConflictingPushes(context, userId)) {
            logger.info({ msg: 'Today the User received push notifications with a conflicting type', userId })
            continue
        }
        
        const uniqKey = `${userId}_notification_on_payday`
        await sendMessage(context, {
            ...DV_SENDER,
            to: { user: { id: userId } },
            lang: conf.DEFAULT_LOCALE,
            type: SEND_BILLING_RECEIPTS_ON_PAYDAY_REMINDER_MESSAGE_TYPE,
            meta: {
                dv: 1,
                data: {
                    monthName: lang === RU_LOCALE ? now.locale('ru').format('MMMM') : now.format('MMMM'),
                    billingReceiptId: { required: true },
                    serviceConsumerId: consumer.id,
                    residentId: resident.id,
                    userId,
                    toPayAmount: receipt.toPay,
                },
            },
            uniqKey,
        })
    }

}

async function notifyResidentsOnPayday () {
    const { keystone: context } = await getSchemaCtx('User')
    const now = dayjs()
    const currentPeriod = now.set('date', 1).format('YYYY-MM-DD')
    const previousPeriod = now.set('date', 1).subtract(1, 'month').format('YYYY-MM-DD')
    logger.info({ msg: 'Start proceeding', startAt: now.format() })

    // get all BillingReceipts with positive toPay field
    const allBillingReceipts = (await loadListByChunks({
        context,
        list: BillingReceipt,
        chunkSize: 20,
        where: {
            period_in: [
                currentPeriod,
                previousPeriod,
            ],
            deletedAt: null,
        },
    })).filter(receipt => receipt.toPay > 0)

    for (const receipt of allBillingReceipts) {
        const organizationId = get(receipt, ['context', 'organization', 'id'])
        const accountNumber = get(receipt, ['account', 'number'])
        const toPay = get(receipt, ['toPay'])
        const paid = await getPaymentsSum(
            context,
            organizationId,
            accountNumber,
            get(receipt, 'period', null),
            get(receipt, ['recipient', 'bic'], null),
            get(receipt, ['recipient', 'bankAccount'], null)
        )

        if (Number(paid) < Number(toPay)) {

            await sendNotification(context, receipt)
        }

    }

}

module.exports = {
    notifyResidentsOnPayday,
}
