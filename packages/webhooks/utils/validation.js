/**
 * Regex pattern for eventType validation.
 * Format: {resource}.{action} or {resource}.{sub-resource}.{action}
 * - Supports lowercase or camelCase
 * - Use dots as separators
 * - Each segment must start with a letter and contain only letters, numbers, and hyphens
 * Examples: "payment.created", "payment.status.changed", "test.event.7v5619fr"
 */
const EVENT_TYPE_PATTERN = /^[a-zA-Z][a-zA-Z0-9-]*(\.[a-zA-Z0-9][a-zA-Z0-9-]*)+$/

/**
 * Validates eventType value.
 * @param {string} eventType - The event type to validate
 * @returns {{ isValid: boolean, error?: string }} Validation result
 */
function validateEventType (eventType) {
    if (typeof eventType !== 'string') {
        return { isValid: false, error: 'Event type must be a string' }
    }

    if (eventType.length < 3) {
        return { isValid: false, error: 'Event type must be at least 3 characters' }
    }

    if (eventType.length > 255) {
        return { isValid: false, error: 'Event type must not exceed 255 characters' }
    }

    if (!EVENT_TYPE_PATTERN.test(eventType)) {
        return {
            isValid: false,
            error: 'Event type must use dot-notation format (e.g., "payment.created", "payment.status.changed"). Use letters, numbers, hyphens, with dots as separators.',
        }
    }

    return { isValid: true }
}

module.exports = {
    EVENT_TYPE_PATTERN,
    validateEventType,
}
