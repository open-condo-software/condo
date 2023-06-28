import get from 'lodash/get'
import React, { createContext, useContext } from 'react'

import { useOrganization } from '@open-condo/next/organization'

import { CONTEXT_FINISHED_STATUS } from '@condo/domains/miniapp/constants'
import { B2BAppContext } from '@condo/domains/miniapp/utils/clientSchema'

import type { B2BAppContext as ContextType } from '@app/condo/schema'

type IConnectedAppsWithIconsContext = {
    contexts: Array<ContextType>
    refetch: () => void
}

export const ConnectedWithIconsContext = createContext<IConnectedAppsWithIconsContext>({
    contexts: [],
    refetch: () => ({}),
})

export const ConnectedAppsWithIconsContextProvider: React.FC = ({ children }) => {
    const { organization } = useOrganization()
    const orgId = get(organization, 'id', null)
    const { objs, refetch } = B2BAppContext.useObjects({
        where: {
            organization: { id: orgId },
            app: { icon_not: null },
            status: CONTEXT_FINISHED_STATUS,
        },
    })

    return (
        <ConnectedWithIconsContext.Provider value={{ contexts: objs, refetch }}>
            {children}
        </ConnectedWithIconsContext.Provider>
    )
}

export const useConnectedAppsWithIconsContext = (): IConnectedAppsWithIconsContext => useContext(ConnectedWithIconsContext)