import { z } from 'zod'

import { ANALYTICS_HANDLER_NAME } from './components/_utils/analytics'
export { sendAnalyticsClickEvent, sendAnalyticsCheckEvent, sendAnalyticsChangeEvent, extractChildrenContent } from './components/_utils/analytics'

import type { AnalyticsParams } from './components/_utils/analytics'

// NOTE: catchall is used to validate basic properties values.
// We don't want to validate "exact" shape of the event, since it can differ from version to version
const analyticsEventSchema = z.object({
    event: z.enum(['click', 'check', 'change']),
    component: z.string(),
    location: z.string(),
}).catchall(z.union([z.string(), z.array(z.string()), z.number(), z.boolean(), z.undefined()]))

const condoMessageDataSchema = z.strictObject({
    handler: z.literal(ANALYTICS_HANDLER_NAME),
    params: analyticsEventSchema,
    type: z.literal('condo-ui'),
    version: z.string(),
})
const MAX_ALLOWED_EVENT_PARAMS = 10

type CondoUIMessageDataType = z.infer<typeof condoMessageDataSchema>

/**
 * Checks if analytics parameters are valid
 */
export function isValidAnalyticsParams (params: unknown): params is AnalyticsParams {
    const { success, data } = analyticsEventSchema.safeParse(params)
    if (!success) {
        return false
    }

    // NOTE: prevent overloaded messages
    const isCompactEnough = Object.keys(data).length < MAX_ALLOWED_EVENT_PARAMS
    if (!isCompactEnough) {
        console.warn(`Condo UI event "${data?.event}" is containing too many parameters`)
    }

    return isCompactEnough
}

/**
 * Checks if incoming post-message is valid Condo UI message
 */
export function isValidCondoUIMessage (e: MessageEvent): e is MessageEvent<CondoUIMessageDataType> {
    const { success, data } = condoMessageDataSchema.safeParse(e.data)

    if (!success) {
        return false
    }

    // NOTE: prevent overloaded messages
    const isCompactEnough = Object.keys(data?.params).length < MAX_ALLOWED_EVENT_PARAMS
    if (!isCompactEnough) {
        console.warn(`Condo UI event "${data?.params.event}" is containing too many parameters`)
    }

    return isCompactEnough
}