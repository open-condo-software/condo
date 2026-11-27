const Big = require('big.js')
const get = require('lodash/get')
const { z } = require('zod')

const conf = require('@open-condo/config')
const { featureToggleManager } = require('@open-condo/featureflags/featureToggleManager')
const { readOnlyFieldAccess } = require('@open-condo/keystone/access')
const { getLogger } = require('@open-condo/keystone/logging')
const { extractReqLocale } = require('@open-condo/locales/extractReqLocale')
const { getLocalized } = require('@open-condo/locales/loader')

const {
    BILLING_RECEIPT_SERVICE_DISTRIBUTION_FIELD_NAME,
    BILLING_RECEIPT_SERVICE_DISTRIBUTION_FALLBACK_CATEGORY,
} = require('@condo/domains/billing/constants/constants')
const { BILLING_RECEIPT_SERVICE_CATEGORIES } = require('@condo/domains/common/constants/featureflags')

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
            msg: `Invalid ${BILLING_RECEIPT_SERVICE_CATEGORIES} config; invalid entries will be ignored`,
            data: { issues },
        })
    }
}

function parseServiceCategoriesConfig (config) {
    const issues = []
    const configResult = configSchema.safeParse(config ?? {})
    if (!configResult.success) {
        collectZodIssues(issues, [BILLING_RECEIPT_SERVICE_CATEGORIES], configResult.error.issues)
        logConfigIssues(issues)
        return null
    }

    const { colors: rawColors = {}, patterns: rawPatterns = [] } = configResult.data
    const colorsResult = configObjectSchema.safeParse(rawColors)
    const colors = {}
    if (!colorsResult.success) {
        collectZodIssues(issues, [BILLING_RECEIPT_SERVICE_CATEGORIES, 'colors'], colorsResult.error.issues)
    } else {
        Object.entries(colorsResult.data).forEach(([categoryName, color]) => {
            const colorResult = z.string().safeParse(color)
            if (!colorResult.success) {
                collectZodIssues(issues, [BILLING_RECEIPT_SERVICE_CATEGORIES, 'colors', categoryName], colorResult.error.issues)
            } else {
                colors[categoryName] = colorResult.data
            }
        })
    }

    const patternsResult = z.array(z.unknown()).safeParse(rawPatterns)
    if (!patternsResult.success) {
        collectZodIssues(issues, [BILLING_RECEIPT_SERVICE_CATEGORIES, 'patterns'], patternsResult.error.issues)
        logConfigIssues(issues)
        return null
    }

    const patterns = []
    const categoryOrder = new Map()
    patternsResult.data.forEach((rule, ruleIndex) => {
        const rulePath = [BILLING_RECEIPT_SERVICE_CATEGORIES, 'patterns', ruleIndex]
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
                flags = 'i'
            } else {
                expression = patternResult.data.expression
                flags = patternResult.data.flags.join('')
            }

            try {
                // featureflags are controlled by admins, so we can trust in its regexps
                // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
                matchers.push(new RegExp(expression, flags))
            } catch (error) {
                issues.push(`${patternPath.join('.')}: invalid regular expression: ${error.message}`)
            }
        })

        if (matchers.length) {
            const { categoryName } = ruleResult.data
            patterns.push({ categoryName, matchers })
            if (!categoryOrder.has(categoryName)) categoryOrder.set(categoryName, categoryOrder.size)
        }
    })

    logConfigIssues(issues)

    return { colors, patterns, categoryOrder }
}

