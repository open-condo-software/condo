/**
 * Conditions evaluator for subscription pricing rules using json-rules-engine
 * 
 * Condition format (json-rules-engine):
 * {
 *   conditions: {
 *     all: [condition, ...],  // AND - all conditions must match
 *     any: [condition, ...],  // OR - at least one condition must match
 *   },
 *   event: { type: 'match' }  // Required by json-rules-engine but not used
 * }
 * 
 * Single condition:
 * { fact: 'organizationFeatures', operator: 'contains', value: 'active_banking' }
 * 
 * Facts (from organization):
 * - organizationIds (array) - [organization.id]
 * - organizationFeatures (array) - organization.features
 * 
 * Operators:
 * - contains, doesNotContain (for arrays)
 * - equal, notEqual
 * - in, notIn (value is array)
 */

const { Engine } = require('json-rules-engine')

const SUPPORTED_FACTS = ['organizationIds', 'organizationFeatures']
const SUPPORTED_OPERATORS = ['contains', 'doesNotContain', 'equal', 'notEqual', 'in', 'notIn']

/**
 * Create engine with custom operators
 */
function createEngine () {
    const engine = new Engine([], { allowUndefinedFacts: true })

    // Add custom operator: doesNotContain
    engine.addOperator('doesNotContain', (factValue, jsonValue) => {
        if (!Array.isArray(factValue)) return true
        return !factValue.includes(jsonValue)
    })

    return engine
}

/**
 * Build facts object from context
 */
function buildFacts (context) {
    return {
        organizationIds: context.organization?.id ? [context.organization.id] : [],
        organizationFeatures: context.organization?.features || [],
    }
}

/**
 * Convert stored conditions to json-rules-engine rule format
 * Stored format: { all: [...] } or { any: [...] }
 * Engine format: { conditions: { all: [...] }, event: { type: 'match' } }
 */
function toEngineRule (conditions) {
    return {
        conditions,
        event: { type: 'match' },
    }
}

/**
 * Evaluate conditions against context (async)
 * @param {Object|null} conditions
 * @param {Object} context - { organization }
 * @returns {Promise<boolean>}
 */
async function evaluateConditionsAsync (conditions, context) {
    if (!conditions || Object.keys(conditions).length === 0) return true

    const engine = createEngine()
    const rule = toEngineRule(conditions)
    engine.addRule(rule)

    const facts = buildFacts(context)
    const { events } = await engine.run(facts)

    return events.length > 0
}

/**
 * Evaluate conditions synchronously (for backward compatibility)
 * Uses custom sync implementation since json-rules-engine is async
 * @param {Object|null} conditions
 * @param {Object} context - { organization }
 * @returns {boolean}
 */
function evaluateConditions (conditions, context) {
    if (!conditions || Object.keys(conditions).length === 0) return true
    const facts = buildFacts(context)
    return evaluateNodeSync(conditions, facts).match
}

/**
 * Evaluate a single condition synchronously
 */
function evaluateSingleConditionSync (condition, facts) {
    const { fact, operator, value } = condition
    const factValue = facts[fact]

    let match = false

    switch (operator) {
        case 'contains':
            match = Array.isArray(factValue) && factValue.includes(value)
            break
        case 'doesNotContain':
            match = !Array.isArray(factValue) || !factValue.includes(value)
            break
        case 'equal':
            match = factValue === value
            break
        case 'notEqual':
            match = factValue !== value
            break
        case 'in':
            match = Array.isArray(value) && value.includes(factValue)
            break
        case 'notIn':
            match = !Array.isArray(value) || !value.includes(factValue)
            break
        default:
            match = false
    }

    return { match, condition }
}

/**
 * Evaluate conditions recursively (sync)
 */
function evaluateNodeSync (conditions, facts) {
    if (!conditions || typeof conditions !== 'object') {
        return { match: true, results: [] }
    }

    if (Array.isArray(conditions.all)) {
        const results = conditions.all.map(c => {
            if (c.all || c.any) return evaluateNodeSync(c, facts)
            return evaluateSingleConditionSync(c, facts)
        })
        return { match: results.every(r => r.match), results }
    }

    if (Array.isArray(conditions.any)) {
        const results = conditions.any.map(c => {
            if (c.all || c.any) return evaluateNodeSync(c, facts)
            return evaluateSingleConditionSync(c, facts)
        })
        return { match: results.some(r => r.match), results }
    }

    if (conditions.fact) {
        const result = evaluateSingleConditionSync(conditions, facts)
        return { match: result.match, results: [result] }
    }

    return { match: true, results: [] }
}

