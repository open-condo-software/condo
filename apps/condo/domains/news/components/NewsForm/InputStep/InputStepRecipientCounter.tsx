import { B2BAppNewsSharingConfig } from '@app/condo/schema'
import { Col, Row } from 'antd'
import React, { useMemo } from 'react'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'

import { MemoizedNewsSharingRecipientCounter, MemoizedRecipientCounter } from '../../RecipientCounter'
import { NewsItemScopeNoInstanceType } from '../../types'
import { HiddenBlock } from '../BaseNewsForm'


interface InputStepRecipientCounterProps {
    newsSharingConfig: B2BAppNewsSharingConfig
    isSharing: boolean
    ctxId: string
    newsItemScopesNoInstance: NewsItemScopeNoInstanceType[]
}

export const InputStepRecipientCounter: React.FC<InputStepRecipientCounterProps> = ({
    newsSharingConfig,
    isSharing,
    ctxId,
    newsItemScopesNoInstance,
}) => {
    const { breakpoints } = useLayoutContext()
    const isCustomRecipientCounter = !!newsSharingConfig?.getRecipientsCountersUrl && isSharing

    const isMediumWindow = !breakpoints.DESKTOP_SMALL
    const formFieldsColSpan = isMediumWindow ? 24 : 14
    const formInfoColSpan = 24 - formFieldsColSpan

    const newsSharingRecipientCounter = useMemo(() => <>{newsSharingConfig?.getRecipientsCountersUrl && (
        <MemoizedNewsSharingRecipientCounter
            contextId={ctxId}
            newsItemScopes={newsItemScopesNoInstance}
        />
    )}</>, [newsSharingConfig])

    return (
        <Col span={formInfoColSpan}>
            <Row>
                {isCustomRecipientCounter ? newsSharingRecipientCounter : (
                    <HiddenBlock hide={newsItemScopesNoInstance.length <= 0}>
                        <MemoizedRecipientCounter newsItemScopes={newsItemScopesNoInstance}/>
                    </HiddenBlock>
                )}
            </Row>
        </Col>
    )
}