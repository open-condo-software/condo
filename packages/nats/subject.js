const { z } = require('zod')

/**
 * Stream naming conventions:
 * - Must be kebab-case (lowercase with hyphens)
 * - Must end with one of the allowed suffixes: -changes, -events, -notifications
 * - Must be 3-50 characters long
 * - Examples: ticket-changes, billing-events, system-notifications
 */
const streamNameSchema = z
    .string()
    .min(3, 'Stream name must be at least 3 characters long')
    .max(50, 'Stream name must be at most 50 characters long')
    .regex(
        /^[a-z][a-z0-9]*(-[a-z0-9]+)*-(changes|events|notifications)$/,
        'Stream name must be kebab-case and end with -changes, -events, or -notifications'
    )

/**
 * Subject pattern validation:
 * - Must start with stream name
 * - Can include wildcards: * (single token) or > (multiple tokens)
 * - Must use dot notation
 * - Examples: ticket-changes.123.>, billing-events.*.payment
 */
const subjectPatternSchema = z
    .string()
    .regex(
        /^[a-z][a-z0-9-]*(\.[a-z0-9-*>]+)*$/,
        'Subject must be dot-separated tokens in lowercase, with optional wildcards (* or >)'
    )

/**
 * Build a dot-separated NATS subject from a stream name and tokens.
 * @param {string} streamName
 * @param {...string} tokens - Organization ID, resource ID, wildcards (*, >), etc.
 * @returns {string}
 */
function buildSubject (streamName, ...tokens) {
    streamNameSchema.parse(streamName)
    const subject = [streamName, ...tokens].join('.')
    subjectPatternSchema.parse(subject)
    return subject
}

const RELAY_SUBSCRIBE_PREFIX = '_NATS.subscribe'
const RELAY_UNSUBSCRIBE_PREFIX = '_NATS.unsubscribe'

/**
 * Build the relay subscribe subject for PUB-gated subscription requests.
 * @param {string} streamName - Must be a valid stream name
 * @param {string} organizationId
 * @returns {string} e.g. `_NATS.subscribe.ticket-changes.org-1`
 */
function buildRelaySubscribeSubject (streamName, organizationId) {
    streamNameSchema.parse(streamName)
    return `${RELAY_SUBSCRIBE_PREFIX}.${streamName}.${organizationId}`
}

/**
 * Build the relay unsubscribe subject.
 * @param {string} relayId
 * @returns {string} e.g. `_NATS.unsubscribe.abc123`
 */
function buildRelayUnsubscribeSubject (relayId) {
    return `${RELAY_UNSUBSCRIBE_PREFIX}.${relayId}`
}

/**
 * Build the wildcard pattern for relay subscribe (used by server-side relay service).
 * @returns {string} `_NATS.subscribe.>`
 */
function buildRelaySubscribePattern () {
    return `${RELAY_SUBSCRIBE_PREFIX}.>`
}

/**
 * Build the wildcard pattern for relay unsubscribe (used by server-side relay service).
 * @returns {string} `_NATS.unsubscribe.>`
 */
function buildRelayUnsubscribePattern () {
    return `${RELAY_UNSUBSCRIBE_PREFIX}.>`
}

module.exports = {
    streamNameSchema,
    subjectPatternSchema,
    buildSubject,
    buildRelaySubscribeSubject,
    buildRelayUnsubscribeSubject,
    buildRelaySubscribePattern,
    buildRelayUnsubscribePattern,
    RELAY_SUBSCRIBE_PREFIX,
    RELAY_UNSUBSCRIBE_PREFIX,
}