function normalizeServiceName (value) {
    return String(value || '')
        .toLowerCase()
        .replaceAll('\u00a0', ' ')
        .replaceAll('ё', 'е')
        .replace(/^[\s*_#-]*\d+[_-]+/g, ' ')
        .replace(/[«»"“”]/g, ' ')
        .replace(/[.,;:()[\]{}№*]+/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/ ?\/ ?/g, '/')
        .replaceAll('-', ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

function getServiceCategory (serviceName, patterns) {
    const normalized = normalizeServiceName(serviceName)
    const matchedRule = patterns.find(({ matchers }) => matchers.some(matcher => {
        matcher.lastIndex = 0
        return matcher.test(normalized)
    }))

    return matchedRule ? matchedRule.categoryName : BILLING_RECEIPT_SERVICE_DISTRIBUTION_FALLBACK_CATEGORY
}

function getInvalidServicesError (receipt) {
    const toPayAmount = Big(get(receipt, 'toPay') || 0)
    const paidAmount = Big(get(receipt, 'paid') || 0)
    const services = get(receipt, 'services', [])

    const servicesTotal = services
        ? services.reduce((total, { toPay = 0 }) => Big(total).add(Big(toPay)), Big(0))
        : Big(0)

    const servicesAreValid = servicesTotal.cmp(toPayAmount.add(paidAmount)) === 0

    if (services && services.length > 0 && !servicesAreValid) return `Services sum (${servicesTotal}) does not add up to the toPay (${toPayAmount}) amount correctly`

    return null
}

const SERVICES_DISTRIBUTION_FIELD = {
    schemaDoc: 'Service charges grouped by configured category, with localized category names',
    type: 'Virtual',
    access: readOnlyFieldAccess,
    extendGraphQLTypes: [`type ${BILLING_RECEIPT_SERVICE_DISTRIBUTION_FIELD_NAME} { categoryName: String!, amount: String!, color: String! }`],
    graphQLReturnType: `[${BILLING_RECEIPT_SERVICE_DISTRIBUTION_FIELD_NAME}!]`,
    graphQLReturnFragment: '{ categoryName amount color }',
    resolver: async (receipt, args, context) => {
        if (conf.DISABLE_BILLING_RECEIPT_SERVICES_DISTRIBUTION === 'true') return []

        const services = receipt.services
        if (!Array.isArray(services) || services.length === 0) return []

        try {
            if (getInvalidServicesError(receipt)) return []
        } catch {
            return []
        }

        let config
        try {
            config = await featureToggleManager.getFeatureValue(context, BILLING_RECEIPT_SERVICE_CATEGORIES, null)
        } catch (err) {
            logger.warn({ msg: `Failed to load ${BILLING_RECEIPT_SERVICE_CATEGORIES} config`, err })
            return []
        }
        const parsedConfig = parseServiceCategoriesConfig(config)
        if (!parsedConfig) return []

        const { colors, patterns, categoryOrder } = parsedConfig
        const sums = new Map()
        services.forEach(({ name, toPay }) => {
            const categoryName = getServiceCategory(name, patterns)
            const amount = sums.get(categoryName) || Big(0)
            sums.set(categoryName, amount.plus(toPay || 0))
        })

        const locale = extractReqLocale(context?.req) || conf.DEFAULT_LOCALE
        return [...sums.entries()]
            .sort(([firstCategory], [secondCategory]) => {
                if (firstCategory === BILLING_RECEIPT_SERVICE_DISTRIBUTION_FALLBACK_CATEGORY) return 1
                if (secondCategory === BILLING_RECEIPT_SERVICE_DISTRIBUTION_FALLBACK_CATEGORY) return -1
                return (categoryOrder.get(firstCategory) ?? Number.MAX_SAFE_INTEGER) - (categoryOrder.get(secondCategory) ?? Number.MAX_SAFE_INTEGER)
            })
            .map(([categoryKey, amount]) => {
                // Keep two decimals for cent-exact amounts and up to four for sub-cent amounts: 1 → 1.00, 1.2222 → 1.2222, 1.222256 → 1.2223.
                const roundedAmount = amount.round(4)
                const cents = roundedAmount.toFixed(2)
                return {
                    categoryName: getLocalized(locale, categoryKey),
                    amount: roundedAmount.eq(cents) ? cents : roundedAmount.toFixed(),
                    color: colors[categoryKey] || colors[BILLING_RECEIPT_SERVICE_DISTRIBUTION_FALLBACK_CATEGORY] || FALLBACK_COLOR,
                }
            })
    },
}

module.exports = {
    getInvalidServicesError,
    SERVICES_DISTRIBUTION_FIELD,
}
