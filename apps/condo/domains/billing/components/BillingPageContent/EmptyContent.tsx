import get from 'lodash/get'
import React, { CSSProperties } from 'react'


import { useIntl } from '@open-condo/next/intl'
import { Space, Typography, Button } from '@open-condo/ui'

import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'

import { useBillingAndAcquiringContexts } from './ContextProvider'

const BLOCK_GAP = 24
const BLOCK_CONTENT_GAP = 16
const ERROR_DINO_IMG = 'dino/fail@2x.png'
const SEARCHING_DINO_IMG = 'dino/searching@2x.png'
const IMG_STYLES: CSSProperties = { marginBottom: 24 }

type EmptyContentProps = {
    uploadComponent?: React.ReactElement
}

export const EmptyContent: React.FC<EmptyContentProps> = ({
    uploadComponent,
}) => {
    const intl = useIntl()
    const NoReceiptsTitle = intl.formatMessage({ id: 'accrualsAndPayments.billing.noReceiptsYet' })
    const InstructionButtonLabel = intl.formatMessage({ id: 'accrualsAndPayments.setupBilling.instruction.instructionButtonLabel' })

    const { billingContext } = useBillingAndAcquiringContexts()

    const currentProblem = get(billingContext, 'currentProblem')
    const connectedMessage = get(billingContext, ['integration', 'connectedMessage'])
    const instructionUrl = get(billingContext, ['integration', 'instructionExtraLink'])

    const title = currentProblem ? get(currentProblem, 'title', '') : NoReceiptsTitle
    const message = currentProblem ? get(currentProblem, 'message', '') : connectedMessage
    const dinoImg = currentProblem ? ERROR_DINO_IMG : SEARCHING_DINO_IMG


    return (
        <BasicEmptyListView spaceSize={BLOCK_GAP} image={dinoImg} imageStyle={IMG_STYLES}>
            <Space size={BLOCK_CONTENT_GAP} direction='vertical' align='center'>
                <Typography.Title level={3}>{title}</Typography.Title>
                {Boolean(message) && (
                    <Typography.Text type='secondary'>{message}</Typography.Text>
                )}
            </Space>
            {Boolean(instructionUrl || uploadComponent) && (
                <Space size={BLOCK_CONTENT_GAP} direction='vertical' align='center'>
                    {uploadComponent}
                    {Boolean(instructionUrl) && (
                        <Button type='secondary' target='_blank' href={instructionUrl}>
                            {InstructionButtonLabel}
                        </Button>
                    )}
                </Space>
            )}
        </BasicEmptyListView>
    )
}
