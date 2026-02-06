import { Row, Col, RowProps } from 'antd'
import getConfig from 'next/config'
import React, { useCallback, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Button, Card, Checkbox, Modal, Typography } from '@open-condo/ui'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'


const { publicRuntimeConfig: { subscriptionPayUrl } } = getConfig()

type PaymentMethod = 'card' | 'invoice'

interface UseSubscriptionPaymentModalProps {
    handleActivatePlan: () => Promise<void> | void
    activateLoading: boolean
    organizationId: string
    pricingRuleId: string
}

interface UseSubscriptionPaymentModalReturn {
    PaymentModal: React.ReactNode
    openModal: () => void
    closeModal: () => void
}

const MEDIUM_VERTICAL_GUTTER: RowProps['gutter'] = [0, 24]
const CUSTOM_CHECKBOX_CONTENT_GUTTER: RowProps['gutter'] = [0, 12]
const CUSTOM_CHECKBOXES_DESKTOP_WRAPPER_GUTTER: RowProps['gutter'] = [24, 0]
const CUSTOM_CHECKBOXES_MOBILE_WRAPPER_GUTTER: RowProps['gutter'] = [0, 16]

const CARD_EMOJI = '💳'
const INVOICE_EMOJI = '📃'

export const useSubscriptionPaymentModal = ({
    handleActivatePlan,
    activateLoading,
    organizationId,
    pricingRuleId,
}: UseSubscriptionPaymentModalProps): UseSubscriptionPaymentModalReturn => {
    const intl = useIntl()
    const ModalTitleMessage = intl.formatMessage({ id: 'subscription.paymentModal.title' })
    const CardOnlineMessage = intl.formatMessage({ id: 'subscription.paymentModal.cardOnline' })
    const InvoiceMessage = intl.formatMessage({ id: 'subscription.paymentModal.invoice' })
    const CardSaveNoticeMessage = intl.formatMessage({ id: 'subscription.paymentModal.cardSaveNotice' })
    const ProceedToPaymentMessage = intl.formatMessage({ id: 'subscription.paymentModal.proceedToPayment' })
    const IssueInvoiceMessage = intl.formatMessage({ id: 'subscription.paymentModal.issueInvoice' })

    const { breakpoints } = useLayoutContext()

    const [open, setOpen] = useState<boolean>(false)
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('card')

    const openModal = useCallback(() => {
        setSelectedMethod('card')
        setOpen(true)
    }, [])

    const closeModal = useCallback(() => {
        setOpen(false)
        setSelectedMethod('card')
    }, [])

    const handleCardSelect = useCallback(() => {
        setSelectedMethod('card')
    }, [])

    const handleInvoiceSelect = useCallback(() => {
        setSelectedMethod('invoice')
    }, [])

    const handleProceedToPayment = useCallback(() => {
        if (subscriptionPayUrl) {
            try {
                const url = new URL(subscriptionPayUrl)
                url.searchParams.set('organizationId', organizationId)
                url.searchParams.set('subscriptionPlanPricingRuleId', pricingRuleId)
                window.open(url.toString(), '_self')
            } catch (error) {
                console.error('Link opening error:', error)
            }
        }
        closeModal()
    }, [closeModal, organizationId, pricingRuleId])

    const handleIssueInvoice = useCallback(async () => {
        await handleActivatePlan()
        closeModal()
    }, [handleActivatePlan, closeModal])

    const PaymentModal = useMemo(() => {
        const isCardSelected = selectedMethod === 'card'
        const isInvoiceSelected = selectedMethod === 'invoice'

        const footerButton = isCardSelected ? (
            <Button
                type='primary'
                onClick={handleProceedToPayment}
                disabled={activateLoading}
            >
                {ProceedToPaymentMessage}
            </Button>
        ) : (
            <Button
                type='primary'
                onClick={handleIssueInvoice}
                disabled={activateLoading}
                loading={activateLoading}
            >
                {IssueInvoiceMessage}
            </Button>
        )

        return (
            <Modal
                open={open}
                onCancel={closeModal}
                title={ModalTitleMessage}
                footer={footerButton}
            >
                <Row gutter={MEDIUM_VERTICAL_GUTTER}>
                    <Col span={24}>
                        <Row gutter={breakpoints.TABLET_LARGE ? CUSTOM_CHECKBOXES_DESKTOP_WRAPPER_GUTTER : CUSTOM_CHECKBOXES_MOBILE_WRAPPER_GUTTER}>
                            <Col span={breakpoints.TABLET_LARGE ? 12 : 24}>
                                <Card
                                    hoverable
                                    bodyPadding={breakpoints.TABLET_LARGE ? '32px 8px' : 19}
                                    active={isCardSelected}
                                    onClick={handleCardSelect}
                                >
                                    {
                                        breakpoints.TABLET_LARGE
                                            ? (
                                                <Row gutter={CUSTOM_CHECKBOX_CONTENT_GUTTER} justify='center'>
                                                    <Col span={24}>
                                                        <Row justify='center'>
                                                            <Col>
                                                                <Typography.Title level={1}>
                                                                    {CARD_EMOJI}
                                                                </Typography.Title>
                                                            </Col>
                                                        </Row>
                                                    </Col>
                                                    <Col span={24}>
                                                        <Row justify='center'>
                                                            <Col>
                                                                <Typography.Paragraph>
                                                                    {CardOnlineMessage}
                                                                </Typography.Paragraph>
                                                            </Col>
                                                        </Row>
                                                    </Col>
                                                </Row>
                                            )
                                            : (
                                                <Row justify='center' align='middle' gutter={[8, 0]}>
                                                    <Col>
                                                        <Typography.Title level={3}>
                                                            {CARD_EMOJI}
                                                        </Typography.Title>
                                                    </Col>
                                                    <Col>
                                                        <Typography.Text>
                                                            {CardOnlineMessage}
                                                        </Typography.Text>
                                                    </Col>
                                                </Row>
                                            )
                                    }
                                </Card>
                            </Col>
                            <Col span={breakpoints.TABLET_LARGE ? 12 : 24}>
                                <Card
                                    hoverable
                                    bodyPadding={breakpoints.TABLET_LARGE ? '32px 8px' : 19}
                                    active={isInvoiceSelected}
                                    onClick={handleInvoiceSelect}
                                >
                                    {
                                        breakpoints.TABLET_LARGE
                                            ? (
                                                <Row gutter={CUSTOM_CHECKBOX_CONTENT_GUTTER} justify='center'>
                                                    <Col span={24}>
                                                        <Row justify='center'>
                                                            <Col>
                                                                <Typography.Title level={1}>
                                                                    {INVOICE_EMOJI}
                                                                </Typography.Title>
                                                            </Col>
                                                        </Row>
                                                    </Col>
                                                    <Col span={24}>
                                                        <Row justify='center'>
                                                            <Col>
                                                                <Typography.Paragraph>
                                                                    {InvoiceMessage}
                                                                </Typography.Paragraph>
                                                            </Col>
                                                        </Row>
                                                    </Col>
                                                </Row>
                                            )
                                            : (
                                                <Row justify='center' align='middle' gutter={[8, 0]}>
                                                    <Col>
                                                        <Typography.Title level={3}>
                                                            {INVOICE_EMOJI}
                                                        </Typography.Title>
                                                    </Col>
                                                    <Col>
                                                        <Typography.Text>
                                                            {InvoiceMessage}
                                                        </Typography.Text>
                                                    </Col>
                                                </Row>
                                            )
                                    }
                                </Card>
                            </Col>
                        </Row>
                    </Col>
                    {isCardSelected && (
                        <Col span={24}>
                            <Checkbox
                                label={CardSaveNoticeMessage}
                                checked
                                disabled
                            />
                        </Col>
                    )}
                </Row>
            </Modal>
        )
    }, [
        ModalTitleMessage,
        CardOnlineMessage,
        InvoiceMessage,
        CardSaveNoticeMessage,
        ProceedToPaymentMessage,
        IssueInvoiceMessage,
        breakpoints.TABLET_LARGE,
        open,
        selectedMethod,
        activateLoading,
        closeModal,
        handleCardSelect,
        handleInvoiceSelect,
        handleProceedToPayment,
        handleIssueInvoice,
    ])

    return {
        PaymentModal,
        openModal,
        closeModal,
    }
}
