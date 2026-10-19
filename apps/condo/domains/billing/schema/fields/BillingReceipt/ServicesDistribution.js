const Big = require('big.js')
const { z } = require('zod')

const conf = require('@open-condo/config')
const { readOnlyFieldAccess } = require('@open-condo/keystone/access')
const { getLogger } = require('@open-condo/keystone/logging')
const { extractReqLocale } = require('@open-condo/locales/extractReqLocale')
const { getLocalized } = require('@open-condo/locales/loader')

const {
    BILLING_RECEIPT_SERVICE_DISTRIBUTION_FIELD_NAME,
    BILLING_RECEIPT_SERVICE_DISTRIBUTION_FALLBACK_CATEGORY,
} = require('@condo/domains/billing/constants/constants')

const CONFIG_NAME = 'BILLING_RECEIPT_SERVICE_CATEGORIES'
const FALLBACK_COLOR = '#999999'

const logger = getLogger()
const configSchema = z.object({
    colors: z.unknown().optional(),
    patterns: z.unknown().optional(),
}).passthrough()
const configObjectSchema = z.object({}).catchall(z.unknown())
const categoryRuleSchema = z.object({
    categoryName: z.string().min(1),
    patterns: z.array(z.unknown()),
})
const matcherSchema = z.union([
    z.string(),
    z.object({
        expression: z.string(),
        flags: z.array(z.string()),
    }),
])

function collectZodIssues (issues, path, zodIssues) {
    zodIssues.forEach((issue) => {
        const issuePath = [...path, ...issue.path].join('.')
        issues.push(`${issuePath}: ${issue.message}`)
    })
}

function logConfigIssues (issues) {
    if (issues.length) {
        logger.warn({
            msg: `Invalid ${CONFIG_NAME} config; invalid entries will be ignored`,
            data: { issues },
        })
    }
}

function parseServiceCategoriesConfig () {
    const emptyConfig = { colors: {}, patterns: [] }
    const configValue = conf[CONFIG_NAME]
    if (!configValue) return emptyConfig

    let config
    try {
        config = typeof configValue === 'string' ? JSON.parse(configValue) : configValue
    } catch (error) {
        logConfigIssues([`${CONFIG_NAME}: must contain valid JSON: ${error.message}`])
        return emptyConfig
    }

    const issues = []
    const configResult = configSchema.safeParse(config)
    if (!configResult.success) {
        collectZodIssues(issues, [CONFIG_NAME], configResult.error.issues)
        logConfigIssues(issues)
        return emptyConfig
    }

    const { colors: rawColors = {}, patterns: rawPatterns = [] } = configResult.data
    const colorsResult = configObjectSchema.safeParse(rawColors)
    const colors = {}
    if (!colorsResult.success) {
        collectZodIssues(issues, [CONFIG_NAME, 'colors'], colorsResult.error.issues)
    } else {
        Object.entries(colorsResult.data).forEach(([categoryName, color]) => {
            const colorResult = z.string().safeParse(color)
            if (!colorResult.success) {
                collectZodIssues(issues, [CONFIG_NAME, 'colors', categoryName], colorResult.error.issues)
            } else {
                colors[categoryName] = colorResult.data
            }
        })
    }

    const patternsResult = z.array(z.unknown()).safeParse(rawPatterns)
    if (!patternsResult.success) {
        collectZodIssues(issues, [CONFIG_NAME, 'patterns'], patternsResult.error.issues)
        logConfigIssues(issues)
        return emptyConfig
    }

    const compiledPatterns = []
    patternsResult.data.forEach((rule, ruleIndex) => {
        const rulePath = [CONFIG_NAME, 'patterns', ruleIndex]
        const ruleResult = categoryRuleSchema.safeParse(rule)
        if (!ruleResult.success) {
            collectZodIssues(issues, rulePath, ruleResult.error.issues)
            return
        }

        const matchers = []
        ruleResult.data.patterns.forEach((pattern, patternIndex) => {
            const patternPath = [...rulePath, 'patterns', patternIndex]
            const patternResult = matcherSchema.safeParse(pattern)
            if (!patternResult.success) {
                collectZodIssues(issues, patternPath, patternResult.error.issues)
                return
            }

            let expression
            let flags = ''
            if (typeof patternResult.data === 'string') {
                expression = patternResult.data
            } else {
                expression = patternResult.data.expression
                flags = patternResult.data.flags.join('')
            }

            try {
                matchers.push(new RegExp(expression, flags))
            } catch (error) {
                issues.push(`${patternPath.join('.')}: invalid regular expression: ${error.message}`)
            }
        })

        if (matchers.length) {
            compiledPatterns.push({ categoryName: ruleResult.data.categoryName, matchers })
        }
    })

    logConfigIssues(issues)

    return { colors, patterns: compiledPatterns }
}


