import { SortBillingIntegrationOrganizationContextsBy } from '@app/condo/schema'
import { Col, Row } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Markdown, Space, Button } from '@open-condo/ui'

import { BillingIntegrationOrganizationContext as BillingContext } from '@condo/domains/billing/utils/clientSchema'
import { Loader } from '@condo/domains/common/components/Loader'
import { UI_BILLING_SPP_COMBINED_PAGE } from '@condo/domains/common/constants/featureflags'
import { extractOrigin } from '@condo/domains/common/utils/url.utils'
import { B2BAppFrame } from '@condo/domains/miniapp/components/B2BAppFrame'
import { CONTEXT_FINISHED_STATUS } from '@condo/domains/miniapp/constants'


import type { RowProps } from 'antd'

const INSTRUCTION_FOOTER_GUTTER: RowProps['gutter'] = [0, 40]
const COL_FULL_SPAN = 24

type SetupInstructionBillingProps = {
    instruction: string
    instructionExtraLink?: string
    setupId: string
}

const SetupInstructionBilling: React.FC<SetupInstructionBillingProps> = ({ instruction, instructionExtraLink, setupId }) => {
    const intl = useIntl()
    const DoneButtonMessage = intl.formatMessage({ id:'accrualsAndPayments.setupBilling.instruction.doneButtonLabel' })
    const InstructionButtonMessage = intl.formatMessage({ id:'accrualsAndPayments.setupBilling.instruction.instructionButtonLabel' })

    const { useFlag } = useFeatureFlags()
    const shouldShowCombinedBilling = useFlag(UI_BILLING_SPP_COMBINED_PAGE)
    const updateBillingAction = BillingContext.useUpdate({
        status: CONTEXT_FINISHED_STATUS,
    })

    const router = useRouter()

    const handleDoneClick = useCallback(async () => {
        if (shouldShowCombinedBilling) {
            await updateBillingAction({ status: CONTEXT_FINISHED_STATUS }, { id: setupId })
        }
        await router.push({ query: { ...router.query, step: 2 } }, undefined, { shallow: true })
    }, [router, setupId, shouldShowCombinedBilling, updateBillingAction])

    return (
        <Row gutter={INSTRUCTION_FOOTER_GUTTER}>
            <Col span={COL_FULL_SPAN}>
                <Markdown children={instruction}/>
            </Col>
            <Col span={COL_FULL_SPAN}>
                <Space size={16}>
                    <Button type='primary' onClick={handleDoneClick}>
                        {DoneButtonMessage}
                    </Button>
                    {Boolean(instructionExtraLink) && (
                        <Button type='secondary'
                            href={instructionExtraLink} target='_blank'
                        >
                            {InstructionButtonMessage}
                        </Button>
                    )}
                </Space>
            </Col>
        </Row>
    )
}

type SetupInteractiveBillingProps = {
    setupUrl: string
    setupId: string
}

const SetupInteractiveBilling: React.FC<SetupInteractiveBillingProps> = ({ setupUrl, setupId }) => {
    const router = useRouter()
    const frameOrigin = useMemo(() => extractOrigin(setupUrl), [setupUrl])
    const { useFlag } = useFeatureFlags()
    const shouldShowCombinedBilling = useFlag(UI_BILLING_SPP_COMBINED_PAGE)

    const updateBillingAction = BillingContext.useUpdate({ status: CONTEXT_FINISHED_STATUS })

    const handleDoneMessage = useCallback(async (event: MessageEvent) => {
        if (event.origin === frameOrigin && get(event.data, 'success') === true) {
            if (shouldShowCombinedBilling) {
                await updateBillingAction({ status: CONTEXT_FINISHED_STATUS }, { id: setupId })
            }
            await router.push({ query: { ...router.query, step: 2 } }, undefined, { shallow: true })
        }
    }, [frameOrigin, router, setupId, shouldShowCombinedBilling, updateBillingAction])

    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.addEventListener('message', handleDoneMessage)

            return () => window.removeEventListener('message', handleDoneMessage)
        }
    }, [handleDoneMessage])
    return (
        <B2BAppFrame
            src={setupUrl}
            initialHeight={400}
            actions={true}
        />
    )
}

export const SetupBilling: React.FC = ()=> {
    const router = useRouter()
    const { organization } = useOrganization()
    const orgId = organization?.id

    const { objs: currentContexts, loading: currentCtxLoading, error: currentCtxError } = BillingContext.useObjects({
        where: { organization: { id: orgId }, deletedAt: null },
        sortBy: [ SortBillingIntegrationOrganizationContextsBy.UpdatedAtDesc, SortBillingIntegrationOrganizationContextsBy.IdDesc ],
    })
    const connectedContexts = useMemo(() => {
        return currentContexts.filter(({ status }) => status === CONTEXT_FINISHED_STATUS)
    }, [currentContexts])

    const connectedCtx = connectedContexts[0] || null
    const currentCtx = currentContexts[0] || null
    const connectedContextId = get(connectedCtx, 'id', null)
    const currentContextId = get(currentCtx, 'id', null)

    // NOTE: If already connected billing = skip to final step
    useEffect(() => {
        if (connectedContextId) {
            router.replace({ query: { ...router.query, step: 2 } }, undefined, { shallow: true })
        }
    }, [router, connectedContextId])

    // If no context found, return to step 0
    useEffect(() => {
        if (!currentCtxLoading && !currentCtxError && !currentContextId) {
            router.replace({ query: { ...router.query, step: 0 } }, undefined, { shallow: true })
        }
    }, [router, currentCtxLoading, currentCtxError, currentContextId])

    if (currentCtxLoading || !currentCtx) {
        return <Loader fill size='large'/>
    }

    const setupUrl = currentCtx.integration?.setupUrl
    const setupId = currentCtx.id

    if (setupUrl) {
        return (<SetupInteractiveBilling setupUrl={setupUrl} setupId={setupId}/>)
    }

    return (
        <SetupInstructionBilling
            instruction={get(currentCtx, ['integration', 'instruction'], '')}
            instructionExtraLink={get(currentCtx, ['integration', 'instructionExtraLink'])}
            setupId={setupId}
        />
    )
}
