import React from 'react'
import { Typography, Row, Col } from 'antd'
import { useIntl } from '@core/next/intl'
import { PageHeader } from '@condo/domains/common/components/containers/BaseLayout'
import Carousel from '@condo/domains/common/components/Carousel'
import { Section } from './Section'
import { CardsContainer } from './CardsContainer'
import { ServiceSelectCard } from './ServiceSelectCard'
import { ServiceCarouselCard } from './ServiceCarouselCard'

export const ServiceSelectPageContent: React.FC = () => {
    // TODO(2420): Add employee rights check
    // TODO(2420): Add select queries

    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'menu.Services' })
    const AlreadyConnectedSectionTitle = intl.formatMessage({ id: 'services.AlreadyConnected' })
    const AvailableSectionTitle = intl.formatMessage({ id: 'services.Available' })

    // TODO(2420): Add logic
    const isAnyServiceConnected = true


    // TODO(remove)
    const contentStyle = {
        height: 160,
        margin: 0,
    }

    return (
        <>
            <PageHeader title={<Typography.Title>{PageTitle}</Typography.Title>} spaced/>
            <Row gutter={[0, 60]}>
                {
                    isAnyServiceConnected &&
                    <Col span={24}>
                        <Section title={AlreadyConnectedSectionTitle}>
                            <Carousel>
                                {/*<ServiceCarouselCard logoSrc={'https://logo.clearbit.com/shopify.com'}>*/}

                                {/*</ServiceCarouselCard>*/}
                                <h3 style={contentStyle}>1</h3>
                                <h3 style={contentStyle}>2</h3>
                                <h3 style={contentStyle}>3</h3>
                                <h3 style={contentStyle}>4</h3>
                                <h3 style={contentStyle}>5</h3>
                                <h3 style={contentStyle}>6</h3>
                            </Carousel>
                        </Section>
                    </Col>
                }
                <Col span={24}>
                    <Section title={AvailableSectionTitle} hideTitle={!isAnyServiceConnected}>
                        <CardsContainer>
                            <ServiceSelectCard/>
                            <div>2<br/>2.2</div>
                            <div>3</div>
                            <div>4</div>
                            <div>5</div>
                            <div>6</div>
                            <div>7</div>
                            <div>8</div>
                        </CardsContainer>
                    </Section>
                </Col>
            </Row>
        </>
    )
}
