import { SortAllMiniAppsBy } from '@app/condo/schema'
import get from 'lodash/get'
import React, { createContext, useCallback, useContext, useState } from 'react'

import { useQuery } from '@open-condo/next/apollo'
import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'

import { ALL_MENU_CATEGORIES, DEFAULT_MENU_CATEGORY } from '@condo/domains/common/constants/menuCategories'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { ALL_MINI_APPS_QUERY } from '@condo/domains/miniapp/gql'


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

export const ConnectedAppsWithIconsContextProvider: React.FC = ({ children }) => {
    const { isAuthenticated, isLoading: isUserLoading } = useAuth()
    const { organization } = useOrganization()
    const orgId = get(organization, 'id', null)
    const [appsByCategories, setAppsByCategories] = useState<AppsByCategories>({})
    const [connectedApps, setConnectedApps] = useState<Array<string>>([])

    const { refetch } = useQuery(ALL_MINI_APPS_QUERY, {
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
        skip: isUserLoading || !isAuthenticated || !orgId,
        onCompleted: (data) => {
            const apps = get(data, 'objs', [])
            const appsByCategories: AppsByCategories = Object.assign({}, ...ALL_MENU_CATEGORIES.map(category =>({ [category]: [] })))
            for (const app of apps) {
                const menuCategory = get(app, 'menuCategory', DEFAULT_MENU_CATEGORY) || DEFAULT_MENU_CATEGORY
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

    const refetchAuth = useCallback(async () => {
        await refetch()
    }, [refetch])

    return (
        <ConnectedWithIconsContext.Provider value={{ appsByCategories: appsByCategories, refetch: refetchAuth, connectedAppsIds: connectedApps }}>
            {children}
        </ConnectedWithIconsContext.Provider>
    )
}

export const useConnectedAppsWithIconsContext = (): IConnectedAppsWithIconsContext => useContext(ConnectedWithIconsContext)