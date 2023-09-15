const dayjs = require('dayjs')
const locale_ru = require('dayjs/locale/ru')
const { get } = require('lodash')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/acquiring/constants/context')
const { BillingReceipt, getPaymentsSum } = require('@condo/domains/billing/utils/serverSchema')
const { COUNTRIES } = require('@condo/domains/common/constants/countries')
const { RU_LOCALE } = require('@condo/domains/common/constants/locale')
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
        createdAt_gte: now.startOf('date').toISOString(),
        createdAt_lte: now.toISOString(),
        deletedAt: null,
    })

    for (const message of userMessages) {
        if (conflictingMessageTypes.find(type => type === message.type)) return true
    }
    return false
}

async function sendNotification (context, receipt, consumer) {
    const resident = consumer.resident
    const userId = resident.user.id
    const lang = get(COUNTRIES, [get(receipt, 'organization.country', conf.DEFAULT_LOCALE), 'locale'], conf.DEFAULT_LOCALE)
    const now = dayjs().subtract(1, 'month')

    if (await hasConflictingPushes(context, userId)) {
        logger.info({ msg: 'Today the User received push notifications with a conflicting type', userId })
        return
    }

    const uniqKey = `${userId}_notification_on_payday_${receipt.period}`
    await sendMessage(context, {
        ...DV_SENDER,
        to: { user: { id: userId } },
        lang,
        type: SEND_BILLING_RECEIPTS_ON_PAYDAY_REMINDER_MESSAGE_TYPE,
        meta: {
            dv: 1,
            data: {
                monthName: lang === RU_LOCALE ? now.locale('ru').format('MMMM') : now.format('MMMM'),
                serviceConsumerId: consumer.id,
                residentId: resident.id,
                userId,
            },
        },
        uniqKey,
    })
}

async function notifyResidentsOnPayday () {
    const { keystone: context } = await getSchemaCtx('User')
    const state = {
        startTime: dayjs(),
        hasMoreConsumers: true,
        consumersOffset: 0,
        consumersChunkSize: 50,
        processedReceipts: 0,
        recipientsMap: new Map(),
        recipients: [],
    }
    logger.info({ msg: 'Start processing', startAt: state.startTime.format() })
    while (state.hasMoreConsumers) {
        const consumers = await ServiceConsumer.getAll(context, {
            acquiringIntegrationContext: {
                status: CONTEXT_FINISHED_STATUS,
                deletedAt: null,
            },
            billingAccount_is_null: false,
            billingIntegrationContext_is_null: false,
            deletedAt: null,
        }, {
            skip: state.consumersOffset,
            first: state.consumersChunkSize,
        })

        if (consumers.length !== state.consumersChunkSize) state.hasMoreConsumers = false
        state.consumersOffset += consumers.length

        for (const consumer of consumers) {
            const userId = consumer.resident.user.id
            const organizationId = consumer.organization.id

            //checking whether this user has been processed
            if (state.recipientsMap.has(organizationId) && state.recipientsMap.get(organizationId) === userId) continue
            state.recipientsMap.set(organizationId, userId)
            const receipts = await BillingReceipt.getAll(context, {
                context: {
                    id: consumer.billingIntegrationContext.id,
                    organization: { id: consumer.organization.id },
                },
                period: consumer.billingIntegrationContext.lastReport.period,
                toPay_gt: '0',
                deletedAt: null,
            })
            state.processedReceipts += receipts.length
            let isAllPaid = true
            for (const receipt of receipts) {
                const organizationId = get(receipt, ['context', 'organization', 'id'])
                const accountNumber = get(receipt, ['account', 'number'])
                const toPay = Number(get(receipt, ['toPay']))
                const paid = Number(await getPaymentsSum(
                    context,
                    organizationId,
                    accountNumber,
                    get(receipt, 'period', null),
                    get(receipt, ['recipient', 'bic'], null),
                    get(receipt, ['recipient', 'bankAccount'], null)
                ))
                if (paid < toPay) isAllPaid = false
            }

            if (!isAllPaid) await sendNotification(context, receipts[0], consumer)
        }
    }
}

module.exports = {
    notifyResidentsOnPayday,
}
