import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'

import { Tabs, TabItem } from '@open-condo/ui'

import { parseQuery } from '@condo/domains/common/utils/tables.utils'

type PageContentProps = {
    settingsTabs: TabItem[]
    availableTabs: string[]
}

export const SettingsPageContent: React.FC<PageContentProps> = ({ settingsTabs, availableTabs }) => {
    const router = useRouter()
    const { tab } = parseQuery(router.query)

    const defaultTab = useMemo(() => availableTabs.includes(tab) ? tab : undefined, [availableTabs, tab])

    const handleTabChange = useCallback((newKey) => {
        const newRoute = `${router.route}?tab=${newKey}`
        return router.push(newRoute)
    }, [router])

    return <Tabs
        defaultActiveKey={defaultTab}
        activeKey={defaultTab}
        onChange={handleTabChange}
        items={settingsTabs}
    />
}
