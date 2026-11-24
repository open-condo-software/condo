import { QueryClient } from '@tanstack/react-query'
import { createTRPCContext } from '@trpc/tanstack-react-query'

import type { AppRouter } from '@/domains/common/routers/_app'

export function makeQueryClient () {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // keep server-rendered data fresh for a while, so the
                // client doesn't fetch it again as soon as the page loads
                staleTime: 30 * 1000, // 30 seconds,
            },
        },
    })
}

export const { useTRPC, TRPCProvider } = createTRPCContext<AppRouter>()
export { useQuery, useMutation } from '@tanstack/react-query'