let colors = {}
let patterns = []
let categoryOrder = new Map()

try {
    const config = parseServiceCategoriesConfig()
    colors = config.colors
    patterns = config.patterns
    categoryOrder = new Map()
    patterns.forEach(({ categoryName }) => {
        if (!categoryOrder.has(categoryName)) categoryOrder.set(categoryName, categoryOrder.size)
    })
} catch (err) {
    logger.warn({
        msg: `Failed to parse ${CONFIG_NAME} config`,
        err,
    })
}

function normalizeServiceName (value) {
    return String(value || '')
        .toLowerCase()
        .replace(/\u00a0/g, ' ')
        .replace(/ё/g, 'е')
        .replace(/^[\s*_#-]*\d+[_-]+/g, ' ')
        .replace(/[«»"“”]/g, ' ')
        .replace(/[.,;:()[\]{}№*]+/g, ' ')
        .replace(/\s*\/\s*/g, '/')
        .replace(/\s*-\s*/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

function getServiceCategory (serviceName) {
    const normalized = normalizeServiceName(serviceName)
    const matchedRule = patterns.find(({ matchers }) => matchers.some(matcher => {
        matcher.lastIndex = 0
        return matcher.test(normalized)
    }))

    return matchedRule ? matchedRule.categoryName : BILLING_RECEIPT_SERVICE_DISTRIBUTION_FALLBACK_CATEGORY
}

function servicesMatchReceiptTotal (receipt) {
    const { services, toPay: receiptToPay } = receipt || {}
    if (!Array.isArray(services) || Big(receiptToPay || 0).eq(0)) return false

    try {
        const servicesTotal = services.reduce((sum, service) => sum.plus(service.toPay || 0), Big(0))
        return servicesTotal.eq(Big(receiptToPay))
    } catch (error) {
        return false
    }
}

function getOtherServiceNames (receipt) {
    if (!servicesMatchReceiptTotal(receipt)) return []

    const { services } = receipt
    const names = new Map()
    services.forEach(({ name }) => {
        const displayName = String(name || '').trim().replace(/\s+/g, ' ')
        const normalizedName = normalizeServiceName(displayName)

        if (
            normalizedName &&
            getServiceCategory(displayName) === BILLING_RECEIPT_SERVICE_DISTRIBUTION_FALLBACK_CATEGORY &&
            !names.has(normalizedName)
        ) {
            names.set(normalizedName, displayName)
        }
    })

    return [...names.values()]
}

const SERVICES_DISTRIBUTION_FIELD = {
    schemaDoc: 'Service charges grouped by configured category, with localized category names',
    type: 'Virtual',
    access: readOnlyFieldAccess,
    extendGraphQLTypes: [`type ${BILLING_RECEIPT_SERVICE_DISTRIBUTION_FIELD_NAME} { categoryName: String!, amount: String!, color: String! }`],
    graphQLReturnType: `[${BILLING_RECEIPT_SERVICE_DISTRIBUTION_FIELD_NAME}!]!`,
    graphQLReturnFragment: '{ categoryName amount color }',
    resolver: async (receipt, args, context) => {
        const services = receipt.services
        if (!Array.isArray(services) || services.length === 0) return []

        if (!servicesMatchReceiptTotal(receipt)) return []

        const sums = new Map()
        services.forEach(({ name, toPay }) => {
            const categoryName = getServiceCategory(name)
            const amount = sums.get(categoryName) || Big(0)
            sums.set(categoryName, amount.plus(toPay))
        })

        const locale = extractReqLocale(context?.req) || conf.DEFAULT_LOCALE
        return [...sums.entries()]
            .sort(([firstCategory], [secondCategory]) => {
                if (firstCategory === BILLING_RECEIPT_SERVICE_DISTRIBUTION_FALLBACK_CATEGORY) return 1
                if (secondCategory === BILLING_RECEIPT_SERVICE_DISTRIBUTION_FALLBACK_CATEGORY) return -1
                return (categoryOrder.get(firstCategory) ?? Number.MAX_SAFE_INTEGER) - (categoryOrder.get(secondCategory) ?? Number.MAX_SAFE_INTEGER)
            })
            .map(([categoryKey, amount]) => ({
                categoryName: getLocalized(locale, categoryKey),
                amount: amount.toFixed(2),
                color: colors[categoryKey] || colors[BILLING_RECEIPT_SERVICE_DISTRIBUTION_FALLBACK_CATEGORY] || FALLBACK_COLOR,
            }))
    },
}

module.exports = {
    getOtherServiceNames,
    SERVICES_DISTRIBUTION_FIELD,
}
