/**
 * @param {string} ruleValue
 * @param {string | undefined} ctxValue
 * @returns {boolean}
 * @private
 */
function _isStringMatching (ruleValue, ctxValue) {
    return (typeof ctxValue === 'string' && ruleValue === ctxValue)
}

/**
 * @param {RegExp} ruleValue
 * @param {string | undefined} ctxValue
 * @returns {*}
 * @private
 */
function _isRegexpMatching (ruleValue, ctxValue) {
    return (typeof ctxValue === 'string' && ruleValue.test(ctxValue))
}

/**
 * Checks context value matching rule one based on ruleValue type
 * @param {string | RegExp} ruleValue
 * @param {string | undefined} ctxValue
 * @private
 */
function _isStringOrRegExpMatching (ruleValue, ctxValue) {
    return typeof ruleValue === 'string'
        ? _isStringMatching(ruleValue, ctxValue)
        : _isRegexpMatching(ruleValue, ctxValue)
}

/**
 * Checks if the routing rule matches context value
 * @param {{
 * gqlOperationType: string | undefined,
 * gqlOperationName: string | undefined,
 * sqlOperationName: string | undefined,
 * tableName: string | undefined
 * target: string
 * }} rule - routing rule
 * @param {{
 * gqlOperationType: string | undefined,
 * gqlOperationName: string | undefined,
 * sqlOperationName: string | undefined,
 * tableName: string | undefined
 * }} ctx - current sql-query context
 * @returns {boolean}
 */
function isRuleMatching (rule, ctx) {
    const {
        gqlOperationType,
        gqlOperationName,
        sqlOperationName,
        tableName,
    } = ctx

    if (rule.gqlOperationType && !_isStringMatching(rule.gqlOperationType, gqlOperationType)) {
        return false
    }
    if (rule.gqlOperationName && !_isStringOrRegExpMatching(rule.gqlOperationName, gqlOperationName)) {
        return false
    }
    if (rule.sqlOperationName && !_isStringMatching(rule.sqlOperationName, sqlOperationName)) {
        return false
    }

    return !(rule.tableName && !_isStringOrRegExpMatching(rule.tableName, tableName))
}

module.exports = {
    isRuleMatching,
}