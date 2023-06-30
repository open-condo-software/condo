import { SortB2BAppContextsBy } from '@app/condo/schema'
import get from 'lodash/get'
import React, { createContext, useContext, useState } from 'react'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { useOrganization } from '@open-condo/next/organization'

import { ALL_MENU_CATEGORIES, DEFAULT_MENU_CATEGORY } from '@condo/domains/common/constants/menuCategories'
import { CONTEXT_FINISHED_STATUS } from '@condo/domains/miniapp/constants'
import { B2BAppContext } from '@condo/domains/miniapp/utils/clientSchema'

import type { B2BAppContext as ContextType } from '@app/condo/schema'

type ContextsByCategories = Record<string, Array<ContextType>>

type IConnectedAppsWithIconsContext = {
    contextsByCategories: ContextsByCategories
    connectedAppsIds: Array<string>
    refetch: () => void
}

export const ConnectedWithIconsContext = createContext<IConnectedAppsWithIconsContext>({
    contextsByCategories: {},
    connectedAppsIds: [],
    refetch: () => ({}),
})

export const ConnectedAppsWithIconsContextProvider: React.FC = ({ children }) => {
    const { organization } = useOrganization()
    const orgId = get(organization, 'id', null)
    const [contextsByCategories, setContextsByCategories] = useState<ContextsByCategories>({})
    const [connectedApps, setConnectedApps] = useState<Array<string>>([])

    const { objs, refetch } = B2BAppContext.useObjects({
        where: {
            organization: { id: orgId },
            app: { icon_not: null },
            status: CONTEXT_FINISHED_STATUS,
        },
        sortBy: [SortB2BAppContextsBy.CreatedAtAsc],
    })

    useDeepCompareEffect(() => {
        const connectedAppsIds: Array<string> = []
        const contextsByCategories: ContextsByCategories = Object.assign({}, ...ALL_MENU_CATEGORIES.map(category => ({ [category]: [] })))
        for (const ctx of objs) {
            const appCategory = get(ctx, ['app', 'menuCategory'], DEFAULT_MENU_CATEGORY) || DEFAULT_MENU_CATEGORY
            contextsByCategories[appCategory].push(ctx)
            connectedAppsIds.push(ctx.app.id)
        }
        setContextsByCategories(contextsByCategories)
        setConnectedApps(connectedAppsIds)
    }, [objs])

    return (
        <ConnectedWithIconsContext.Provider value={{ contextsByCategories: contextsByCategories, refetch, connectedAppsIds: connectedApps }}>
            {children}
        </ConnectedWithIconsContext.Provider>
    )
}

export const useConnectedAppsWithIconsContext = (): IConnectedAppsWithIconsContext => useContext(ConnectedWithIconsContext)