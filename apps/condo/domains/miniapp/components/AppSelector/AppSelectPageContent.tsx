import React, { CSSProperties } from 'react'
import { Typography, Row, Col } from 'antd'
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

    const { width } = useWindowSize()

    let servicesPerRow: CardsPerRowType = 3
    if (width && width < WINDOW_SMALL_SELECT_CARD_WIDTH) servicesPerRow = 1
    else if (width && width < WINDOW_MEDIUM_SELECT_CARD_WIDTH) servicesPerRow = 2

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

    if (loading || error) {
        return <LoadingOrErrorPage title={LoadingMessage} error={error} loading={loading}/>
    }

    const services = get(data, 'objs', [])
    const connectedServices = services.filter(service => service.connected)
    const unconnectedServices = services.filter(service => !service.connected)

    const isAnyServiceConnected = Boolean(connectedServices.length)

    return (
        <>
            <PageHeader title={<Typography.Title>{PageTitle}</Typography.Title>} spaced/>
            <Row gutter={[0, 60]} style={PAGE_CONTENT_STYLES}>
                {
                    isAnyServiceConnected &&
                    <Col span={24}>
                        <Section title={AlreadyConnectedSectionTitle}>
                            <Carousel slidesToShow={slidesToShow}>
                                {
                                    connectedServices.map(service => {
                                        const logo = service.logo || undefined
                                        const url = `/services/${service.id}?type=${service.type}`
                                        return (
                                            <AppCarouselCard
                                                key={service.name}
                                                title={service.name}
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
                <Col span={24}>
                    <Section title={AvailableSectionTitle} hideTitle={!isAnyServiceConnected}>
                        <CardsContainer cardsPerRow={servicesPerRow}>
                            {
                                unconnectedServices.map(service => {
                                    const tag = service.category
                                        ? intl.formatMessage({ id: `services.category.${service.category}` })
                                        : undefined
                                    const url = `/services/${service.id}/about?type=${service.type}`
                                    const logo = service.logo || undefined
                                    return (
                                        <AppSelectCard
                                            key={service.name}
                                            title={service.name}
                                            description={service.shortDescription}
                                            url={url}
                                            tag={tag}
                                            logoSrc={logo}
                                        />
                                    )
                                })
                            }
                        </CardsContainer>
                    </Section>
                </Col>
            </Row>
        </>
    )
}
