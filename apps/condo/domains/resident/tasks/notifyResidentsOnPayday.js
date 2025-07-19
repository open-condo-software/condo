const dayjs = require('dayjs')
const { get } = require('lodash')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/acquiring/constants/context')
const { BillingReceipt, getNewPaymentsSum } = require('@condo/domains/billing/utils/serverSchema')
const { COUNTRIES } = require('@condo/domains/common/constants/countries')
const { RU_LOCALE } = require('@condo/domains/common/constants/locale')
const { loadListByChunks } = require('@condo/domains/common/utils/serverSchema')
const { SEND_BILLING_RECEIPTS_ON_PAYDAY_REMINDER_MESSAGE_TYPE, BILLING_RECEIPT_ADDED_TYPE, BILLING_RECEIPT_ADDED_WITH_DEBT_TYPE, BILLING_RECEIPT_ADDED_WITH_NO_DEBT_TYPE, BILLING_RECEIPT_AVAILABLE_NO_ACCOUNT_TYPE, BILLING_RECEIPT_AVAILABLE_TYPE, BILLING_RECEIPT_CATEGORY_AVAILABLE_TYPE } = require('@condo/domains/notification/constants/constants')
const { sendMessage, Message } = require('@condo/domains/notification/utils/serverSchema')
const { ServiceConsumer } = require('@condo/domains/resident/utils/serverSchema')


const logger = getLogger()

const DV_SENDER = { dv: 1, sender: { dv: 1, fingerprint: 'notifyResidentsOnPayday' } }
const conflictingMessageTypes = [BILLING_RECEIPT_ADDED_TYPE, BILLING_RECEIPT_ADDED_WITH_DEBT_TYPE, BILLING_RECEIPT_ADDED_WITH_NO_DEBT_TYPE, BILLING_RECEIPT_AVAILABLE_NO_ACCOUNT_TYPE, BILLING_RECEIPT_AVAILABLE_TYPE, BILLING_RECEIPT_CATEGORY_AVAILABLE_TYPE, SEND_BILLING_RECEIPTS_ON_PAYDAY_REMINDER_MESSAGE_TYPE]

async function hasConflictingPushes (context, userId) {
    const now = dayjs()
    const userMessages = await Message.getAll(context, {
        user: { id: userId },
        createdAt_gte: now.startOf('date').toISOString(),
        createdAt_lte: now.toISOString(),
        deletedAt: null,
    }, 'type')

    for (const message of userMessages) {
        if (conflictingMessageTypes.find(type => type === message.type)) return true
    }
    return false
}

async function sendNotification (context, receipt, consumer) {
    const resident = consumer.resident
    const userId = resident.user.id
    const lang = get(COUNTRIES, [get(receipt, 'organization.country', conf.DEFAULT_LOCALE), 'locale'], conf.DEFAULT_LOCALE)
    const monthName = lang === RU_LOCALE ? dayjs(receipt.period).locale('ru').format('MMMM') : dayjs(receipt.period).format('MMMM')

    if (await hasConflictingPushes(context, userId)) {
        logger.info({
            msg: 'today the User received push notifications with a conflicting type',
            entityId: userId,
            entity: 'User',
        })
        return
    }

    const uniqKey = `${userId}_notification_on_payday_${receipt.period}`
    // TODO(DOMA-11040): get locale for sendMessage from user
    await sendMessage(context, {
        ...DV_SENDER,
        to: { user: { id: userId } },
        lang,
        type: SEND_BILLING_RECEIPTS_ON_PAYDAY_REMINDER_MESSAGE_TYPE,
        organization: { id: consumer.organization.id },
        meta: {
            dv: 1,
            data: {
                monthName,
                serviceConsumerId: consumer.id,
                residentId: resident.id,
                userId,
            },
        },
        uniqKey,
    })
}

