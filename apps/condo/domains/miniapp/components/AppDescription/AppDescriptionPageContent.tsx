import React from 'react'
import { Col, Row, Typography } from 'antd'
import { TopCard } from './TopCard'
import { AboutCard, AboutBlockProps } from './AboutCard'
import { useIntl } from '@core/next/intl'
import { MarkDown } from '@condo/domains/common/components/MarkDown'

interface AppDescriptionPageContentProps {
    title: string,
    description: string,
    published: string,
    logoSrc?: string,
    tag?: string,
    developer: string,
    partnerUrl?: string,
    descriptionBlocks?: Array<AboutBlockProps>
}

export const AppDescriptionPageContent: React.FC<AppDescriptionPageContentProps> = ({
    title,
    description,
    published,
    logoSrc,
    tag,
    developer,
    partnerUrl,
    descriptionBlocks,
}) => {
    const intl = useIntl()
    const HowToSetupMessage = intl.formatMessage({ id: 'services.HowToSetup' })
    return (
        <Row gutter={[0, 60]}>
            <Col span={24}>
                <TopCard
                    title={title}
                    description={description}
                    published={published}
                    developer={developer}
                    partnerUrl={partnerUrl}
                    logoSrc={logoSrc}
                    tag={tag}
                />
            </Col>
            <Col span={24}>
                <Row gutter={[0, 40]}>
                    <Col span={24}>
                        <Typography.Title level={4}>
                            {HowToSetupMessage}
                        </Typography.Title>
                    </Col>
                    <Col span={24}>
                        <MarkDown text={'markdown'}/>
                    </Col>
                </Row>
            </Col>
            {
                descriptionBlocks && Boolean(descriptionBlocks.length) && (
                    <Col span={24}>
                        <AboutCard
                            blocks={descriptionBlocks}
                        />
                    </Col>
                )
            }
        </Row>
    )
}