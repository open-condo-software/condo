import { SortBillingIntegrationOrganizationContextsBy } from '@app/condo/schema'
import { Col, Row } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Typography, Markdown, Space, Button } from '@open-condo/ui'

import { BillingIntegrationOrganizationContext as BillingContext } from '@condo/domains/billing/utils/clientSchema'
import { Loader } from '@condo/domains/common/components/Loader'
import { extractOrigin } from '@condo/domains/common/utils/url.utils'
import { IFrame } from '@condo/domains/miniapp/components/IFrame'
import { CONTEXT_FINISHED_STATUS } from '@condo/domains/miniapp/constants'


import type { RowProps } from 'antd'


const INSTRUCTION_FOOTER_GUTTER: RowProps['gutter'] = [0, 40]
const COL_FULL_SPAN = 24

type SetupInstructionBillingProps = {
    instruction: string
    instructionExtraLink?: string
}

const SetupInstructionBilling: React.FC<SetupInstructionBillingProps> = ({ instruction, instructionExtraLink }) => {
    const intl = useIntl()
    const DoneButtonMessage = intl.formatMessage({ id:'accrualsAndPayments.setupBilling.instruction.doneButtonLabel' })
    const InstructionButtonMessage = intl.formatMessage({ id:'accrualsAndPayments.setupBilling.instruction.instructionButtonLabel' })

    const router = useRouter()

    const handleDoneClick = useCallback(() => {
        router.push({ query: { step: 2 } }, undefined, { shallow: true })
    }, [router])

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
}

const SetupInteractiveBilling: React.FC<SetupInteractiveBillingProps> = ({ setupUrl }) => {
    const router = useRouter()
    const frameOrigin = useMemo(() => extractOrigin(setupUrl), [setupUrl])
    const handleDoneMessage = useCallback((event: MessageEvent) => {
        if (event.origin === frameOrigin && get(event.data, 'success') === true) {
            router.push({ query: { step: 2 } }, undefined, { shallow: true })
        }
    }, [frameOrigin, router])

    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.addEventListener('message', handleDoneMessage)

            return () => window.removeEventListener('message', handleDoneMessage)
        }
    }, [handleDoneMessage])

    return (
        <IFrame
            src={setupUrl}
            reloadScope='organization'
            withLoader
            withPrefetch
            withResize
            initialHeight={400}
        />
    )
}

export const SetupBilling: React.FC = ()=> {
    const router = useRouter()
    const { organization } = useOrganization()
    const orgId = get(organization, 'id', null)

    const { objs: connectedContexts, loading: connectedCtxLoading, error: connectedCtxError } = BillingContext.useObjects({
        where: {
            organization: { id: orgId },
            status: CONTEXT_FINISHED_STATUS,
        },
        sortBy: [
            SortBillingIntegrationOrganizationContextsBy.UpdatedAtDesc,
            SortBillingIntegrationOrganizationContextsBy.IdDesc,
        ],
    })
    const { objs: currentContexts, loading: currentCtxLoading, error: currentCtxError } = BillingContext.useObjects({
        where: {
            organization: { id: orgId },
        },
        sortBy: [
            SortBillingIntegrationOrganizationContextsBy.UpdatedAtDesc,
            SortBillingIntegrationOrganizationContextsBy.IdDesc,
        ],
    })

    const connectedCtx = connectedContexts[0] || null
    const currentCtx = currentContexts[0] || null
    const connectedContextId = get(connectedCtx, 'id', null)
    const currentContextId = get(currentCtx, 'id', null)

    // NOTE: If already connected billing = skip to final step
    useEffect(() => {
        if (!connectedCtxLoading && !connectedCtxError && connectedContextId) {
            router.replace({ query: { ...router.query, step: 2 } }, undefined, { shallow: true })
        }
    }, [router, connectedCtxLoading, connectedCtxError, connectedContextId])

    // If no context found, return to step 0
    useEffect(() => {
        if (!currentCtxLoading && !currentCtxError && !currentContextId) {
            router.replace({ query: { step: 0 } }, undefined, { shallow: true })
        }
    }, [router, currentCtxLoading, currentCtxError, currentContextId])

    if (connectedCtxLoading || currentCtxLoading) {
        return <Loader fill size='large'/>
    }

    if (connectedCtxError || currentCtxError) {
        return <Typography.Title>{currentCtxError || connectedCtxError}</Typography.Title>
    }

    const setupUrl = get(currentCtx, ['integration', 'setupUrl'])

    if (setupUrl) {
        return <SetupInteractiveBilling setupUrl={setupUrl}/>
    }

    return (
        <SetupInstructionBilling
            instruction={get(currentCtx, ['integration', 'instruction'], '')}
            instructionExtraLink={get(currentCtx, ['integration', 'instructionExtraLink'])}
        />
    )
}
