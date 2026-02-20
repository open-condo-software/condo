const { z } = require('zod')

/**
 * Channel naming conventions:
 * - Must be kebab-case (lowercase with hyphens)
 * - Must end with one of the allowed suffixes: -changes, -events, -notifications
 * - Must be 3-50 characters long
 * - Examples: ticket-changes, billing-events, system-notifications
 */
const channelNameSchema = z
    .string()
    .min(3, 'Channel name must be at least 3 characters long')
    .max(50, 'Channel name must be at most 50 characters long')
    .regex(
        /^[a-z][a-z0-9]*(-[a-z0-9]+)*-(changes|events|notifications)$/,
        'Channel name must be kebab-case and end with -changes, -events, or -notifications'
    )

/**
 * Topic pattern validation:
 * - Must start with channel name
 * - Can include wildcards: * (single token) or > (multiple tokens)
 * - Must use dot notation
 * - Examples: ticket-changes.123.>, billing-events.*.payment
 */
const topicPatternSchema = z
    .string()
    .regex(
        /^[a-z][a-z0-9-]*(\.[a-z0-9-*>]+)*$/,
        'Topic must be dot-separated tokens in lowercase, with optional wildcards (* or >)'
    )

/**
 * Build a dot-separated topic from a channel name and tokens.
 * @param {string} channelName
 * @param {...string} tokens - Organization ID, resource ID, wildcards (*, >), etc.
 * @returns {string}
 */
function buildTopic (channelName, ...tokens) {
    channelNameSchema.parse(channelName)
    const topic = [channelName, ...tokens].join('.')
    topicPatternSchema.parse(topic)
    return topic
}

const RELAY_SUBSCRIBE_PREFIX = '_MESSAGING.subscribe'
const RELAY_UNSUBSCRIBE_PREFIX = '_MESSAGING.unsubscribe'

/**
 * Build the relay subscribe topic for PUB-gated subscription requests.
 * @param {string} channelName - Must be a valid channel name
 * @param {string} organizationId
 * @returns {string} e.g. `_MESSAGING.subscribe.ticket-changes.org-1`
 */
function buildRelaySubscribeTopic (channelName, organizationId) {
    channelNameSchema.parse(channelName)
    return `${RELAY_SUBSCRIBE_PREFIX}.${channelName}.${organizationId}`
}

/**
 * Build the relay unsubscribe topic.
 * @param {string} relayId
 * @returns {string} e.g. `_MESSAGING.unsubscribe.abc123`
 */
function buildRelayUnsubscribeTopic (relayId) {
    return `${RELAY_UNSUBSCRIBE_PREFIX}.${relayId}`
}

/**
 * Build the wildcard pattern for relay subscribe (used by server-side relay service).
 * @returns {string} `_MESSAGING.subscribe.>`
 */
function buildRelaySubscribePattern () {
    return `${RELAY_SUBSCRIBE_PREFIX}.>`
}

/**
 * Build the wildcard pattern for relay unsubscribe (used by server-side relay service).
 * @returns {string} `_MESSAGING.unsubscribe.>`
 */
function buildRelayUnsubscribePattern () {
    return `${RELAY_UNSUBSCRIBE_PREFIX}.>`
}

module.exports = {
    channelNameSchema,
    topicPatternSchema,
    buildTopic,
    buildRelaySubscribeTopic,
    buildRelayUnsubscribeTopic,
    buildRelaySubscribePattern,
    buildRelayUnsubscribePattern,
    RELAY_SUBSCRIBE_PREFIX,
    RELAY_UNSUBSCRIBE_PREFIX,
}
