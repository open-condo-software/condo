import React, { useEffect } from 'react'
import { Col, Row, Typography } from 'antd'
import { TopCard } from './TopCard'
import { AboutCard, AboutBlockProps } from './AboutCard'
import { useIntl } from '@condo/next/intl'
import get from 'lodash/get'
import { MarkDown } from '@condo/domains/common/components/MarkDown'
import { Button } from '@condo/domains/common/components/Button'
import { useTracking, TrackingEventType } from '@condo/domains/common/components/TrackingContext'

interface AppDescriptionPageContentProps {
    title: string,
    description: string,
    published: string,
    logoSrc?: string,
    tag?: string,
    developer: string,
    partnerUrl?: string,
    aboutSections?: Array<AboutBlockProps>,
    instruction?: string,
    appUrl?: string,
    disabledConnect?: boolean,
    connectAction: () => void
    connectButtonMessage?: string,
}

export const AppDescriptionPageContent: React.FC<AppDescriptionPageContentProps> = ({
    title,
    description,
    published,
    logoSrc,
    tag,
    developer,
    partnerUrl,
    aboutSections,
    instruction,
    appUrl,
    children,
    disabledConnect,
    connectAction,
    connectButtonMessage,
}) => {
    const intl = useIntl()
    const HowToSetupMessage = intl.formatMessage({ id: 'miniapps.HowToSetup' })
    const ConnectButtonDefaultMessage = intl.formatMessage({ id: 'miniapps.ConnectApp' })
    const ConnectButtonLabel = connectButtonMessage || ConnectButtonDefaultMessage
    const DefaultInstructionMessage = intl.formatMessage({ id: 'miniapps.instruction.default' }, {
        buttonLabel: ConnectButtonLabel,
    })

    const { logEvent, eventProperties, getEventName } = useTracking()

    useEffect(() => {
        const routeChangeStart = (event: MouseEvent) => {
            const target = event.target as HTMLElement
            if (target.tagName === 'A') {
                const value = get(target, 'attributes.href.value', '')
                const title = get(target, 'textContent', '')
                const eventName = getEventName(TrackingEventType.FollowExternalLink)

                logEvent({ eventName, eventProperties: {
                    ...eventProperties,
                    link: { title, value },
                } })
            }
        }
        if (typeof window !== 'undefined') {
            document.addEventListener('click', routeChangeStart)
        }
        return () => {
            document.removeEventListener('click', routeChangeStart)
        }
    }, [])


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
                                <MarkDown text={instruction} fontSize={16} shouldParseHtml/>
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
                                    onClick={connectAction}
                                    disabled={disabledConnect}
                                >
                                    {ConnectButtonLabel}
                                </Button>
                            </Col>
                        )
                    }
                </Row>
            </Col>
            {
                aboutSections && Boolean(aboutSections.length) && (
                    <Col span={24}>
                        <AboutCard
                            sections={aboutSections}
                        />
                    </Col>
                )
            }
        </Row>
    )
}
