import { createContext, useContext } from 'react'

import type { AcquiringIntegrationContext as AcquiringIntegrationContextSchema } from '@app/condo/schema'

type IAcquiringContext = {
    acquiringContext: AcquiringIntegrationContextSchema
    refetchAcquiringContext: () => void
}

export const AcquiringContext = createContext<IAcquiringContext>({
    acquiringContext: null,
    refetchAcquiringContext: () => ({}),
})

export function useAcquiringContext (): IAcquiringContext {
    return useContext(AcquiringContext)
}
