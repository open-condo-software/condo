/**
 * Matches a topic against a pattern with wildcards.
 * Uses dot-separated tokens with * (single token) and > (multi-token) wildcards.
 * @param {string} topic - The actual topic to check (e.g., 'organization.org-A.ticket')
 * @param {string} pattern - The permission pattern (e.g., 'organization.org-A.*')
 * @returns {boolean} Whether the topic matches the pattern
 */
function matchTopic (topic, pattern) {
    const topicTokens = topic.split('.')
    const patTokens = pattern.split('.')

    for (let i = 0; i < patTokens.length; i++) {
        if (patTokens[i] === '>') {
            return i < topicTokens.length
        }
        if (i >= topicTokens.length) {
            return false
        }
        if (patTokens[i] !== '*' && patTokens[i] !== topicTokens[i]) {
            return false
        }
    }

    return topicTokens.length === patTokens.length
}

/**
 * Checks if a topic is allowed by a list of permission patterns.
 * @param {string} topic - The topic to check
 * @param {string[]} allowList - List of allowed topic patterns
 * @param {string[]} [denyList] - List of denied topic patterns (takes priority)
 * @returns {boolean} Whether the topic is allowed
 */
function isTopicAllowed (topic, allowList = [], denyList = []) {
    for (const pattern of denyList) {
        if (matchTopic(topic, pattern)) {
            return false
        }
    }

    for (const pattern of allowList) {
        if (matchTopic(topic, pattern)) {
            return true
        }
    }

    return false
}

module.exports = { matchTopic, isTopicAllowed }
