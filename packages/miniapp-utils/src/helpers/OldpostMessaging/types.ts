import { z } from 'zod'

import type { ZodSchema } from 'zod'

type EventHandler<TParams extends Record<string, unknown>, TResult extends Record<string, unknown>> = {
    validator: ZodSchema<TParams>
    handler: (params: TParams) => Promise<TResult>
}

// const a: EventHandler = {
//     validator: z.object({ name: z.string() }).strict()
//     handler:
// }

