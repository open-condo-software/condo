import React, { CSSProperties, useCallback, useMemo, useRef } from 'react'
import { Tabs, Col, Row, RowProps } from 'antd'
import { useRouter } from 'next/router'
import { useIntl } from '@open-condo/next/intl'
import type { MiniAppOutput } from '@app/condo/schema'
import { SideBlockTabs, TopRowTabs, Tab } from '@condo/domains/common/components/Tabs'
import { useContainerSize } from '@condo/domains/common/hooks/useContainerSize'
import { ALL_APPS_CATEGORY } from '@condo/domains/miniapp/constants'
import { AppCard, MIN_CARD_WIDTH } from '../AppCard'

const TAB_GUTTER = 8
const CARD_GAP = 40
const CONTENT_SPACING: RowProps['gutter'] = [CARD_GAP, CARD_GAP]
const SIDE_TAB_SIDE_BAR_STYLES: CSSProperties = { marginLeft: 20 }
const TAB_SWITCH_THRESHOLD = 890

export type TabContent = {
    category: string
    apps: Array<MiniAppOutput>
}

type TabPaneContentProps = {
    tab: TabContent
}

type CardGridProps = {
    tabs: Array<TabContent>
}

const getCardsAmount = (width: number) => {
    return Math.max(1, Math.floor(width / (MIN_CARD_WIDTH + CARD_GAP)))
}

const TabPaneContent: React.FC<TabPaneContentProps> = ({ tab }) => {
    const rowRef = useRef<HTMLDivElement>(null)
    const { width } = useContainerSize(rowRef)
    const cardsPerRow = getCardsAmount(width)

    return (
        <Row gutter={CONTENT_SPACING} ref={rowRef}>
            {tab.apps.map(app => (
                <Col span={24 / cardsPerRow} key={app.id}>
                    <AppCard
                        id={app.id}
                        type={app.type}
                        connected={app.connected}
                        name={app.name}
                        description={app.shortDescription}
                        logoUrl={app.logo}
                        label={app.label}
                    />
                </Col>
            ))}
        </Row>
    )
}

export const CardGrid: React.FC<CardGridProps> = ({ tabs }) => {
    const intl = useIntl()
    const router = useRouter()
    const { query: { tab } } = router

    const sectionRef = useRef<HTMLElement>(null)
    const { width } = useContainerSize(sectionRef)
    const sideTabs = width > TAB_SWITCH_THRESHOLD

    const TabComponent = sideTabs ? SideBlockTabs : TopRowTabs
    const categories = tabs.map(tab => tab.category)
    const selectedTab = (tab && !Array.isArray(tab) && categories.includes(tab.toUpperCase())) ? tab.toUpperCase() : ALL_APPS_CATEGORY

    const tabPanes = useMemo(() => tabs.map(tab => (
        <Tabs.TabPane
            key={tab.category}
            tabKey={tab.category}
            tab={<Tab title={intl.formatMessage({ id: `miniapps.categories.${tab.category}.name` })}/>}
        >
            <TabPaneContent tab={tab}/>
        </Tabs.TabPane>
    )), [tabs, intl])

    const handleTabChange = useCallback((newKey) => {
        const newRoute = `${router.route}?tab=${newKey}`
        return router.push(newRoute)
    }, [router])

    return (
        <section ref={sectionRef}>
            <TabComponent
                tabPosition={sideTabs ? 'right' : 'top'}
                type='card'
                tabBarGutter={TAB_GUTTER}
                defaultActiveKey={selectedTab}
                activeKey={selectedTab}
                tabBarStyle={sideTabs ? SIDE_TAB_SIDE_BAR_STYLES : undefined}
                onChange={handleTabChange}
            >
                {tabPanes}
            </TabComponent>
        </section>
    )
}