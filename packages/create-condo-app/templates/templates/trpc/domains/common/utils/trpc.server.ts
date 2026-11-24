import { initTRPC, TRPCError } from '@trpc/server'
import { z } from 'zod'

import { condoOIDCMiddleware } from '@/domains/user/utils/auth'

import type { CreateNextContextOptions } from '@trpc/server/adapters/next'

const CONDO_USER_OIDC_SCHEMA = z.object({
    sub: z.uuid(),
    type: z.enum(['staff', 'resident', 'service']),
    name: z.string().nullable(),
})

export type TRPCContext = {
    condoUser: z.infer<typeof CONDO_USER_OIDC_SCHEMA>
    condoAccessToken: string
    constAccessTokenExpiresAt: number
} & Pick<CreateNextContextOptions, 'req' | 'res'>

function decodeIdToken (idToken?: string){
    if (typeof idToken !== 'string') return null
    try {
        const payloadB64 = idToken.split('.')[1]
        const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'))
        const { data } = CONDO_USER_OIDC_SCHEMA.safeParse(payload)

        return data ?? null
    } catch {
        return null
    }
}

export async function createTRPCContext (opts: CreateNextContextOptions) {
    const { accessToken, accessTokenExpiresAt, idToken } = await condoOIDCMiddleware.extractOIDCTokensFromRequest(opts.req, opts.res)
    if (!accessToken || !accessTokenExpiresAt || !idToken) return {}
    const user = decodeIdToken(idToken)
    if (!user) return {}



    return {
        condoUser: user,
        condoAccessToken: accessToken,
        constAccessTokenExpiresAt: accessTokenExpiresAt,
        req: opts.req,
        res: opts.res,
    }
}

const t = initTRPC.context<typeof createTRPCContext>().create()

const enforceAuth = t.middleware(({ ctx, next }) => {
    if (!ctx.condoUser || !ctx.condoAccessToken || !ctx.constAccessTokenExpiresAt) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    const enforcedContext: TRPCContext = {
        condoUser: ctx.condoUser,
        condoAccessToken: ctx.condoAccessToken,
        constAccessTokenExpiresAt: ctx.constAccessTokenExpiresAt,
        req: ctx.req,
        res: ctx.res,
    }

    return next({ ctx: enforcedContext })
})

/** @deprecated DON'T USE PUBLIC PROCEDURE FOR ANYTHING EXCEPT */
export const publicProcedure = t.procedure
export const authedProcedure = t.procedure.use(enforceAuth)
export const createTRPCRouter = t.router