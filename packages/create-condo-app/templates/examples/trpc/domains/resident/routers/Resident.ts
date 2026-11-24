import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { initializeServerApolloClient } from '@/domains/common/utils/apollo'
import { createTRPCRouter, authedProcedure } from '@/domains/common/utils/trpc.server'

import {
    GetResidentByIdDocument,
    GetResidentByIdQuery,
    GetResidentByIdQueryVariables,
} from '@/gql'

export const residentRouter = createTRPCRouter({
    getResidentById: authedProcedure.input(z.strictObject({
        id: z.uuid(),
    })).query(async ({ ctx, input: { id } }) => {
        const client = initializeServerApolloClient(ctx)

        try {
            const { data } = await client.query<GetResidentByIdQuery, GetResidentByIdQueryVariables>({
                query: GetResidentByIdDocument,
                variables: {
                    id,
                },
            })
            return data
        } catch {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })
        }
    }),
})