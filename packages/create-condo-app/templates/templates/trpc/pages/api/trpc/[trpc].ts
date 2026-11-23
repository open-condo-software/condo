import * as trpcNext from '@trpc/server/adapters/next'

import { appRouter } from '@/domains/common/routers/_app'
import { createTRPCContext } from '@/domains/common/utils/trpc.server'

export default trpcNext.createNextApiHandler({
    router: appRouter,
    createContext: createTRPCContext,
})