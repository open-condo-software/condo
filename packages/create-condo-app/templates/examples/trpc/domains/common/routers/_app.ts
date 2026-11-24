import { createTRPCRouter } from '@/domains/common/utils/trpc.server'
import { organizationEmployeeRouter } from '@/domains/organization/routers/OrganizationEmployee'
import { residentRouter } from '@/domains/resident/routers/Resident'
import { userRouter } from '@/domains/user/routers/User'

export const appRouter = createTRPCRouter({
    organizationEmployee: organizationEmployeeRouter,
    resident: residentRouter,
    user: userRouter,
})

export type AppRouter = typeof appRouter