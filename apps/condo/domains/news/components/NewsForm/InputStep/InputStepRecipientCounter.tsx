import { GetNewsSharingRecipientsQuery } from '@app/condo/gql'
import { B2BAppNewsSharingConfig } from '@app/condo/schema'
import { Col } from 'antd'
import React, { useMemo } from 'react'

import { Card, Space } from '@open-condo/ui'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { HiddenBlock } from '@condo/domains/news/components/NewsForm/BaseNewsForm'
import { Counter, MemoizedNewsSharingRecipientCounter, MemoizedRecipientCounter } from '@condo/domains/news/components/RecipientCounter'
import { NewsItemScopeNoInstanceType } from '@condo/domains/news/components/types'


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
    const { breakpoints } = useLayoutContext()

    const isMediumWindow = !breakpoints.DESKTOP_SMALL
    const formFieldsColSpan = isMediumWindow ? 24 : 14
    const formInfoColSpan = 24 - formFieldsColSpan

    const receiversCount = newsSharingScope?.reduce((acc, el) => {
        const count = Number(el?.receiversCount) || 0
        return acc + count
    }, 0) || 0

    const newsSharingRecipientCounter = useMemo(() => <>{isSharingStep && (
        newsSharingConfig?.getRecipientsCountersUrl ? (
            <MemoizedNewsSharingRecipientCounter
                contextId={sharingAppId}
                newsItemScopes={newsItemScopesNoInstance}
            /> ) :
            <HiddenBlock hide={!newsSharingScope?.length} className='custom-counter' >
                <Card title={<Card.CardHeader headingTitle='Статистика' />}>
                    <Space direction='horizontal' size={24}  className='custom-counter-content'>
                        <Counter label='Каналов и чатов' value={newsSharingScope?.length}/>

                        <Counter label='Всего подписчкиов' value={receiversCount}/>
                    </Space>
                </Card>
            </HiddenBlock>
    )}</>, [isSharingStep, newsSharingConfig?.getRecipientsCountersUrl, sharingAppId, newsItemScopesNoInstance, newsSharingScope?.length, receiversCount])

    return (
        <Col span={formInfoColSpan} className='recipient-counter'>
            {isSharingStep ? newsSharingRecipientCounter : (
                <HiddenBlock hide={newsItemScopesNoInstance.length <= 0}>
                    <MemoizedRecipientCounter newsItemScopes={newsItemScopesNoInstance}/>
                </HiddenBlock>
            )}
        </Col>
    )
}