const { generateGqlQueries } = require('@open-condo/codegen/generate.gql')
const { generateServerUtils } = require('@open-condo/codegen/generate.server.utils')
const { getRedisClient } = require('@open-condo/keystone/redis')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

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


module.exports = {
    getPaymentRules,
    removePaymentRulesCache,
}