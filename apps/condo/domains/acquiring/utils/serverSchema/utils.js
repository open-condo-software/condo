const { getOrganizationInfo, getBankInfo } = require('@open-condo/clients/finance-info-client')
const { generateGqlQueries } = require('@open-condo/codegen/generate.gql')
const { generateServerUtils } = require('@open-condo/codegen/generate.server.utils')
const { GQLError } = require('@open-condo/keystone/errors')
const { getRedisClient } = require('@open-condo/keystone/redis')
const { getSchemaCtx, find } = require('@open-condo/keystone/schema')

const { ERRORS } = require('@condo/domains/acquiring/constants/registerPaymentRule')
const { BankAccount: BankAccountApi } = require('@condo/domains/banking/utils/serverSchema')
const { DEFAULT_CURRENCY_CODE } = require('@condo/domains/common/constants/currencies')

const redis = getRedisClient('PAYMENT_RULE_CACHE', 'cache')
const PREFIX = 'payment-rules'

const PAYMENT_RULE_FIELDS = '{ id context { id implicitFeeDistributionSchema invoiceImplicitFeeDistributionSchema invoiceRecipient recipient } explicitFee explicitServiceCharge implicitFee bankAccount { id name tin routingNumber number } merchant marketPlaceScope { id address addressKey } billingScope { id address addressKey bankAccountNumber serviceIds category { id name } }  }'
const PaymentRuleGQL = generateGqlQueries('PaymentRule', PAYMENT_RULE_FIELDS)
const PaymentRuleApi = generateServerUtils(PaymentRuleGQL)

const cacheKey = (contextId) => `${PREFIX}:${contextId}`

async function getPaymentRules (acquiringContextId) {
    const cached = await redis.get(cacheKey(acquiringContextId))
    if (cached) return JSON.parse(cached)
    const { keystone: context } = getSchemaCtx('PaymentRule')
    const rules = await PaymentRuleApi.getAll(context, { context: { id: acquiringContextId }, deletedAt: null })
    await redis.set(cacheKey(acquiringContextId), JSON.stringify(rules))
    return rules
}

async function removePaymentRulesCache (acquiringContextId){
    await redis.set(cacheKey(acquiringContextId), null)
}

async function syncBankAccount (context, data) {
    const { dv, sender, tin, routingNumber, number, organizationId } = data
    const [existingAccount] = await find('BankAccount', {
        tin, routingNumber, number,
        organization: { id: organizationId },
        deletedAt: null,
    })
    if (existingAccount) {
        return existingAccount
    }
    const { error: getOrganizationInfoError, result: { country, name } } = await getOrganizationInfo(tin)
    if (getOrganizationInfoError) {
        throw new GQLError(ERRORS.FAILED_TO_GET_INFORMATION_ABOUT_ORGANIZATION, context)
    }
    const { error: getBankInfoError, result: { bankName, offsettingAccount } } = await getBankInfo(routingNumber)
    if (getBankInfoError) {
        throw new GQLError(ERRORS.FAILED_TO_GET_INFORMATION_ABOUT_BANK, context)
    }
    return await BankAccountApi.create(context, {
        dv, sender,
        organization: { connect: { id: organizationId } },
        name, tin, country, currencyCode: DEFAULT_CURRENCY_CODE,
        routingNumber, number, offsettingAccount, bankName,
    })
}



module.exports = {
    getPaymentRules,
    removePaymentRulesCache,
    syncBankAccount,
}