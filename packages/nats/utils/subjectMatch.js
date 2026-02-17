/**
 * Simulates NATS subject matching logic for testing purposes.
 * @param {string} subject - The actual subject to check (e.g., 'ticket-changes.org-A.123')
 * @param {string} pattern - The permission pattern (e.g., 'ticket-changes.org-A.>')
 * @returns {boolean} Whether the subject matches the pattern
 */
function matchNatsSubject (subject, pattern) {
    const subTokens = subject.split('.')
    const patTokens = pattern.split('.')

    for (let i = 0; i < patTokens.length; i++) {
        if (patTokens[i] === '>') {
            return i < subTokens.length
        }
        if (i >= subTokens.length) {
            return false
        }
        if (patTokens[i] !== '*' && patTokens[i] !== subTokens[i]) {
            return false
        }
    }

    return subTokens.length === patTokens.length
}

/**
 * Checks if a subject is allowed by a list of permission patterns.
 * Mimics NATS server permission checking.
 * @param {string} subject - The subject to check
 * @param {string[]} allowList - List of allowed subject patterns
 * @param {string[]} [denyList] - List of denied subject patterns (takes priority)
 * @returns {boolean} Whether the subject is allowed
 */
function isSubjectAllowed (subject, allowList = [], denyList = []) {
    for (const pattern of denyList) {
        if (matchNatsSubject(subject, pattern)) {
            return false
        }
    }

    for (const pattern of allowList) {
        if (matchNatsSubject(subject, pattern)) {
            return true
        }
    }

    return false
}

module.exports = { matchNatsSubject, isSubjectAllowed }