/**
 * Evaluate with details - returns failed conditions for promotions
 * @param {Object|null} conditions
 * @param {Object} context
 * @returns {{ match: boolean, failedConditions: Array }}
 */
function evaluateConditionsWithDetails (conditions, context) {
    if (!conditions || Object.keys(conditions).length === 0) {
        return { match: true, failedConditions: [] }
    }

    const facts = buildFacts(context)
    const { match, results } = evaluateNodeSync(conditions, facts)

    const failedConditions = []
    function collectFailed (resultList) {
        for (const r of resultList) {
            if (!r.match) {
                if (r.condition) failedConditions.push(r.condition)
                if (r.results) collectFailed(r.results)
            }
        }
    }
    collectFailed(results)

    return { match, failedConditions }
}

/**
 * Validate single condition
 */
function validateSingleCondition (condition, path) {
    if (!condition || typeof condition !== 'object') {
        return { valid: false, error: `${path}: condition must be an object` }
    }

    const { fact, operator, value } = condition

    if (!fact || typeof fact !== 'string') {
        return { valid: false, error: `${path}: missing or invalid "fact"` }
    }
    if (!SUPPORTED_FACTS.includes(fact)) {
        return { valid: false, error: `${path}: unsupported fact "${fact}". Supported: ${SUPPORTED_FACTS.join(', ')}` }
    }
    if (!operator || typeof operator !== 'string') {
        return { valid: false, error: `${path}: missing or invalid "operator"` }
    }
    if (!SUPPORTED_OPERATORS.includes(operator)) {
        return { valid: false, error: `${path}: unsupported operator "${operator}". Supported: ${SUPPORTED_OPERATORS.join(', ')}` }
    }
    if (value === undefined) {
        return { valid: false, error: `${path}: missing "value"` }
    }
    if ((operator === 'in' || operator === 'notIn') && !Array.isArray(value)) {
        return { valid: false, error: `${path}: "value" must be an array for operator "${operator}"` }
    }

    return { valid: true }
}

/**
 * Validate conditions recursively
 */
function validateNode (node, path = 'conditions') {
    if (node.all !== undefined) {
        if (!Array.isArray(node.all)) {
            return { valid: false, error: `${path}.all: must be an array` }
        }
        for (let i = 0; i < node.all.length; i++) {
            const child = node.all[i]
            const result = (child.all !== undefined || child.any !== undefined)
                ? validateNode(child, `${path}.all[${i}]`)
                : validateSingleCondition(child, `${path}.all[${i}]`)
            if (!result.valid) return result
        }
        return { valid: true }
    }

    if (node.any !== undefined) {
        if (!Array.isArray(node.any)) {
            return { valid: false, error: `${path}.any: must be an array` }
        }
        for (let i = 0; i < node.any.length; i++) {
            const child = node.any[i]
            const result = (child.all !== undefined || child.any !== undefined)
                ? validateNode(child, `${path}.any[${i}]`)
                : validateSingleCondition(child, `${path}.any[${i}]`)
            if (!result.valid) return result
        }
        return { valid: true }
    }

    if (node.fact !== undefined) {
        return validateSingleCondition(node, path)
    }

    return { valid: false, error: `${path}: must have "all", "any", or "fact"` }
}

/**
 * Validate conditions structure
 * @param {Object|null} conditions
 * @returns {{ valid: boolean, error?: string }}
 */
function validateConditions (conditions) {
    if (conditions === null || conditions === undefined) return { valid: true }
    if (typeof conditions !== 'object' || Array.isArray(conditions)) {
        return { valid: false, error: 'Conditions must be an object' }
    }
    if (Object.keys(conditions).length === 0) return { valid: true }
    return validateNode(conditions)
}

/**
 * Check if conditions contain organizationIds fact (custom pricing for specific organizations)
 * @param {Object|null} conditions
 * @returns {boolean}
 */
function hasOrganizationIdCondition (conditions) {
    if (!conditions || typeof conditions !== 'object') return false

    function checkNode (node) {
        if (Array.isArray(node.all)) {
            return node.all.some(checkNode)
        }
        if (Array.isArray(node.any)) {
            return node.any.some(checkNode)
        }
        if (node.fact === 'organizationIds') {
            return true
        }
        return false
    }

    return checkNode(conditions)
}

module.exports = {
    evaluateConditions,
    evaluateConditionsAsync,
    evaluateConditionsWithDetails,
    validateConditions,
    hasOrganizationIdCondition,
    createEngine,
    SUPPORTED_FACTS,
    SUPPORTED_OPERATORS,
}
