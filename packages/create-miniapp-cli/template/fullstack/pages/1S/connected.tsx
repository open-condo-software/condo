import getConfig from 'next/config'
import React, { CSSProperties, useMemo, useCallback } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Space, Typography } from '@open-condo/ui'

import { EmptyView } from '@billing-connector/domains/common/components/containers/EmptyView'
import Loader from '@billing-connector/domains/common/components/Loader'
import { useLaunchParams } from '@billing-connector/domains/common/hooks/useLaunchParams'
import { BillingContext } from '@billing-connector/domains/condo/utils/clientSchema'
import { SETUP_1S_INTEGRATION_MUTATION } from '@billing-connector/domains/selfservice/gql'
import { useIntegrationSetup } from '@billing-connector/domains/selfservice/hooks/useIntegrationSetup'
import { downloadBase64Content } from '@billing-connector/domains/selfservice/utils/clientSchema'

const { publicRuntimeConfig: { integrationConfig, helpRequisites } } = getConfig()

const BLOCK_GAP = 24
const BLOCK_CONTENT_GAP = 16
const ERROR_DINO_IMG = '/dino/fail@2x.png'
const SEARCHING_DINO_IMG = '/dino/searching@2x.png'
const IMG_STYLES: CSSProperties = { marginBottom: 24 }

const ConnectedPage = () => {
    const intl = useIntl()
    const WaitingForReceiptTitle = intl.formatMessage({ id: '1S.setup.completed.waitingForReceipts.Title' })
    const WaitingForReceiptText = intl.formatMessage({ id: '1S.setup.completed.waitingForReceipts.Text' })
    const WillContactYouSoonTitle = intl.formatMessage({ id: '1S.setup.assistedSetup.connected.Title' })
    const InstructionText = intl.formatMessage({ id: '1S.setup.selfSetup.connected.instruction.Text' })
    const WillContactYouSoonText = intl.formatMessage({ id: '1S.setup.assistedSetup.connected.Text' })
    const SupportChatText = intl.formatMessage({ id: '1S.setup.selfSetup.HelpOffer.support' })

    const { context: launchContext, loading: launchParamsAreLoading } = useLaunchParams()
    const organizationId = useMemo(() => launchContext?.condoContextEntityId || null, [launchContext])
    const integrationId = integrationConfig?.id

    const setupIntegration = useIntegrationSetup({ mutation: SETUP_1S_INTEGRATION_MUTATION, organizationId })

    const handleDownloadInstruction = useCallback( async  () => {
        const instruction = await setupIntegration()
        await downloadBase64Content(instruction)
    }, [setupIntegration])

    const SelfSetupTitle = useMemo(() => intl.formatMessage({ id: '1S.setup.selfSetup.connected.Title' }, {
        instructionLink:
            <Typography.Link style={{ fontWeight: 600 }} onClick={handleDownloadInstruction}>
                {InstructionText}
            </Typography.Link>,
    }), [InstructionText, handleDownloadInstruction, intl])

    const HelpOfferText = useMemo(() => intl.formatMessage({ id: '1S.setup.selfSetup.HelpOffer' }, {
        supportChat:
            <Typography.Link href={helpRequisites?.support_bot ? `https://t.me/${helpRequisites.support_bot}` : '#'} target='_blank'>
                {SupportChatText}
            </Typography.Link>,
    }), [SupportChatText, intl])

    const {
        obj: billingContext,
        loading: billingContextLoading,
    } = BillingContext.useObject(
        { where: { organization: { id: organizationId }, integration: { id: integrationId } } },
        { skip: !organizationId || !integrationId },
    )


    const isAssistedSetup = useMemo(() => billingContext?.settings?.isAssistedSetup, [billingContext])
    const isSetupCompleted = useMemo(() => billingContext?.settings?.isSetupCompleted, [billingContext])

    const getTitleAndMessage = useCallback((isSetupCompleted, isAssistedSetup) => {
        if (isAssistedSetup) {
            if (isSetupCompleted) return { title: WaitingForReceiptTitle, message: WaitingForReceiptText }

            return { title: WillContactYouSoonTitle, message: WillContactYouSoonText }
        }

        return { title: SelfSetupTitle, message: HelpOfferText }
    }, [HelpOfferText, SelfSetupTitle, WaitingForReceiptText, WaitingForReceiptTitle, WillContactYouSoonText, WillContactYouSoonTitle])

    const { title: determinedTitle, message: determinedMessage } = getTitleAndMessage(isSetupCompleted, isAssistedSetup)

    const currentProblem = billingContext?.currentProblem
    const title = currentProblem?.title || determinedTitle
    const message = currentProblem?.message || determinedMessage
    const dinoImg = currentProblem ? ERROR_DINO_IMG : SEARCHING_DINO_IMG

    const isLoading = launchParamsAreLoading || billingContextLoading || !billingContext
    if (launchParamsAreLoading || billingContextLoading || !billingContext) {
        return <Loader loading={isLoading} size='large' />
    }

    return (
        <EmptyView spaceSize={BLOCK_GAP} image={dinoImg} imageStyle={IMG_STYLES}>
            <Space size={BLOCK_CONTENT_GAP} direction='vertical' align='center'>
                <Typography.Title level={3}>{title}</Typography.Title>
                {Boolean(message) && (
                    <Typography.Text type='secondary'>{message}</Typography.Text>
                )}
            </Space>
        </EmptyView>
    )
}

export default ConnectedPage