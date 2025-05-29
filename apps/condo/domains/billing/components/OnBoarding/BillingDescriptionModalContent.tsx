import { Col, Row } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Banner, Markdown, Space, Typography, Button } from '@open-condo/ui'

import { BillingIntegrationOrganizationContext as BillingContext } from '@condo/domains/billing/utils/clientSchema'
import { useContainerSize } from '@condo/domains/common/hooks/useContainerSize'
import { PROMO_BLOCK_TEXT_VARIANTS_TO_PROPS, CONTEXT_IN_PROGRESS_STATUS } from '@condo/domains/miniapp/constants'

import type { RowProps } from 'antd'


type BillingDescriptionModalContentProps = {
    id: string
    name: string
    targetDescription: string
    detailedDescription: string
    bannerColor: string
    bannerTextColor: string
    bannerPromoImageUrl?: string
    receiptsLoadingTime: string
}

const MODAL_PIC_GAP: RowProps['gutter'] = [40, 40]
const FULL_SPAN = 24
const SETUP_BUTTON_GAP = 24
const MODAL_COL_BREAKPOINT = 700

export const BillingDescriptionModalContent: React.FC<BillingDescriptionModalContentProps> = ({
    id,
    name,
    targetDescription,
    detailedDescription,
    bannerColor,
    bannerTextColor,
    bannerPromoImageUrl,
    receiptsLoadingTime,
}) => {
    const intl = useIntl()
    const ReceiptsAwaitingTitle = intl.formatMessage({ id: 'accrualsAndPayments.billingModal.receiptAwaitingTime' })
    const SetupButtonLabel = intl.formatMessage({ id: 'accrualsAndPayments.billingModal.setupButtonLabel' })
    const [{ width }, setRef] = useContainerSize<HTMLDivElement>()

    const router = useRouter()

    const { organization } = useOrganization()
    const orgId = get(organization, 'id', null)

    const { obj: ctx, loading: ctxLoading } = BillingContext.useObject({
        where: {
            organization: { id: orgId },
        },
    })
    const ctxCreateAction = BillingContext.useCreate({
        settings: { dv: 1 },
        state: { dv: 1 },
        status: CONTEXT_IN_PROGRESS_STATUS,
    })

    const ctxSoftDeleteAction = BillingContext.useSoftDelete()

    const contextId = get(ctx, 'id', null)
    const contextIntegrationId = get(ctx, 'integration.id', null)

    const handleSetupClick = useCallback(() => {
        if (!contextId) {
            ctxCreateAction({ organization: { connect: { id: orgId } }, integration: { connect: { id } } })
                .then(() => {
                    router.push({ query: { step: 1, billing: id } }, undefined, { shallow: true })
                })
        } else if (contextId && contextIntegrationId !== id) {
            ctxSoftDeleteAction(ctx).then(()=> {
                ctxCreateAction({ organization: { connect: { id: orgId } }, integration: { connect: { id } } })
                    .then(() => {
                        router.push({ query: { step: 1, billing: id } }, undefined, { shallow: true })
                    })
            })
        } else {
            router.push({ query: { step: 1, billing: id } }, undefined, { shallow: true })
        }
    }, [contextId, orgId, id, ctxCreateAction, router, contextIntegrationId, ctxSoftDeleteAction])

    const cols = width >= MODAL_COL_BREAKPOINT ? 2 : 1

    return (
        <Row gutter={MODAL_PIC_GAP} ref={setRef}>
            <Col span={FULL_SPAN}>
                <Banner
                    title={name}
                    subtitle={targetDescription}
                    backgroundColor={bannerColor}
                    imgUrl={bannerPromoImageUrl}
                    {...PROMO_BLOCK_TEXT_VARIANTS_TO_PROPS[bannerTextColor]}
                />
            </Col>
            <Col span={FULL_SPAN / cols}>
                <Markdown>
                    {detailedDescription}
                </Markdown>
            </Col>
            <Col span={FULL_SPAN / cols}>
                <Space size={SETUP_BUTTON_GAP} direction='vertical' width='100%'>
                    <div>
                        <Typography.Title level={4}>{ReceiptsAwaitingTitle}</Typography.Title>
                        <Typography.Text type='secondary'>{receiptsLoadingTime}</Typography.Text>
                    </div>
                    <Button type='primary' onClick={handleSetupClick} disabled={ctxLoading}>
                        {SetupButtonLabel}
                    </Button>
                </Space>
            </Col>
        </Row>
    )
}
