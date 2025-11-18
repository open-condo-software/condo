import { GetNewsSharingRecipientsQuery } from '@app/condo/gql'
import { B2BAppNewsSharingConfig, NewsItem as INewsItem } from '@app/condo/schema'
import { Col, Row } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import React, { useState, useMemo, JSX } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Card, Modal, Typography, Markdown } from '@open-condo/ui'

import styles from './NewsItemCard.module.css'
import { MemoizedRecipientCounter, MemoizedNewsSharingRecipientCounter, Counter } from './RecipientCounter'

import type { NewsItemScopeNoInstanceType } from './types'


type NewsItemCardProps = {
    icon: string
    appName: string
    title: string
    body: string
    validBefore: Dayjs
    type: INewsItem['type'] | string
    footer?: JSX.Element
}

const NewsItemCard: React.FC<NewsItemCardProps> = ({
    icon,
    appName,
    title,
    body,
    type,
    validBefore,
    footer,
}) => {
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
                    <div className={styles.newsItemCardMarkdown}>
                        <Typography.Text strong type='secondary'>{BodyLabel}</Typography.Text><br/>
                        <Typography.Paragraph type='secondary'>
                            <Markdown type='inline'>{body}</Markdown>
                        </Typography.Paragraph>
                    </div>
                    {
                        footer && (
                            <Col span={24} className={styles.newsItemCardModalFooter}>
                                {footer}
                            </Col>
                        )
                    }
                </Row>
            </Modal>
            <Card
                title={(
                    <>
                        <img src={icon} className={styles.newsItemCardIcon} alt='App icon'/>
                        <Typography.Title level={3}>{appName}</Typography.Title>
                    </>
                )}
                className={styles.newsItemCard}
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
                    <Col span={24}>
                        <Typography.Text strong type='secondary'>{TitleLabel}</Typography.Text><br/>
                        <Typography.Paragraph type='secondary'>{title}</Typography.Paragraph>
                    </Col>
                    <Col span={24} className={styles.newsItemCardMarkdown}>
                        <Typography.Text strong type='secondary'>{BodyLabel}</Typography.Text><br/>
                        <Typography.Paragraph
                            ellipsis={{
                                rows: 4,
                                symbol: <><br/><Typography.Text strong type='secondary'>{ShowMoreLabel}</Typography.Text></>,
                                onEllipsis: (ellipsis: boolean) => setIsEllipsis(ellipsis),
                            }}
                            type='secondary'
                        >
                            <Markdown type='inline'>{body}</Markdown>
                        </Typography.Paragraph>
                    </Col>
                    {
                        isEllipsis && (
                            <Col>
                                <Typography.Text underline type='secondary' onClick={() => setExpanded(!expanded)}>{ShowMoreLabel}</Typography.Text>
                            </Col>
                        )
                    }
                    {
                        footer && (
                            <Col span={24} className={styles.newsItemCardFooter}>
                                {footer}
                            </Col>
                        )
                    }
                </Row>
            </Card>
        </>
    )
}

type BaseNewsItemCardProps = Omit<NewsItemCardProps, 'footer'> & {
    newsItemScopesNoInstance: Array<NewsItemScopeNoInstanceType>
}

export const CondoNewsItemCard: React.FC<BaseNewsItemCardProps> = ({
    newsItemScopesNoInstance,
    ...defaultProps
}) => {
    return (
        <NewsItemCard
            {...defaultProps}
            footer={(
                <MemoizedRecipientCounter
                    newsItemScopes={newsItemScopesNoInstance}
                    withTitle={false}
                    withCardWrapper={false}
                />
            )}
        />
    )
}

type SharingNewsItemCardProps = Omit<NewsItemCardProps, 'footer'> & {
    newsItemScopesNoInstance: Array<NewsItemScopeNoInstanceType>
    newsSharingConfig: B2BAppNewsSharingConfig
    newsSharingScope: GetNewsSharingRecipientsQuery['recipients']
    sharingAppId: string
}

export const SharingNewsItemCard: React.FC<SharingNewsItemCardProps> = ({
    newsItemScopesNoInstance,
    newsSharingConfig,
    newsSharingScope,
    sharingAppId,
    ...defaultProps
}) => {
    const intl = useIntl()
    const ChannelsLabel = intl.formatMessage({ id: 'pages.condo.news.steps.channels' })
    const SubscribersLabel = intl.formatMessage({ id: 'pages.condo.news.steps.subscribers' })

    const parsedNewsSharingScope = useMemo(() => {
        return newsSharingScope?.map(scope =>
            typeof scope === 'string' ? JSON.parse(scope)?.value : scope) || []
    }, [newsSharingScope])
    const filteredNewsSharingScope = useMemo(() => {
        return parsedNewsSharingScope?.filter(scope=> !!scope.id)
    }, [parsedNewsSharingScope])
    const receiversCount = useMemo(() => {
        return filteredNewsSharingScope.reduce((acc, scope) => {
            const count = Number(scope?.receiversCount) || 0
            return acc + count
        }, 0) || 0
    }, [filteredNewsSharingScope])

    const statistics = useMemo(() => {
        if (newsSharingConfig?.getRecipientsCountersUrl) {
            return (
                <MemoizedNewsSharingRecipientCounter
                    contextId={sharingAppId}
                    newsItemScopes={newsItemScopesNoInstance}
                    withTitle={false}
                    withCardWrapper={false}
                />
            )
        }

        return (
            <Row align='top' justify='space-evenly' gutter={[16, 16]}>
                <Col>
                    <Counter
                        label={ChannelsLabel}
                        value={filteredNewsSharingScope?.length}
                    />
                </Col>
                <Col>
                    <Counter
                        label={SubscribersLabel}
                        value={receiversCount}
                    />
                </Col>
            </Row>
        )
    }, [ChannelsLabel, SubscribersLabel, filteredNewsSharingScope?.length, newsItemScopesNoInstance, newsSharingConfig?.getRecipientsCountersUrl, receiversCount, sharingAppId])

    return (
        <NewsItemCard
            {...defaultProps}
            footer={statistics}
        />
    )
}


