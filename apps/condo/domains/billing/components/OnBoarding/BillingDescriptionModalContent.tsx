import { Col, Row } from 'antd'
import React, { useCallback } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Banner, Markdown, Space, Typography, Button } from '@open-condo/ui'

import { INTEGRATION_TYPE_B2B_APP, INTEGRATION_TYPE_BILLING } from '@condo/domains/billing/constants/constants'
import { useIntegrationContext } from '@condo/domains/billing/hooks/useIntegrationContext'
import { useContainerSize } from '@condo/domains/common/hooks/useContainerSize'
import { PROMO_BLOCK_TEXT_VARIANTS_TO_PROPS } from '@condo/domains/miniapp/constants'

import type { RowProps } from 'antd'

type BillingDescriptionModalContentProps = {
    id: string
    name: string
    targetDescription: string
    detailedDescription: string
    bannerColor: string
    bannerTextColor: string
    bannerPromoImageUrl?: string
    receiptsLoadingTime?: string
    servicePrice?: string
    integrationType: typeof INTEGRATION_TYPE_BILLING | typeof INTEGRATION_TYPE_B2B_APP
    setupButtonLabel?: string
    onCompleted?: () => void
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
    integrationType,
    setupButtonLabel,
    servicePrice,
    onCompleted,
}) => {
    const intl = useIntl()
    const ReceiptsAwaitingTitle = intl.formatMessage({ id: 'accrualsAndPayments.billingModal.receiptAwaitingTime' })
    const ServicePriceTitle = intl.formatMessage({ id: 'accrualsAndPayments.billingModal.price' })
    const SetupButtonLabel = intl.formatMessage({ id: 'accrualsAndPayments.billingModal.setupButtonLabel' })
    
    const [{ width }, setRef] = useContainerSize<HTMLDivElement>()

    const { loading, handleSetupClick } = useIntegrationContext({ integrationType, integrationId: id })
    const isBilling = integrationType === INTEGRATION_TYPE_BILLING
    const cols = width >= MODAL_COL_BREAKPOINT ? 2 : 1
    const handleSetup = useCallback(async () => {
        await handleSetupClick()
        onCompleted?.()
    }, [handleSetupClick, onCompleted])

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
                    {((isBilling && receiptsLoadingTime) || (!isBilling && servicePrice )) && (
                        <div>
                            <Typography.Title level={4}>{isBilling ? ReceiptsAwaitingTitle : ServicePriceTitle}</Typography.Title>
                            <Typography.Text type='secondary'>{isBilling ? receiptsLoadingTime : servicePrice}</Typography.Text>
                        </div>
                    )}
                    <Button type='primary' onClick={handleSetup} disabled={loading}>
                        {setupButtonLabel || SetupButtonLabel}
                    </Button>
                </Space>
            </Col>
        </Row>
    )
}
