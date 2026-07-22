import get from 'lodash/get'
import React from 'react'


import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Space, Typography, Button } from '@open-condo/ui'

import { EmptyListContent } from '@condo/domains/common/components/EmptyListContent'
import { B2BAppFrame } from '@condo/domains/miniapp/components/B2BAppFrame'

import { useBillingAndAcquiringContexts } from './ContextProvider'


const BLOCK_CONTENT_GAP = 16
const ERROR_MASCOT_IMG = '/mascot/fail.webp'
const SEARCHING_MASCOT_IMG = '/mascot/searching.webp'

type EmptyContentProps = {
    uploadComponent?: React.ReactElement
}

export const EmptyContent: React.FC<EmptyContentProps> = ({
    uploadComponent,
}) => {
    const intl = useIntl()
    const NoReceiptsTitle = intl.formatMessage({ id: 'accrualsAndPayments.billing.noReceiptsYet' })
    const InstructionButtonLabel = intl.formatMessage({ id: 'accrualsAndPayments.setupBilling.instruction.instructionButtonLabel' })

    const userOrganization = useOrganization()
    const canImportBillingReceipts = get(userOrganization, ['link', 'role', 'canImportBillingReceipts'], false)

    const { billingContexts } = useBillingAndAcquiringContexts()
    const [billingContext] = billingContexts
    const currentProblem = get(billingContexts.find(({ currentProblem }) => !!currentProblem), 'currentProblem')
    const connectedMessage = get(billingContext, ['integration', 'connectedMessage'])
    const connectedUrl = get(billingContext, ['integration', 'connectedUrl'])
    const instructionUrl = get(billingContext, ['integration', 'instructionExtraLink'])

    const title = currentProblem ? get(currentProblem, 'title', '') : NoReceiptsTitle
    const message = currentProblem ? get(currentProblem, 'message', '') : connectedMessage
    const mascotImg = currentProblem ? ERROR_MASCOT_IMG : SEARCHING_MASCOT_IMG

    if (connectedUrl && !connectedMessage) {
        return <B2BAppFrame src={connectedUrl} initialHeight={400}/>
    }
    return (
        <EmptyListContent
            image={mascotImg}
            label={title}
            message={
                <Space size={BLOCK_CONTENT_GAP} direction='vertical' align='center'>
                    {Boolean(message) && (
                        <Typography.Text type='secondary'>{message}</Typography.Text>
                    )}
                    {Boolean(canImportBillingReceipts && (instructionUrl || uploadComponent)) && (
                        <Space size={BLOCK_CONTENT_GAP} direction='vertical' align='center'>
                            {uploadComponent}
                            {Boolean(instructionUrl) && (
                                <Button type='secondary' target='_blank' onClick={() => window.open(instructionUrl)}>
                                    {InstructionButtonLabel}
                                </Button>
                            )}
                        </Space>
                    )}
                </Space>
            }
        />
    )
}
