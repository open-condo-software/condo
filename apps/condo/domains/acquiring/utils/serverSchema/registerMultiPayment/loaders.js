const { GQLError } = require('@open-condo/keystone/errors')
const { find } = require('@open-condo/keystone/schema')

const { ACQUIRING_INTEGRATION_ONLINE_PROCESSING_TYPE } = require('@condo/domains/acquiring/constants/integration')
const { REGISTER_MULTI_PAYMENT_ERRORS: ERRORS } = require('@condo/domains/acquiring/constants/registerMultiPaymentErrors')

function groupBy (items, key) {
    return items.reduce((acc, item) => {
        const groupKey = item[key]
        acc[groupKey] = acc[groupKey] || []
        acc[groupKey].push(item)
        return acc
    }, {})
}

async function loadServiceConsumersByIds (consumerIds, context) {
    const uniqueIds = [...new Set(consumerIds)]

    const consumers = await find('ServiceConsumer', {
        id_in: uniqueIds,
    })

    const byId = {}
    for (const consumer of consumers) {
        byId[consumer.id] = consumer
    }

    if (consumers.length !== uniqueIds.length) {
        const missingIds = uniqueIds.filter(id => !byId[id])

        throw new GQLError({
            ...ERRORS.MISSING_SERVICE_CONSUMERS,
            messageInterpolation: { ids: missingIds.join(', ') },
        }, context)
    }

    return { byId, list: consumers }
}

async function loadReceiptsByIds (receiptIds, context) {
    const receipts = await find('BillingReceipt', {
        id_in: receiptIds,
    })

    if (receipts.length !== receiptIds.length) {
        const existingReceiptsIds = new Set(receipts.map(({ id }) => id))
        const missingReceipts = receiptIds.filter(receiptId => !existingReceiptsIds.has(receiptId))
        throw new GQLError({ ...ERRORS.CANNOT_FIND_ALL_RECEIPTS, messageInterpolation: { missingReceiptIds: missingReceipts.join(', ') } }, context)
    }

    const byId = Object.assign({}, ...receipts.map(obj => ({ [obj.id]: obj })))
    return { byId, list: receipts }
}

async function loadResidentsByIds (residentIds) {
    const residents = await find('Resident', {
        id_in: [...new Set(residentIds)],
    })
    const byId = Object.assign({}, ...residents.map(obj => ({ [obj.id]: obj })))
    return { byId, list: residents }
}

async function loadInvoicesByIds (invoiceIds) {
    const foundInvoices = await find('Invoice', { id_in: [...new Set(invoiceIds)] })
    const byId = Object.assign({}, ...foundInvoices.map(obj => ({ [obj.id]: obj })))
    return { byId, list: foundInvoices }
}

async function loadBillingContextsByIds (contextIds) {
    const billingContexts = await find('BillingIntegrationOrganizationContext', {
        id_in: Array.from(contextIds),
    })
    const byId = Object.assign({}, ...billingContexts.map(obj => ({ [obj.id]: obj })))
    return { byId, list: billingContexts }
}

async function loadBillingContextsByOrganizationIds (organizationIds) {
    const billingContexts = await find('BillingIntegrationOrganizationContext', {
        deletedAt: null,
        organization: { id_in: [...new Set(organizationIds)] },
    })

    return groupBy(billingContexts, 'organization')
}

async function loadBillingIntegrationsByIds (integrationIds) {
    const billingIntegrations = await find('BillingIntegration', {
        id_in: [...new Set(integrationIds)],
    })
    
    const byId = {}
    for (const integration of billingIntegrations) {
        byId[integration.id] = integration
    }

    return { byId, list: billingIntegrations }
}

async function loadBillingAccountsByIds (accountIds) {
    const accounts = await find('BillingAccount', {
        id_in: Array.from(accountIds),
    })
    const byId = Object.assign({}, ...accounts.map(obj => ({ [obj.id]: obj })))
    return { byId, list: accounts }
}

async function loadAcquiringIntegration (integrationId, context) {
    const [acquiringIntegration] = await find('AcquiringIntegration', {
        id: integrationId,
    })

    return acquiringIntegration
}

