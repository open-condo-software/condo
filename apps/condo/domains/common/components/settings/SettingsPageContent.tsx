import { Tabs } from 'antd'
import { useRouter } from 'next/router'
import React, { CSSProperties, useCallback, useMemo } from 'react'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import {
    SettingsTabPaneDescriptor,
} from '@condo/domains/common/components/settings/Tabs'
import {
    Tab,
    TopRowTabs,
    SideBlockTabs,
} from '@condo/domains/common/components/Tabs'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'

type PageContentProps = {
    settingsTabs: SettingsTabPaneDescriptor[]
    availableTabs: string[]
}

const SETTINGS_TABS_STYLES: CSSProperties = { overflow: 'visible' }

export const SettingsPageContent: React.FC<PageContentProps> = ({ settingsTabs, availableTabs }) => {
    const router = useRouter()
    const { tab } = parseQuery(router.query)

    const defaultTab = useMemo(() => availableTabs.includes(tab) ? tab : undefined, [availableTabs, tab])

    const handleTabChange = useCallback((newKey) => {
        const newRoute = `${router.route}?tab=${newKey}`
        return router.push(newRoute)
    }, [router])

    const settingsTabPanes = useMemo(() => settingsTabs.map(tab => (
        <Tabs.TabPane
            key={tab.key}
            tab={<Tab title={tab.title} eventName={tab.eventName}/>}
            {...tab}
        >
            {tab.content}
        </Tabs.TabPane>
    )), [settingsTabs])

    const { isSmall } = useLayoutContext()

    const SettingsTabsComponent = isSmall ? TopRowTabs : SideBlockTabs

    return settingsTabs.length === 1 ? (
        settingsTabs[0].content
    ) : (
        <SettingsTabsComponent
            tabPosition={isSmall ? 'top' : 'right'}
            type='card'
            defaultActiveKey={defaultTab}
            activeKey={defaultTab}
            tabBarGutter={8}
            style={SETTINGS_TABS_STYLES}
            onChange={handleTabChange}
        >
            {settingsTabPanes}
        </SettingsTabsComponent>
    )
}
