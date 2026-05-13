import get from 'lodash/get'
import React, { CSSProperties } from 'react'


import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Space, Typography, Button } from '@open-condo/ui'

import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { IFrame } from '@condo/domains/miniapp/components/IFrame'

import { useBillingAndAcquiringContexts } from './ContextProvider'


const BLOCK_GAP = 24
const BLOCK_CONTENT_GAP = 16
const ERROR_MASCOT_IMG = '/mascot/fail.webp'
const SEARCHING_MASCOT_IMG = '/mascot/searching.webp'
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
        return <IFrame src={connectedUrl} reloadScope='organization' withPrefetch withLoader withResize initialHeight={400}/>
    }

    return (
        <BasicEmptyListView spaceSize={BLOCK_GAP} image={mascotImg} imageStyle={IMG_STYLES}>
            <Space size={BLOCK_CONTENT_GAP} direction='vertical' align='center'>
                <Typography.Title level={3}>{title}</Typography.Title>
                {Boolean(message) && (
                    <Typography.Text type='secondary'>{message}</Typography.Text>
                )}
            </Space>
            {Boolean(canImportBillingReceipts && (instructionUrl || uploadComponent)) && (
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
