import { z } from 'zod'

import type { EventParams, ParamsValidator } from './types'

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