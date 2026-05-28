import type { CondoBridgeSubscriptionEvent } from '../types/bridge'

const RESPONSE_TYPES = ['Result', 'Error', 'Event'] as const

function _isObject (value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isValidResponse (value: unknown): value is CondoBridgeSubscriptionEvent {
    const isObject = _isObject(value)
    if (!isObject) {
        return false
    }

    const { type, data } = value
    if (typeof type !== 'string') {
        return false
    }

    if (!RESPONSE_TYPES.some(responseType => type.endsWith(responseType))) {
        return false
    }

    if (!type.startsWith('CondoWebApp')) {
        return false
    }

    return (data === undefined || _isObject(data))
}