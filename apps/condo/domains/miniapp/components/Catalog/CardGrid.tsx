import { css, Global } from '@emotion/react'
import { Tabs, Col, Row, RowProps } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { CSSProperties, useCallback } from 'react'

import { Star, List, House, SmartHome, Rocket, CircleEllipsis, CheckSquare, Ruble } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { SideBlockTabs, TopRowTabs, Tab } from '@condo/domains/common/components/Tabs'
import { useContainerSize } from '@condo/domains/common/hooks/useContainerSize'
import {
    ALL_APPS_CATEGORY,
    CONNECTED_APPS_CATEGORY,
    DISPATCHING_CATEGORY,
    GIS_CATEGORY,
    SMART_HOME_CATEGORY,
    BUSINESS_DEVELOPMENT_CATEGORY,
    FINANCE_CATEGORY,
    OTHER_CATEGORY,
} from '@condo/domains/miniapp/constants'

import { AppCard, MIN_CARD_WIDTH } from '../AppCard'

import type { B2BAppLabelType, MiniAppOutput } from '@app/condo/schema'


const SEARCH_TAB_KEY = 'search'
const TAB_GUTTER = 8
const CARD_GAP = 40
const CONTENT_SPACING: RowProps['gutter'] = [CARD_GAP, CARD_GAP]
const SIDE_TAB_SIDE_BAR_STYLES: CSSProperties = { marginLeft: 20 }
const TAB_SWITCH_THRESHOLD = 890
const TAB_ICONS = {
    [ALL_APPS_CATEGORY]: <Star/>,
    [CONNECTED_APPS_CATEGORY]: <CheckSquare/>,
    [DISPATCHING_CATEGORY]: <List/>,
    [GIS_CATEGORY]: <House/>,
    [SMART_HOME_CATEGORY]: <SmartHome/>,
    [BUSINESS_DEVELOPMENT_CATEGORY]: <Rocket/>,
    [FINANCE_CATEGORY]: <Ruble/>,
    [OTHER_CATEGORY]: <CircleEllipsis/>,
}
const HIDE_SEARCH_CSS = css`
  .tabs-hide-first {
    .ant-tabs-tab:first-of-type {
      display: none;
    }
    
    .ant-tabs-tab:nth-of-type(2) {
      margin-left: 0 !important;
    }
    .ant-tabs-nav-operations { 
      display: none !important; 
    }
  }
`

export type TabContent = {
    category: string
    apps: Array<MiniAppOutput>
}

type TabPaneContentProps = {
    tab: TabContent
    fallback?: React.ReactElement
}

type CardGridProps = {
    tabs: Array<TabContent>
    search: string
    resetSearch: () => void
}

const getCardsAmount = (width: number) => {
    return Math.max(1, Math.floor(width / (MIN_CARD_WIDTH + CARD_GAP)))
}

const TabPaneContent: React.FC<TabPaneContentProps> = ({ tab, fallback }) => {
    const intl = useIntl()
    const NoAppsMessage = intl.formatMessage({ id: 'miniapps.catalog.noServicesInCategory' })

    const router = useRouter()

    const [{ width }, refCallback] = useContainerSize<HTMLDivElement>()
    const cardsPerRow = getCardsAmount(width)

    const handleCardClick = useCallback((id: string, connected: boolean, accessible: boolean) => {
        return function redirect () {
            const url = connected && accessible
                ? `/miniapps/${id}`
                : `/miniapps/${id}/about`
            router.push(url)
        }
    }, [router])

    if (!tab.apps.length) {
        return fallback ? (
            fallback
        ) : (
            (
                <BasicEmptyListView
                    image='/dino/playing@2x.png'
                >
                    <Typography.Title level={3}>
                        {NoAppsMessage}
                    </Typography.Title>
                </BasicEmptyListView>
            )
        )
    }

    return (
        <Row gutter={CONTENT_SPACING} ref={refCallback}>
            {tab.apps.map(app => (
                <Col span={24 / cardsPerRow} key={`${cardsPerRow}:${app.id}`}>
                    <AppCard
                        connected={app.connected && app.accessible}
                        name={app.name}
                        description={app.shortDescription}
                        logoUrl={app.logo}
                        label={app.label as B2BAppLabelType}
                        onClick={handleCardClick(app.id, app.connected, app.accessible)}
                    />
                </Col>
            ))}
        </Row>
    )
}

export const CardGrid: React.FC<CardGridProps> = ({ tabs, search, resetSearch }) => {
    const intl = useIntl()
    const NoAppsFoundMessage = intl.formatMessage({ id: 'miniapps.catalog.noServicesFound' })

    const router = useRouter()
    const { query: { tab } } = router

    const [{ width }, setRef] = useContainerSize<HTMLElement>()
    const sideTabs = width > TAB_SWITCH_THRESHOLD

    const TabComponent = sideTabs ? SideBlockTabs : TopRowTabs
    const categories = tabs.map(tab => tab.category)
    const tabFromQuery = (tab && !Array.isArray(tab) && categories.includes(tab.toUpperCase())) ? tab.toUpperCase() : ALL_APPS_CATEGORY
    const selectedTab = search ? SEARCH_TAB_KEY : tabFromQuery

    const handleTabChange = useCallback((newKey) => {
        const newRoute = `${router.route}?tab=${newKey}`
        return router.push(newRoute, undefined, { shallow: true }).then(resetSearch)
    }, [router, resetSearch])

    const searchTab: TabContent = {
        apps: get(tabs.filter(tab => tab.category === ALL_APPS_CATEGORY), ['0', 'apps'], []),
        category: SEARCH_TAB_KEY,
    }

    return (
        <section ref={setRef}>
            <Global styles={HIDE_SEARCH_CSS}/>
            <TabComponent
                tabPosition={sideTabs ? 'right' : 'top'}
                type='card'
                tabBarGutter={TAB_GUTTER}
                defaultActiveKey={tabFromQuery}
                activeKey={selectedTab}
                tabBarStyle={sideTabs ? SIDE_TAB_SIDE_BAR_STYLES : {}}
                onChange={handleTabChange}
                className='tabs-hide-first'
            >
                <Tabs.TabPane
                    key={SEARCH_TAB_KEY}
                    tabKey={SEARCH_TAB_KEY}
                    tab={null}
                >
                    <TabPaneContent
                        tab={searchTab}
                        fallback={(
                            <BasicEmptyListView
                                image='/dino/searching@2x.png'
                            >
                                <Typography.Title level={3}>
                                    {NoAppsFoundMessage}
                                </Typography.Title>
                            </BasicEmptyListView>
                        )}
                    />
                </Tabs.TabPane>
                {tabs.map(tab => (
                    <Tabs.TabPane
                        key={tab.category}
                        tabKey={tab.category}
                        tab={
                            <Tab
                                tabKey={tab.category}
                                title={intl.formatMessage({ id: `miniapps.categories.${tab.category}.name` as FormatjsIntl.Message['ids'] })}
                                icon={get(TAB_ICONS, tab.category)}
                            />
                        }
                    >
                        <TabPaneContent tab={tab}/>
                    </Tabs.TabPane>
                ))}
            </TabComponent>
        </section>
    )
}