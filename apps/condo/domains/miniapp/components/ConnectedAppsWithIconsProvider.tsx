import { useGetAllMiniAppsQuery } from '@app/condo/gql'
import { SortAllMiniAppsBy } from '@app/condo/schema'
import React, { createContext, useContext, useState } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'

import { ALL_MENU_CATEGORIES, DEFAULT_MENU_CATEGORY } from '@condo/domains/common/constants/menuCategories'

import type { MiniAppOutput } from '@app/condo/schema'


type AppsByCategories = Record<string, Array<MiniAppOutput>>

type IConnectedAppsWithIconsContext = {
    appsByCategories: AppsByCategories
    connectedAppsIds: Array<string>
    refetch: () => void
}

export const ConnectedWithIconsContext = createContext<IConnectedAppsWithIconsContext>({
    appsByCategories: {},
    connectedAppsIds: [],
    refetch: () => ({}),
})

export const ConnectedAppsWithIconsContextProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const { isAuthenticated, isLoading: isUserLoading } = useAuth()
    const { organization } = useOrganization()
    const orgId = organization?.id || null
    const [appsByCategories, setAppsByCategories] = useState<AppsByCategories>({})
    const [connectedApps, setConnectedApps] = useState<Array<string>>([])
    const { persistor } = useCachePersistor()

    const { refetch } = useGetAllMiniAppsQuery({
        variables: {
            data: {
                dv: 1,
                sender: getClientSideSenderInfo(),
                organization: { id: orgId },
                where: {
                    connected: true,
                    accessible: true,
                    app: { icon_not: null },
                },
                sortBy: SortAllMiniAppsBy.ConnectedAtAsc,
            },
        },
        skip: isUserLoading || !isAuthenticated || !orgId || !persistor,
        onCompleted: (allMiniAppsData) => {
            const apps = allMiniAppsData?.allMiniApps.filter(Boolean) || []
            const appsByCategories: AppsByCategories = Object.assign({}, ...ALL_MENU_CATEGORIES.map(category =>({ [category]: [] })))
            for (const app of apps) {
                const menuCategory = app?.menuCategory || DEFAULT_MENU_CATEGORY
                appsByCategories[menuCategory].push(app)
            }
            setConnectedApps(apps.map(app => app.id))
            setAppsByCategories(appsByCategories)
        },
        onError: () => {
            setConnectedApps([])
            setAppsByCategories(Object.assign({}, ...ALL_MENU_CATEGORIES.map(category =>({ [category]: [] }))))
        },
    })

    return (
        <ConnectedWithIconsContext.Provider value={{ appsByCategories: appsByCategories, refetch, connectedAppsIds: connectedApps }}>
            {children}
        </ConnectedWithIconsContext.Provider>
    )
}

export const useConnectedAppsWithIconsContext = (): IConnectedAppsWithIconsContext => useContext(ConnectedWithIconsContext)