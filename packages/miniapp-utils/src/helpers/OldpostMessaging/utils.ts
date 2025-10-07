import { z } from 'zod'

// NOTE: SRC = https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
const SEMVER_REGEXP = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/


export function getEventDataSchema () {
    return z.object({
        /** Name of handler, for example "CondoWebAppGetFragment" */
        handler: z.string(),
        /** Parameters to pass to handler, always an object */
        params: z.record(z.string(), z.unknown()).and(z.object({ requestId: z.string() })),
        /** Type of message */
        type: z.string(),
        /** Version of sender (condo-bridge, condo-ui or other type) */
        version: z.string().regex(SEMVER_REGEXP),
    }).strict()
}
