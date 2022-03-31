import React, { CSSProperties, useMemo } from 'react'
import { Typography, Row, Col, Tabs } from 'antd'
import { useIntl } from '@core/next/intl'
import { PageHeader } from '@condo/domains/common/components/containers/BaseLayout'
import Carousel from '@condo/domains/common/components/Carousel'
import { Section } from './Section'
import { CardsContainer, CardsPerRowType } from './CardsContainer'
import { AppCarouselCard } from './AppCarouselCard'
import { AppSelectCard } from './AppSelectCard'
import { useWindowSize } from '@condo/domains/common/hooks/useWindowSize'
import { useQuery } from '@core/next/apollo'
import { ALL_ORGANIZATION_APPS_QUERY } from '@condo/domains/miniapp/gql.js'
import { get } from 'lodash'
import { useOrganization } from '@core/next/organization'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { BILLING_APP_TYPE, ACQUIRING_APP_TYPE } from '@condo/domains/miniapp/constants'
import { useRouter } from 'next/router'


const WINDOW_MEDIUM_SELECT_CARD_WIDTH = 870
const WINDOW_SMALL_SELECT_CARD_WIDTH = 550
const WINDOW_MEDIUM_CAROUSEL_CARD_WIDTH = 800
const WINDOW_SMALL_CAROUSEL_CARD_WIDTH = 625
const WINDOW_SMALLEST_CAROUSEL_CARD_WIDTH = 460

const PAGE_CONTENT_STYLES: CSSProperties = { paddingBottom: 60 }

