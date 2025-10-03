import { NewsItem as INewsItem } from '@app/condo/schema'
import { Col, Row } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import React, { useState, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Card, Modal, Typography } from '@open-condo/ui'


type NewsItemCardProps = {
    icon: string
    appName: string
    title: string
    body: string
    validBefore: Dayjs
    type: INewsItem['type'] | string
}

export const NewsItemCard: React.FC<NewsItemCardProps> = ({ icon, appName, title, body, type, validBefore }) => {
    const intl = useIntl()
    const TitleLabel = intl.formatMessage({ id: 'pages.condo.news.steps.review.newsItemCard.titleLabel' })
    const BodyLabel = intl.formatMessage({ id: 'pages.condo.news.steps.review.newsItemCard.bodyLabel' })
    const TypeLabel = intl.formatMessage({ id: 'pages.condo.news.steps.review.newsItemCard.typeLabel' })
    const ValidBeforeLabel = intl.formatMessage({ id: 'pages.condo.news.steps.review.newsItemCard.validBeforeLabel' })
    const ShowMoreLabel = intl.formatMessage({ id: 'pages.condo.news.steps.review.newsItemCard.showMoreLabel' })
    const CommonTypeLabel = intl.formatMessage({ id: 'pages.news.newsItemCard.type.common' })
    const EmergencyTypeLabel = intl.formatMessage({ id: 'pages.news.newsItemCard.type.emergency' })

    const typeTranslation = useMemo(() => {
        if (type === 'emergency') return EmergencyTypeLabel
        return CommonTypeLabel
    }, [type, EmergencyTypeLabel, CommonTypeLabel])

    const validBeforeFormatted = useMemo(() => {
        if (!validBefore || !dayjs(validBefore).isValid()) {
            return '—'
        }
        return dayjs(validBefore).format('DD.MM.YYYY')
    }, [validBefore])

    const [isEllipsis, setIsEllipsis] = useState(false)
    const [expanded, setExpanded] = useState(false)

    return (
        <>
            <Modal
                open={expanded}
                onCancel={() => setExpanded(false)}
                title={appName}
            >
                <Row gutter={[0, 16]}>
                    <Col span={12}>
                        <Typography.Text strong type='secondary'>{TypeLabel}</Typography.Text><br/>
                        <Typography.Paragraph type='secondary'>{typeTranslation}</Typography.Paragraph>
                    </Col>
                    <Col span={12}>
                        <Typography.Text strong type='secondary'>{ValidBeforeLabel}</Typography.Text><br/>
                        <Typography.Paragraph type='secondary'>{validBeforeFormatted}</Typography.Paragraph>
                    </Col>
                    <div>
                        <Typography.Text strong type='secondary'>{TitleLabel}</Typography.Text><br/>
                        <Typography.Paragraph type='secondary'>{title}</Typography.Paragraph>
                    </div>
                    <div>
                        <Typography.Text strong type='secondary'>{BodyLabel}</Typography.Text><br/>
                        <Typography.Paragraph type='secondary'>{body}</Typography.Paragraph>
                    </div>
                </Row>
            </Modal>
            <div style={{ 'maxWidth': 500, height: '100%' }}>
                <Card
                    title={(
                        <>
                            <img src={icon} style={{ marginBottom: '5px', width: '24px', height: '24px' }}  alt='App icon'/>
                            <Typography.Title level={3}>{appName}</Typography.Title>
                        </>
                    )}
                >
                    <>
                        <Row gutter={[0, 16]}>
                            <Col span={12}>
                                <Typography.Text strong type='secondary'>{TypeLabel}</Typography.Text><br/>
                                <Typography.Paragraph type='secondary'>{typeTranslation}</Typography.Paragraph>
                            </Col>
                            <Col span={12}>
                                <Typography.Text strong type='secondary'>{ValidBeforeLabel}</Typography.Text><br/>
                                <Typography.Paragraph type='secondary'>{validBeforeFormatted}</Typography.Paragraph>
                            </Col>
                            <Col span={24}>
                                <Typography.Text strong type='secondary'>{TitleLabel}</Typography.Text><br/>
                                <Typography.Paragraph type='secondary'>{title}</Typography.Paragraph>
                            </Col>
                            <Col span={24}>
                                <Typography.Text strong type='secondary'>{BodyLabel}</Typography.Text><br/>
                                <Typography.Paragraph
                                    ellipsis={{
                                        rows: 4,
                                        symbol: <><br/><Typography.Text strong type='secondary'>{ShowMoreLabel}</Typography.Text></>,
                                        onEllipsis: (ellipsis: boolean) => setIsEllipsis(ellipsis),
                                    }}
                                    type='secondary'
                                >
                                    {body}
                                </Typography.Paragraph>
                            </Col>
                            {
                                isEllipsis && (
                                    <Typography.Text underline type='secondary' onClick={() => setExpanded(!expanded)}>{ShowMoreLabel}</Typography.Text>
                                )
                            }
                        </Row>
                    </>
                </Card>
            </div>
        </>
    )
}
