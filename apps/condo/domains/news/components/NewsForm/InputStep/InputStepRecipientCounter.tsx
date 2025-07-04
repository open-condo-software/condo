import { GetNewsSharingRecipientsQuery } from '@app/condo/gql'
import { B2BAppNewsSharingConfig } from '@app/condo/schema'
import { Col } from 'antd'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Card, Space } from '@open-condo/ui'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { HiddenBlock } from '@condo/domains/news/components/NewsForm/BaseNewsForm'
import { Counter, MemoizedNewsSharingRecipientCounter, MemoizedRecipientCounter } from '@condo/domains/news/components/RecipientCounter'
import { NewsItemScopeNoInstanceType } from '@condo/domains/news/components/types'

import styles from './InputStepRecipientCounter.module.css'


interface InputStepRecipientCounterProps {
    newsSharingConfig: B2BAppNewsSharingConfig
    isSharingStep: boolean
    sharingAppId: string
    newsItemScopesNoInstance: Array<NewsItemScopeNoInstanceType>
    newsSharingScope: GetNewsSharingRecipientsQuery['recipients']
}

export const InputStepRecipientCounter: React.FC<InputStepRecipientCounterProps> = ({
    newsSharingConfig,
    isSharingStep,
    sharingAppId,
    newsItemScopesNoInstance,
    newsSharingScope,
}) => {
    const intl = useIntl()
    const StatisticsTitle = intl.formatMessage({ id: 'pages.condo.news.steps.statistics' })
    const SubscribersLabel = intl.formatMessage({ id: 'pages.condo.news.steps.subscribers' })
    const ChannelsLabel = intl.formatMessage({ id: 'pages.condo.news.steps.channels' })

    const { breakpoints } = useLayoutContext()

    const isMediumWindow = !breakpoints.DESKTOP_SMALL
    const formFieldsColSpan = isMediumWindow ? 24 : 14
    const formInfoColSpan = 24 - formFieldsColSpan

    const parsedNewsSharingScope = useMemo(()=>newsSharingScope?.map(scope =>
        typeof scope === 'string' ? JSON.parse(scope)?.value : scope) || [],
    [newsSharingScope]
    )
    const filteredNewsSharingScope = useMemo(()=>
        parsedNewsSharingScope?.filter(scope=> !!scope.id),
    [parsedNewsSharingScope]
    )
    const receiversCount = useMemo(()=> filteredNewsSharingScope.reduce((acc, scope) => {
        const count = Number(scope?.receiversCount) || 0
        return acc + count
    }, 0) || 0, [filteredNewsSharingScope])

    const newsSharingRecipientCounter = useMemo(() => <>{isSharingStep && (
        newsSharingConfig?.getRecipientsCountersUrl ? (
            <MemoizedNewsSharingRecipientCounter
                contextId={sharingAppId}
                newsItemScopes={newsItemScopesNoInstance}
            /> ) :
            <HiddenBlock hide={!filteredNewsSharingScope?.length} className={styles.customCounter} >
                <Card title={<Card.CardHeader headingTitle={StatisticsTitle} />}>
                    <Space direction='horizontal' size={24}  className={styles.customCounterContent}>
                        <Counter
                            label={ChannelsLabel}
                            value={filteredNewsSharingScope?.length}
                        />
                        <Counter
                            label={SubscribersLabel}
                            value={receiversCount}
                        />
                    </Space>
                </Card>
            </HiddenBlock>
    )}</>, [isSharingStep, newsSharingConfig?.getRecipientsCountersUrl, sharingAppId, newsItemScopesNoInstance,
        filteredNewsSharingScope, StatisticsTitle, ChannelsLabel, SubscribersLabel, receiversCount]
    )

    return (
        <Col span={formInfoColSpan} className={styles.recipientCounter}>
            {isSharingStep ? newsSharingRecipientCounter : (
                <HiddenBlock hide={newsItemScopesNoInstance.length <= 0}>
                    <MemoizedRecipientCounter newsItemScopes={newsItemScopesNoInstance}/>
                </HiddenBlock>
            )}
        </Col>
    )
}