import { createTRPCRouter } from '@/domains/common/utils/trpc.server'
import { userRouter } from '@/domains/user/routers/User'

export const appRouter = createTRPCRouter({
    user: userRouter,
})

export type AppRouter = typeof appRouter