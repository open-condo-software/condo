import { TRPCError } from '@trpc/server'

import { initializeServerApolloClient } from '@/domains/common/utils/apollo'
import { createTRPCRouter, publicProcedure } from '@/domains/common/utils/trpc.server'
import { AUTH_TOKEN_EXPIRATION_MARGIN_MS } from '@/domains/user/constants/auth'

import { AuthenticatedUserDocument, AuthenticatedUserQuery } from '@/gql'

export const userRouter = createTRPCRouter({
    authenticatedUser: publicProcedure.query(async ({ ctx }) => {
        if (!ctx.condoAccessToken || !ctx.constAccessTokenExpiresAt) return { authenticatedUser: null }
        if (ctx.constAccessTokenExpiresAt * 1000 - Date.now() < AUTH_TOKEN_EXPIRATION_MARGIN_MS) return { authenticatedUser: null }

        const client = initializeServerApolloClient(ctx)

        try {
            const { data } = await client.query<AuthenticatedUserQuery>({ query: AuthenticatedUserDocument })
            return data
        } catch {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })
        }
    }),
})