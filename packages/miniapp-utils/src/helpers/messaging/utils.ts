import { z } from 'zod'

import type { EventParams, ParamsValidator, RegisteredMiddleware, HandlerResult } from './types'

type TypeChecker<T extends EventParams> = (params: unknown) => params is T

export function typeCheckerToValidator<T extends EventParams> (typeChecker: TypeChecker<T>): ParamsValidator<T> {
    return (params: unknown) => {
        if (!typeChecker(params)) {
            return { success: false, error: 'Invalid params' }
        }

        return { success: true, data: params }
    }
}

export function zodSchemaToValidator<T extends EventParams> (schema: z.ZodSchema<T>): ParamsValidator<T> {
    return (params: unknown) => {
        const result = schema.safeParse(params)
        if (!result.success) {
            return { success: false, error: z.prettifyError(result.error) }
        }

        return { success: true, data: result.data }
    }
}

/**
 * Sorts the middlewares array based on the following criteria:
 * 1. Sort by order (lower to higher)
 * 2. Non-global scope first (scope !== '*')
 * 3. Specified eventName first
 * 4. Specified eventType first
 * If first, means the middleware will be executed first and will have control of all next middlewares args / return types
 * @param middlewares
 */
export function sortedMiddlewares (middlewares: Array<RegisteredMiddleware<EventParams, HandlerResult>>): Array<RegisteredMiddleware<EventParams, HandlerResult>> {
    return middlewares.sort((a, b) => {
        // 1. Sort by order (lower to higher)
        const orderDiff = (a.order || 0) - (b.order || 0)
        if (orderDiff !== 0) return orderDiff

        // 2. Global scope should be outside (first)
        const aIsGlobal = a.scope === '*' ? 1 : 0
        const bIsGlobal = b.scope === '*' ? 1 : 0
        if (aIsGlobal !== bIsGlobal) return aIsGlobal - bIsGlobal

        // 3. Specified eventName should be inside (last)
        const aHasEventName = a.eventName ? 0 : 1
        const bHasEventName = b.eventName ? 0 : 1
        if (aHasEventName !== bHasEventName) return bHasEventName - aHasEventName

        // 4. Specified eventType should be inside (last)
        const aHasEventType = a.eventType ? 0 : 1
        const bHasEventType = b.eventType ? 0 : 1
        return bHasEventType - aHasEventType
    })
}
