import { B2BAppNewsSharingConfig } from '@app/condo/schema'
import { Col } from 'antd'
import React, { useMemo } from 'react'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { HiddenBlock } from '@condo/domains/news/components/NewsForm/BaseNewsForm'
import { MemoizedNewsSharingRecipientCounter, MemoizedRecipientCounter } from '@condo/domains/news/components/RecipientCounter'
import { NewsItemScopeNoInstanceType } from '@condo/domains/news/components/types'

interface InputStepRecipientCounterProps {
    newsSharingConfig: B2BAppNewsSharingConfig
    isSharingStep: boolean
    sharingAppId: string
    newsItemScopesNoInstance: Array<NewsItemScopeNoInstanceType>
}

export const InputStepRecipientCounter: React.FC<InputStepRecipientCounterProps> = ({
    newsSharingConfig,
    isSharingStep,
    sharingAppId,
    newsItemScopesNoInstance,
}) => {
    const { breakpoints } = useLayoutContext()

    const isMediumWindow = !breakpoints.DESKTOP_SMALL
    const formFieldsColSpan = isMediumWindow ? 24 : 14
    const formInfoColSpan = 24 - formFieldsColSpan

    const newsSharingRecipientCounter = useMemo(() => <>{isSharingStep && (
        // TODO: (DOMA-11416) create RecipientCounter for no custom CountersUrl
        newsSharingConfig?.getRecipientsCountersUrl ? (
            <MemoizedNewsSharingRecipientCounter
                contextId={sharingAppId}
                newsItemScopes={newsItemScopesNoInstance}
            /> ) : null
    )}</>, [newsSharingConfig, sharingAppId, newsItemScopesNoInstance])

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