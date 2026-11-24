import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { initializeServerApolloClient } from '@/domains/common/utils/apollo'
import { createTRPCRouter, authedProcedure } from '@/domains/common/utils/trpc.server'

import {
    GetEmployeeByUserAndOrganizationDocument,
    GetEmployeeByUserAndOrganizationQuery,
    GetEmployeeByUserAndOrganizationQueryVariables,
} from '@/gql'

export const organizationEmployeeRouter = createTRPCRouter({
    getEmployeeByUserAndOrganization: authedProcedure.input(z.strictObject({
        organizationId: z.uuid(),
    })).query(async ({ ctx, input: { organizationId } }) => {
        const client = initializeServerApolloClient(ctx)

        try {
            const { data } = await client.query<GetEmployeeByUserAndOrganizationQuery, GetEmployeeByUserAndOrganizationQueryVariables>({
                query: GetEmployeeByUserAndOrganizationDocument,
                variables: {
                    organizationId,
                    userId: ctx.condoUser.sub,
                },
            })
            return data
        } catch {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })
        }
    }),
})