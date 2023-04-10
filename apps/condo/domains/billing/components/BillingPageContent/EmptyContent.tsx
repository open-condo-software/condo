import get from 'lodash/get'
import React, { CSSProperties } from 'react'


import { useIntl } from '@open-condo/next/intl'
import { Space, Typography, Button } from '@open-condo/ui'

import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'

import type { BillingIntegrationProblem } from '@app/condo/schema'

const BLOCK_GAP = 24
const BLOCK_CONTENT_GAP = 16
const ERROR_DINO_IMG = 'dino/fail@2x.png'
const SUCCESS_DINO_IMG = 'dino/searching@2x.png'
const IMG_STYLES: CSSProperties = { marginBottom: 24 }

type EmptyContentProps = {
    connectedMessage?: string
    uploadComponent?: React.ReactElement
    instructionUrl?: string
    problem?: Pick<BillingIntegrationProblem, 'title' | 'message'>
}

export const EmptyContent: React.FC<EmptyContentProps> = ({
    problem,
    connectedMessage,
    instructionUrl,
    uploadComponent,
}) => {
    const intl = useIntl()
    const NoReceiptsTitle = intl.formatMessage({ id: 'accrualsAndPayments.billing.noReceiptsYet' })
    const InstructionButtonLabel = intl.formatMessage({ id: 'accrualsAndPayments.setupBilling.instruction.instructionButtonLabel' })

    const title = problem ? get(problem, 'title', '') : NoReceiptsTitle
    const message = problem ? get(problem, 'message', '') : connectedMessage
    const dinoImg = problem ? ERROR_DINO_IMG : SUCCESS_DINO_IMG


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
