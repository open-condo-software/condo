import { HydrationBoundary, QueryClientProvider } from '@tanstack/react-query'
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import React, { useState } from 'react'


import { makeQueryClient, TRPCProvider as DefaultTRPCProvider } from '@/domains/common/utils/trpc.client'

import type { AppRouter } from '@/domains/common/routers/_app'
import type { DehydratedState } from '@tanstack/react-query'

type TRPCProviderProps = {
    pageProps: Record<string, unknown> & { trpcState?: DehydratedState }
}

export const TRPCProvider: React.FC<React.PropsWithChildren<TRPCProviderProps>> = ({ pageProps, children }) => {
    const [queryClient] = useState(makeQueryClient)
    const [trpcClient] = useState(() =>
        createTRPCClient<AppRouter>({
            links: [
                httpBatchLink({
                    // transformer: superjson, <-- if you use a data transformer
                    url: '/api/trpc',
                }),
            ],
        }),
    )

    return (
        <QueryClientProvider client={queryClient}>
            <DefaultTRPCProvider queryClient={queryClient} trpcClient={trpcClient}>
                <HydrationBoundary state={pageProps.trpcState}>
                    {children}
                </HydrationBoundary>
            </DefaultTRPCProvider>
        </QueryClientProvider>
    )
}