import React, { useCallback } from 'react'
import { Col, Row, Typography } from 'antd'
import { TopCard } from './TopCard'
import { AboutCard, AboutBlockProps } from './AboutCard'
import { useIntl } from '@core/next/intl'
import { MarkDown } from '@condo/domains/common/components/MarkDown'
import { Button } from '@condo/domains/common/components/Button'
import { useRouter } from 'next/router'

interface AppDescriptionPageContentProps {
    title: string,
    description: string,
    published: string,
    logoSrc?: string,
    tag?: string,
    developer: string,
    partnerUrl?: string,
    descriptionBlocks?: Array<AboutBlockProps>,
    instruction?: string,
    appUrl?: string,
    disabledConnect?: boolean,
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
    instruction,
    appUrl,
    children,
    disabledConnect,
}) => {
    const intl = useIntl()
    const HowToSetupMessage = intl.formatMessage({ id: 'services.HowToSetup' })
    const SetupMessage = intl.formatMessage({ id: 'services.SetupService' })
    const DefaultInstructionMessage = intl.formatMessage({ id: 'services.instruction.default' })

    const router = useRouter()
    const { query: { id, type } } = router

    const handleButtonClick = useCallback(() => {
        router.push(`/services/${id}?type=${type}`)
    }, [router, id, type])

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
                    {
                        React.Children.map(children, child => {
                            if (!child) return null
                            return (
                                <Col span={24}>
                                    {child}
                                </Col>
                            )
                        })
                    }
                    {
                        instruction && (
                            <Col span={24}>
                                <MarkDown text={instruction}/>
                            </Col>
                        )
                    }
                    {
                        Boolean(!instruction && appUrl) && (
                            <Col span={24}>
                                <Typography.Text type={'secondary'}>
                                    {DefaultInstructionMessage}
                                </Typography.Text>
                            </Col>
                        )
                    }
                    {
                        appUrl && (
                            <Col span={24}>
                                <Button
                                    type={'sberDefaultGradient'}
                                    onClick={handleButtonClick}
                                    disabled={disabledConnect}
                                >
                                    {SetupMessage}
                                </Button>
                            </Col>
                        )
                    }
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