async function notifyResidentsOnPayday () {
    const { keystone: context } = getSchemaCtx('User')
    const state = {
        startTime: dayjs().toISOString(),
        completeTime: null,
        hasMoreConsumers: true,
        consumersOffset: 0,
        consumersChunkSize: 20,
        processedReceipts: 0,
        recipientsMap: new Map(),
        failedConsumers: 0,
        recipients: [],
    }
    logger.info({ msg: 'start processing', data: { startAt: state.startTime } })
    while (state.hasMoreConsumers) {
        const consumers = await ServiceConsumer.getAll(context, {
            acquiringIntegrationContext: {
                status: CONTEXT_FINISHED_STATUS,
                deletedAt: null,
            },
            billingIntegrationContext_is_null: false,
            resident: {
                deletedAt: null,
            },
            deletedAt: null,
        },
        'id resident { id user { id } } organization { id } ' +
            'accountNumber billingIntegrationContext { id }',
        {
            skip: state.consumersOffset,
            first: state.consumersChunkSize,
        })

        if (consumers.length !== state.consumersChunkSize) state.hasMoreConsumers = false
        state.consumersOffset += consumers.length

        for (const consumer of consumers) {
            try {
                const accountNumber = get(consumer, ['accountNumber'])

                const receipts = await loadListByChunks({
                    context,
                    chunkSize:20,
                    list: BillingReceipt,
                    where: {
                        account: {
                            number: accountNumber,
                        },
                        context: {
                            id: consumer.billingIntegrationContext.id,
                        },
                        period_gte: dayjs().subtract(2, 'month').startOf('month').toISOString(),
                        toPay_gt: '0',
                        deletedAt: null,
                    },
                    /**
                     * @param {BillingReceipt[]} chunk
                     * @returns {BillingReceipt[]}
                     */
                    fields: 'id toPay isPayable period organization { id country } account { id number } receiver { id } category { id }',
                    chunkProcessor: async chunk => chunk.filter(receipt => receipt.isPayable),
                })
                state.processedReceipts += receipts.length

                const receiptsByAccountAndRecipient = {}
                for (const receipt of receipts) {
                    const accountNumber = get(receipt, ['account', 'number'])
                    const recipientId = get(receipt, ['receiver', 'id'])
                    const categoryId = get(receipt, ['category', 'id'])
                    const key = accountNumber + '-' + recipientId + '-' + categoryId

                    const period = dayjs(get(receipt, ['period']), 'YYYY-MM-DD')

                    if (!(key in receiptsByAccountAndRecipient)) {
                        receiptsByAccountAndRecipient[key] = { id: receipt.id, period }
                        continue
                    }

                    // If we have a receipt with later period -- we take it
                    const existingRecipientPeriod = dayjs(get(receiptsByAccountAndRecipient[key], 'period'), 'YYYY-MM-DD')
                    if (existingRecipientPeriod < period) {
                        receiptsByAccountAndRecipient[key] = { id: receipt.id, period }
                    }
                }

                const processedReceipts = (Object.values(receiptsByAccountAndRecipient)).map(r => r.id)
                receipts.forEach(receipt => {
                    receipt.isPayable = processedReceipts.includes(receipt.id)
                })
                const payableReceipts = receipts.filter(r => r.isPayable)

                let isAllPaid = true
                for (const receipt of payableReceipts) {
                    const toPay = Number(get(receipt, ['toPay']))
                    const paid = Number(await getNewPaymentsSum(receipt.id))
                    if (paid < toPay) isAllPaid = false
                }

                if (!isAllPaid) await sendNotification(context, payableReceipts[0], consumer)
            } catch (err) {
                logger.error({ err })
                state.failedConsumers++
            }
        }
    }
    state.completeTime = dayjs().toISOString()
    logger.info({ msg: 'processing completed', data: { state, startAt: state.startTime, completeAt: state.completeTime, failedConsumers: state.failedConsumers } })
}

module.exports = {
    notifyResidentsOnPayday,
}
