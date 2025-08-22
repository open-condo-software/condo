import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo } from 'react'

import { Tabs, TabItem } from '@open-condo/ui'

import { updateQuery } from '@condo/domains/common/utils/helpers'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'


type PageContentProps = {
    tabItems: TabItem[]
    availableTabs: string[]
    tabsClassName?: string
}

export const TabsPageContent: React.FC<PageContentProps> = ({ tabItems, availableTabs, tabsClassName }) => {
    const router = useRouter()

    const { tab } = parseQuery(router.query)
    const activeTab = useMemo(() => availableTabs.includes(tab) ? tab : (availableTabs?.[0] || ''),  [tab, availableTabs])

    const changeRouteToActiveTab = useCallback(async (activeTab: string, routerAction: 'replace' | 'push' = 'push') => {
        await updateQuery(router, {
            newParameters: {
                tab: activeTab,
            },
        }, { routerAction, resetOldParameters: true, shallow: true })
    }, [router])

    useEffect(() => {
        if (!activeTab) return
        if (!tab || tab !== activeTab) {
            changeRouteToActiveTab(activeTab, 'replace')
        }
    }, [activeTab, changeRouteToActiveTab, tab])

    const defaultTab = useMemo(() => availableTabs.includes(tab) ? tab : undefined, [availableTabs, tab])

    const handleTabChange = useCallback(async (newKey) => {
        await changeRouteToActiveTab(newKey)
    }, [changeRouteToActiveTab])

    return <Tabs
        defaultActiveKey={defaultTab}
        activeKey={defaultTab}
        onChange={handleTabChange}
        items={tabItems}
        className={tabsClassName}
    />
}
