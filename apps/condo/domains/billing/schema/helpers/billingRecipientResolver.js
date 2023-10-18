const { isEmpty, get } = require('lodash')

const { getOrganizationInfo, getBankInfo } = require('@open-condo/clients/finance-info-client')
const { generateGqlQueries } = require('@open-condo/codegen/generate.gql')
const { generateServerUtils } = require('@open-condo/codegen/generate.server.utils')
const { getSchemaCtx, getById } = require('@open-condo/keystone/schema')

const { loadListByChunks } = require('@condo/domains/common/utils/serverSchema')

const BILLING_RECIPIENT_FIELDS = '{ id name bankName bankAccount tin iec bic offsettingAccount territoryCode isApproved }'
const BillingRecipientGQL = generateGqlQueries('BillingRecipient', BILLING_RECIPIENT_FIELDS)
const BillingRecipientApi = generateServerUtils(BillingRecipientGQL)

const dvSender = {
    dv: 1,
    sender: {
        dv: 1,
        fingerprint: 'register-receipts-recipient',
    },
}

class BillingRecipientResolver {
    constructor () {
        this.billingContext = null
        this.recipients = []
    }

    async init (billingContext) {
        const { keystone } = getSchemaCtx('BillingRecipient')
        this.context = keystone
        this.billingContext = billingContext
        this.recipients = await loadListByChunks({
            context: keystone,
            list: BillingRecipientApi,
            where: {
                context: { id: billingContext.id },
                deletedAt: null,
            },
        })
    }

    async syncBillingRecipient (existing, updateInput){
        const organization = await getById('Organization', get(this.billingContext, 'organization'))
        updateInput.isApproved = updateInput.tin && updateInput.tin === organization.tin
        if (!existing) {
            return await BillingRecipientApi.create(this.context, { ...dvSender, ...updateInput })
        } else {
            const fieldsToCheck = ['name', 'bankName', 'bankAccount', 'tin', 'iec', 'bic', 'offsettingAccount', 'territoryCode']
            const fieldsToUpdate = {}
            for (const fieldName of fieldsToCheck) {
                if (existing[fieldName] !== updateInput[fieldName]) {
                    fieldsToUpdate[fieldName] = updateInput[fieldName]
                }
            }
            if (!isEmpty(fieldsToUpdate)) {
                return await BillingRecipientApi.update(this.context, existing.id, { ...dvSender, ...fieldsToUpdate })
            } else {
                return existing
            }
        }
    }

    async getReceiver ({ tin, routingNumber, bankAccount } ) {
        const existingRecipient = this.recipients.find(({ bankAccount: existingBankAccount }) => existingBankAccount === bankAccount)
        const { error: getBankError, result: routingNumberMeta  } = await getBankInfo(routingNumber)
        const { error: getOrganizationError, result: tinMeta } = await getOrganizationInfo(tin)
        if (getBankError || getOrganizationError) {
            console.log('Error while getting Bank Info or Organization Info: ', getBankError ?? getOrganizationError)
        }
        const bankName = get(routingNumberMeta, 'bankName', null)
        const offsettingAccount = get(routingNumberMeta, 'offsettingAccount', null)
        const name = get(tinMeta, 'name', null)
        const iec = get(tinMeta, 'iec', null)
        const territoryCode = get(tinMeta, 'territoryCode', null)
        const { id } = await this.syncBillingRecipient(existingRecipient, { context: { connect: { id: this.billingContext.id } }, name, iec, tin, bankAccount, bankName, bic: routingNumber, offsettingAccount, territoryCode })
        return id
    }

    async processReceipts (receipts) {
        const result = {}
        for (const receipt of receipts) {
            const { tin, routingNumber, bankAccount } = receipt
            if (!result[bankAccount]) {
                result[bankAccount] = await this.getReceiver({ tin, routingNumber, bankAccount } )
            }
        }
        return receipts.map(receipt => ({ ...receipt, receiver: { id: result[receipt.bankAccount] } }))
    }

}

module.exports = {
    BillingRecipientResolver,
}