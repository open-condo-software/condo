/**
 * Conditions evaluator for subscription pricing rules using json-rules-engine
 * 
 * Condition format (json-rules-engine):
 * {
 *   all: [condition, ...],  // AND - all conditions must match
 *   any: [condition, ...],  // OR - at least one condition must match
 * }
 * 
 * Single condition:
 * { fact: 'organizationFeatures', operator: 'contains', value: 'ACTIVE_BANKING' }
 * 
 * Facts (from organization):
 * - organizationIds (array) - [organization.id]
 * - organizationFeatures (array) - organization.features
 * 
 * Operators:
 * - contains (for arrays)
 * - equal, notEqual
 * - in, notIn (value is array)
 */

const { Engine } = require('json-rules-engine')

const SUPPORTED_FACTS = ['organizationIds', 'organizationFeatures']
const SUPPORTED_OPERATORS = ['contains', 'equal', 'notEqual', 'in', 'notIn']

/**
 * Create engine with custom operators
 */
function createEngine () {
    const engine = new Engine([], { allowUndefinedFacts: true })
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
 * Stored format: { all: [...] } or { any: [...] } or single condition { fact, operator, value }
 * Engine format: { conditions: { all: [...] }, event: { type: 'match' } }
 */
function toEngineRule (conditions) {
    // If it's a single condition (has 'fact' property), wrap it in 'all'
    const engineConditions = conditions.fact !== undefined
        ? { all: [conditions] }
        : conditions

    return {
        conditions: engineConditions,
        event: { type: 'match' },
    }
}

/**
 * Evaluate conditions against context using json-rules-engine
 * @param {Object|null} conditions
 * @param {Object} context - { organization }
 * @returns {Promise<boolean>}
 */
async function evaluateConditions (conditions, context) {
    if (!conditions || Object.keys(conditions).length === 0) return true

    const engine = createEngine()
    const rule = toEngineRule(conditions)
    engine.addRule(rule)

    const facts = buildFacts(context)
    const { events } = await engine.run(facts)

    return events.length > 0
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

module.exports = {
    evaluateConditions,
    validateConditions,
    createEngine,
    SUPPORTED_FACTS,
    SUPPORTED_OPERATORS,
}
