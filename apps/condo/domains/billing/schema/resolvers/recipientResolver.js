const chunk = require('lodash/chunk')
const get = require('lodash/get')
const isEmpty = require('lodash/isEmpty')

const { getOrganizationInfo, getBankInfo } = require('@open-condo/clients/finance-info-client')
const { find } = require('@open-condo/keystone/schema')

const {
    ERRORS,
    RECIPIENT_IS_NOT_APPROVED,
} = require('@condo/domains/billing/constants/registerBillingReceiptService')
const { createStageContext } = require('@condo/domains/billing/schema/resolvers/resolver')
const { BillingRecipient } = require('@condo/domains/billing/utils/serverSchema')


const BILLING_RECIPIENT_FIELDS = '{ id name bankName bankAccount tin iec bic offsettingAccount territoryCode isApproved }'
const FINANCE_INPUT_ERROR_REGEXP = /^(Invalid TIN:|Invalid routing number:)| needs to start with 04 or 01$/
const RECIPIENT_PROCESSING_CHUNK_SIZE = 50

// FinanceInfoClient currently reports a missing suggestion as TypeError.
// Explicit input errors and missing suggestions belong to one receipt; other errors mean that
// the finance service or its cache is unavailable and must stop the whole mutation.
const isInfrastructureError = (error) => error instanceof Error &&
    !(error instanceof TypeError) &&
    !FINANCE_INPUT_ERROR_REGEXP.test(error.message)

function indexRecipientsByBankAccount (recipients) {
    const recipientsByBankAccount = new Map()
    for (const recipient of recipients) {
        if (!recipientsByBankAccount.has(recipient.bankAccount)) {
            recipientsByBankAccount.set(recipient.bankAccount, recipient)
        }
    }
    return recipientsByBankAccount
}

async function mapInChunks (items, mapper) {
    const result = []
    for (const itemsChunk of chunk(items, RECIPIENT_PROCESSING_CHUNK_SIZE)) {
        result.push(...await Promise.all(itemsChunk.map(mapper)))
    }
    return result
}

async function syncBillingRecipient (existing, data, { context, stage, recipientsByBankAccount }) {
    try {
        if (!existing) {
            const newRecipient = await BillingRecipient.create(
                context,
                stage.buildCreateInput(data, ['context']),
                BILLING_RECIPIENT_FIELDS
            )
            stage.markCreated()
            recipientsByBankAccount.set(data.bankAccount, newRecipient)
            return newRecipient
        }

        const updateInput = stage.buildUpdateInput(data, existing)
        if (isEmpty(updateInput)) {
            stage.markUntouched()
            return existing
        }
        const updatedRecipient = await BillingRecipient.update(
            context,
            existing.id,
            updateInput,
            BILLING_RECIPIENT_FIELDS,
        )
        stage.markUpdated()
        recipientsByBankAccount.set(data.bankAccount, updatedRecipient)
        return updatedRecipient
    } catch (originalError) {
        return {
            error: { ...ERRORS.RECIPIENT_SAVE_FAILED, messageInterpolation: { bankAccount: data.bankAccount } },
            originalError,
        }
    }
}

async function prepareReceiver ({ tin, routingNumber, bankAccount }, { billingContext, recipientsByBankAccount }) {
    const existingRecipient = recipientsByBankAccount.get(bankAccount)
    const { error: getBankError, result: routingNumberMeta  } = await getBankInfo(routingNumber)
    const { error: getOrganizationError, result: tinMeta } = await getOrganizationInfo(tin)
    if (isInfrastructureError(getBankError)) throw getBankError
    if (isInfrastructureError(getOrganizationError)) throw getOrganizationError
    if (getBankError) {
        return { error: { ...ERRORS.BANK_FOUND_ERROR, messageInterpolation: { routingNumber } } }
    }
    if (getOrganizationError) {
        return { error: { ...ERRORS.ORGANIZATION_FOUND_ERROR, messageInterpolation: { tin } } }
    }
    const bankName = get(routingNumberMeta, 'bankName', get(existingRecipient, 'bankName', null))
    const offsettingAccount = get(routingNumberMeta, 'offsettingAccount', get(existingRecipient, 'offsettingAccount', null))
    const name = get(tinMeta, 'name', get(existingRecipient, 'name', null))
    const iec = get(tinMeta, 'iec', get(existingRecipient, 'iec', null))
    const territoryCode = get(tinMeta, 'territoryCode', get(existingRecipient, 'territoryCode', null))
    const data = { context: billingContext.id, name, iec, tin, bankAccount, bankName, bic: routingNumber, offsettingAccount, territoryCode }

    return { existingRecipient, data }
}

async function saveReceiver ({ existingRecipient, data }, runtime) {
    const { error, originalError, id, isApproved } = await syncBillingRecipient(existingRecipient, data, runtime)
    if (error) return { error, originalError }

    // TODO(dkovyazin): DOMA-7656 Remove after removing recipient field from BillingReceipt
    // IEC is an optional field as it identifies company branch and is null for individual entrepreneur
    // For Budgetary organizations there is no offsettingAccount and they have there own accounts starting from 03
    // For some organizations there is no information about territoryCode
    const recipient = Object.fromEntries(Object.entries({
        name: data.name,
        bankName: data.bankName,
        territoryCode: data.territoryCode,
        offsettingAccount: data.offsettingAccount,
        tin: data.tin,
        iec: data.iec,
        bic: data.bic,
        bankAccount: data.bankAccount,
    }).filter(([, value]) => !!value))
    if (!isApproved) {
        return { problem: RECIPIENT_IS_NOT_APPROVED, result: { id, recipient } }
    }
    return { result: { id, recipient } }
}

async function resolveRecipients (receiptIndex, { billingContext, context }) {
    const stage = createStageContext({ name: 'recipient', context })
    const recipients = await find('BillingRecipient', { context: { id: billingContext.id }, deletedAt: null })
    const recipientsByBankAccount = indexRecipientsByBankAccount(recipients)
    const receiversByBankAccount = new Map()
    for (const { tin, routingNumber, bankAccount } of Object.values(receiptIndex)) {
        if (!receiversByBankAccount.has(bankAccount)) {
            receiversByBankAccount.set(bankAccount, { tin, routingNumber, bankAccount })
        }
    }

    const runtime = { billingContext, context, recipientsByBankAccount, stage }
    const preparedReceivers = await mapInChunks([...receiversByBankAccount.entries()], async ([bankAccount, receiver]) => (
        [bankAccount, await prepareReceiver(receiver, runtime)]
    ))
    const receiverSyncResult = Object.fromEntries(await mapInChunks(preparedReceivers, async ([bankAccount, preparedReceiver]) => (
        [bankAccount, preparedReceiver.error ? preparedReceiver : await saveReceiver(preparedReceiver, runtime)]
    )))

    for (const [index, receipt] of Object.entries(receiptIndex)) {
        const { tin, routingNumber, bankAccount } = receipt
        const { error, originalError, problem, result } = receiverSyncResult[bankAccount]
        if (error) {
            receiptIndex[index].error = stage.error(error, index, originalError, error.messageInterpolation)
        }
        if (problem) {
            receiptIndex[index].problems.push({ problem, params: { tin, routingNumber, bankAccount } })
        }
        if (result) {
            receiptIndex[index].receiver = result.id
            receiptIndex[index].recipient = result.recipient
        }
    }
    return stage.result(receiptIndex)
}


module.exports = {
    resolveRecipients,
}
