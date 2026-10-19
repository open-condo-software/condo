const { getKVClient } = require('@open-condo/keystone/kv')

const { getOtherServiceNames } = require('@condo/domains/billing/schema/fields/BillingReceipt/ServicesDistribution')

const STATS_TTL_SECONDS = 6 * 30 * 24 * 60 * 60
const STATS_KEY_PREFIX = 'billing:uncategorized-services'
const MAX_SERVICE_NAME_BYTES = 256
const MAX_SERVICES_PER_RECEIPT = 20
const SERVICE_NAME_TRUNCATION_MARKER = '…'

function sanitizeServiceName (serviceName) {
    return serviceName
        .replace(/\p{Cc}/gu, ' ') // unicode control characters (like TAB, delete symbol, null byte, \r, etc) - 0x00–0x1F and 0x7F–0x9F
        .trim()
        .replace(/\s+/g, ' ')
}

function truncateServiceName (serviceName) {
    if (Buffer.byteLength(serviceName, 'utf8') <= MAX_SERVICE_NAME_BYTES) return serviceName

    let truncatedName = ''
    for (const character of serviceName) {
        if (Buffer.byteLength(`${truncatedName}${character}${SERVICE_NAME_TRUNCATION_MARKER}`, 'utf8') > MAX_SERVICE_NAME_BYTES) break
        truncatedName += character
    }

    return `${truncatedName}${SERVICE_NAME_TRUNCATION_MARKER}`
}

function prepareServiceNames (receipt) {
    return [...new Set(getOtherServiceNames(receipt)
        .map(sanitizeServiceName)
        .filter(Boolean)
        .map(truncateServiceName))]
        .slice(0, MAX_SERVICES_PER_RECEIPT)
}

function getStatisticsKeys (period) {
    const periodKey = encodeURIComponent(String(period))
    return `${STATS_KEY_PREFIX}:${periodKey}:services`
}

async function recordUncategorizedServices (receipts) {
    // Group service names by billing period before writing aggregated counters to Redis.
    const servicesByKey = new Map()
    const receiptList = Array.isArray(receipts) ? receipts : [receipts]

    for (const receipt of receiptList) {
        const serviceNames = prepareServiceNames(receipt)
        if (!receipt?.period || serviceNames.length === 0) continue

        const servicesKey = getStatisticsKeys(receipt.period)
        if (!servicesByKey.has(servicesKey)) servicesByKey.set(servicesKey, new Map())

        const serviceCounts = servicesByKey.get(servicesKey)
        serviceNames.forEach(serviceName => {
            serviceCounts.set(serviceName, (serviceCounts.get(serviceName) || 0) + 1)
        })
    }

    if (servicesByKey.size === 0) return

    const kv = getKVClient()
    await Promise.all([...servicesByKey.entries()].map(async ([servicesKey, serviceCounts]) => {
        const transaction = kv.multi()
        serviceCounts.forEach((count, serviceName) => transaction.hincrby(servicesKey, serviceName, count))
        transaction.expire(servicesKey, STATS_TTL_SECONDS)
        await transaction.exec()
    }))
}

module.exports = {
    getStatisticsKeys,
    MAX_SERVICE_NAME_BYTES,
    MAX_SERVICES_PER_RECEIPT,
    recordUncategorizedServices,
    SERVICE_NAME_TRUNCATION_MARKER,
    STATS_TTL_SECONDS,
}