function buildResolvedAcquiringContextMaps ({
    acquiringContexts,
    entityIdsByOrganizationId,
    context,
}) {
    const contextsByOrganizationId = groupBy(acquiringContexts, 'organization')
    const resolvedByOrganizationId = {}
    const missingEntityIds = []
    const deletedEntities = []

    for (const [organizationId, entityIds] of Object.entries(entityIdsByOrganizationId)) {
        const organizationContexts = contextsByOrganizationId[organizationId] || []
        const activeContexts = organizationContexts.filter(({ deletedAt }) => !deletedAt)
        const deletedContexts = organizationContexts.filter(({ deletedAt }) => !!deletedAt)

        if (activeContexts.length > 1) {
            throw new GQLError(ERRORS.MULTIPLE_ACQUIRING_INTEGRATION_CONTEXTS, context)
        }

        if (activeContexts.length === 1) {
            resolvedByOrganizationId[organizationId] = activeContexts[0]
            continue
        }

        if (deletedContexts.length > 0) {
            deletedEntities.push(...entityIds.map((entityId) => ({
                entityId,
                acquiringContextId: deletedContexts[0].id,
            })))
            continue
        }

        missingEntityIds.push(...entityIds)
    }

    if (deletedEntities.length > 0) {
        throw new GQLError({
            ...ERRORS.ACQUIRING_INTEGRATION_CONTEXT_IS_DELETED,
            data: {
                failedConsumers: deletedEntities.map(({ entityId, acquiringContextId }) => ({
                    consumerId: entityId,
                    acquiringContextId,
                })),
            },
        }, context)
    }

    if (missingEntityIds.length > 0) {
        throw new GQLError({
            ...ERRORS.ACQUIRING_INTEGRATION_CONTEXT_IS_MISSING,
            messageInterpolation: { ids: missingEntityIds.join(', ') },
        }, context)
    }

    const list = Object.values(resolvedByOrganizationId)
    const byId = Object.assign({}, ...list.map(item => ({ [item.id]: item })))

    return {
        byId,
        byOrganizationId: resolvedByOrganizationId,
        list,
    }
}

async function resolveAcquiringContextsForConsumers (consumers, context) {
    const entityIdsByOrganizationId = consumers.reduce((acc, consumer) => {
        acc[consumer.organization] = [...(acc[consumer.organization] || []), consumer.id]
        return acc
    }, {})
    const acquiringContexts = await find('AcquiringIntegrationContext', {
        organization: { id_in: [...new Set(consumers.map(({ organization }) => organization))] },
        integration: { type: ACQUIRING_INTEGRATION_ONLINE_PROCESSING_TYPE },
    })
    const resolvedContexts = buildResolvedAcquiringContextMaps({
        acquiringContexts,
        entityIdsByOrganizationId,
        context,
    })

    return {
        ...resolvedContexts,
        byConsumerId: consumers.reduce((acc, consumer) => {
            acc[consumer.id] = resolvedContexts.byOrganizationId[consumer.organization]
            return acc
        }, {}),
    }
}

async function resolveAcquiringContextsForInvoices (foundInvoices, context) {
    const entityIdsByOrganizationId = foundInvoices.reduce((acc, invoice) => {
        acc[invoice.organization] = [...(acc[invoice.organization] || []), invoice.id]
        return acc
    }, {})
    const acquiringContexts = await find('AcquiringIntegrationContext', {
        organization: { id_in: [...new Set(foundInvoices.map(({ organization }) => organization))] },
        integration: { type: ACQUIRING_INTEGRATION_ONLINE_PROCESSING_TYPE },
    })

    return buildResolvedAcquiringContextMaps({
        acquiringContexts,
        entityIdsByOrganizationId,
        context,
    })
}

module.exports = {
    loadAcquiringIntegration,
    loadBillingAccountsByIds,
    loadBillingContextsByIds,
    loadBillingContextsByOrganizationIds,
    loadBillingIntegrationsByIds,
    loadInvoicesByIds,
    loadReceiptsByIds,
    loadResidentsByIds,
    loadServiceConsumersByIds,
    resolveAcquiringContextsForConsumers,
    resolveAcquiringContextsForInvoices,
}