export const AppSelectPageContent: React.FC = () => {
    const intl = useIntl()
    const LoadingMessage = intl.formatMessage({ id: 'Loading' })
    const PageTitle = intl.formatMessage({ id: 'menu.Services' })
    const AlreadyConnectedSectionTitle = intl.formatMessage({ id: 'services.AlreadyConnected' })
    const AvailableSectionTitle = intl.formatMessage({ id: 'services.Available' })
    const AllCategoryMessage = intl.formatMessage({ id: 'services.category.ALL' })
    const BillingCategoryMessage = intl.formatMessage({ id: 'services.category.BILLING' })
    const AcquiringCategoryMessage = intl.formatMessage({ id: 'services.category.ACQUIRING' })

    const { width } = useWindowSize()

    let appsPerRow: CardsPerRowType = 3
    if (width && width < WINDOW_SMALL_SELECT_CARD_WIDTH) appsPerRow = 1
    else if (width && width < WINDOW_MEDIUM_SELECT_CARD_WIDTH) appsPerRow = 2

    let slidesToShow = 4
    if (width && width < WINDOW_SMALLEST_CAROUSEL_CARD_WIDTH) slidesToShow = 1
    else if (width && width < WINDOW_SMALL_CAROUSEL_CARD_WIDTH) slidesToShow = 2
    else if (width && width < WINDOW_MEDIUM_CAROUSEL_CARD_WIDTH) slidesToShow = 3

    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])

    const { loading, error, data } = useQuery(ALL_ORGANIZATION_APPS_QUERY, {
        fetchPolicy: 'cache-and-network',
        variables: {
            data: {
                dv: 1,
                sender: { dv: 1, fingerprint: 'initial' },
                organization: { id: userOrganizationId },
            },
        },
    })

    const router = useRouter()

    const apps = get(data, 'objs', [])
    const connectedApps = apps.filter(app => app.connected)
    const unconnectedApps = apps.filter(app => !app.connected)
    const unconnectedBillingsApps = unconnectedApps.filter(app => app.type === BILLING_APP_TYPE)
    const unconnectedAcquiringApps = unconnectedApps.filter(app => app.type === ACQUIRING_APP_TYPE)

    const isAnyAppConnected = Boolean(connectedApps.length)
    const isAnyAppAvailable = Boolean(unconnectedApps.length)
    const isAnyBillingAvailable = Boolean(unconnectedBillingsApps.length)
    const isAnyAcquiringAvailable = Boolean(unconnectedAcquiringApps.length)

    const availableTabs = useMemo(() => {
        const tabs = []
        if (isAnyAppAvailable) tabs.push('all')
        if (isAnyBillingAvailable) tabs.push('billing')
        if (isAnyAcquiringAvailable) tabs.push('acquiring')
        return tabs
    }, [isAnyAppAvailable, isAnyAcquiringAvailable, isAnyBillingAvailable])

    const { query: { tab } } = router
    const defaultTab = (!Array.isArray(tab) && availableTabs.includes(tab)) ? tab : undefined
    const handleTabChange = (newKey) => {
        const newRoute = `${router.route}?tab=${newKey}`
        return router.push(newRoute)
    }

    const pageHeaderStyles: CSSProperties = { paddingBottom: isAnyAppConnected ? 60 : 44 }

    if (loading || error) {
        return <LoadingOrErrorPage title={LoadingMessage} error={error} loading={loading}/>
    }

    return (
        <>
            <PageHeader title={<Typography.Title>{PageTitle}</Typography.Title>} style={pageHeaderStyles}/>
            <Row gutter={[0, 60]} style={PAGE_CONTENT_STYLES}>
                {
                    isAnyAppConnected &&
                    <Col span={24}>
                        <Section title={AlreadyConnectedSectionTitle}>
                            <Carousel slidesToShow={slidesToShow}>
                                {
                                    connectedApps.map(app => {
                                        const logo = app.logo || undefined
                                        const url = `/miniapps/${app.id}?type=${app.type}`
                                        return (
                                            <AppCarouselCard
                                                key={app.name}
                                                title={app.name}
                                                logoSrc={logo}
                                                url={url}
                                            />
                                        )
                                    })
                                }
                            </Carousel>
                        </Section>
                    </Col>
                }
                {
                    isAnyAppAvailable && (
                        <Col span={24}>
                            <Section title={AvailableSectionTitle} hideTitle={!isAnyAppConnected}>
                                <Tabs
                                    defaultActiveKey={defaultTab}
                                    activeKey={defaultTab}
                                    onChange={handleTabChange}
                                >
                                    <Tabs.TabPane tab={AllCategoryMessage} key={'all'}>
                                        <CardsContainer cardsPerRow={appsPerRow}>
                                            {
                                                unconnectedApps.map(app => {
                                                    const tag = app.category
                                                        ? intl.formatMessage({ id: `services.category.${app.category}` })
                                                        : undefined
                                                    const url = `/miniapps/${app.id}/about?type=${app.type}`
                                                    const logo = app.logo || undefined
                                                    return (
                                                        <AppSelectCard
                                                            key={app.name}
                                                            title={app.name}
                                                            description={app.shortDescription}
                                                            url={url}
                                                            tag={tag}
                                                            logoSrc={logo}
                                                        />
                                                    )
                                                })
                                            }
                                        </CardsContainer>
                                    </Tabs.TabPane>
                                    {
                                        isAnyBillingAvailable && (
                                            <Tabs.TabPane tab={BillingCategoryMessage} key={'billing'}>
                                                <CardsContainer cardsPerRow={appsPerRow}>
                                                    {
                                                        unconnectedBillingsApps.map(app => {
                                                            const tag = app.category
                                                                ? intl.formatMessage({ id: `services.category.${app.category}` })
                                                                : undefined
                                                            const url = `/miniapps/${app.id}/about?type=${app.type}`
                                                            const logo = app.logo || undefined
                                                            return (
                                                                <AppSelectCard
                                                                    key={app.name}
                                                                    title={app.name}
                                                                    description={app.shortDescription}
                                                                    url={url}
                                                                    tag={tag}
                                                                    logoSrc={logo}
                                                                />
                                                            )
                                                        })
                                                    }
                                                </CardsContainer>
                                            </Tabs.TabPane>
                                        )
                                    }
                                    {
                                        isAnyAcquiringAvailable && (
                                            <Tabs.TabPane tab={AcquiringCategoryMessage} key={'acquiring'}>
                                                <CardsContainer cardsPerRow={appsPerRow}>
                                                    {
                                                        unconnectedAcquiringApps.map(app => {
                                                            const tag = app.category
                                                                ? intl.formatMessage({ id: `services.category.${app.category}` })
                                                                : undefined
                                                            const url = `/miniapps/${app.id}/about?type=${app.type}`
                                                            const logo = app.logo || undefined
                                                            return (
                                                                <AppSelectCard
                                                                    key={app.name}
                                                                    title={app.name}
                                                                    description={app.shortDescription}
                                                                    url={url}
                                                                    tag={tag}
                                                                    logoSrc={logo}
                                                                />
                                                            )
                                                        })
                                                    }
                                                </CardsContainer>
                                            </Tabs.TabPane>
                                        )
                                    }
                                </Tabs>
                            </Section>
                        </Col>
                    )
                }
            </Row>
        </>
    )
}
