import { Invoice } from '@app/condo/schema'
import { QRCodeCanvas } from '@rc-component/qrcode'
import { Row, Col, RowProps } from 'antd'
import React, { useCallback, useMemo, useState } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { Copy } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button, Card, Checkbox, Modal, Typography, Space, Alert } from '@open-condo/ui'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { UI_HIDE_PAID_FEATURES } from '@condo/domains/common/constants/featureflags'

import type { useActivateSubscriptions } from './useActivateSubscriptions'


export type PaymentType = 'card' | 'invoice'

interface UseSubscriptionPaymentModalProps {
    registerSubscriptionContext: (params: { paymentType: PaymentType }) => Promise<{ invoice: Partial<Invoice> }> | { invoice: Partial<Invoice> }
    activateLoading: boolean
}

interface UseSubscriptionPaymentModalReturn {
    PaymentModal: React.ReactNode
    InvoiceModal: React.ReactNode
    openModal: () => void
    closeModal: () => void
}

const MEDIUM_VERTICAL_GUTTER: RowProps['gutter'] = [0, 24]
const CUSTOM_CHECKBOX_CONTENT_GUTTER: RowProps['gutter'] = [0, 12]
const CUSTOM_CHECKBOXES_DESKTOP_WRAPPER_GUTTER: RowProps['gutter'] = [24, 0]
const CUSTOM_CHECKBOXES_MOBILE_WRAPPER_GUTTER: RowProps['gutter'] = [0, 16]

const CARD_EMOJI = '💳'
const INVOICE_EMOJI = '📃'

const RequisiteLine: React.FC<any> = ({ label, value, bold }) => {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, width: '100%' }}>
                <div style={{ display: 'inline-flex', textWrap: 'nowrap', flexShrink: 0 }}>
                    <Typography.Text size='medium' strong={!!bold} type='secondary'>
                        {label}
                    </Typography.Text>
                </div>
                <div style={{ flex: 1, borderBottom: '1px solid #E1E5ED', minWidth: 20 }}></div>
                <div style={{ display: 'inline-flex', textAlign: 'end' }}>
                    <Typography.Text size='medium' strong={!!bold}>
                        {value}
                    </Typography.Text>
                </div>
            </div>
            <Button
                minimal
                compact
                size='medium'
                type='secondary'
                icon={<Copy size='small' />}
                onClick={async () => {
                    await navigator.clipboard.writeText(value)
                }}
            />
        </div>
    )
}

export const useSubscriptionPaymentModal = ({
    registerSubscriptionContext,
    activateLoading,
}: UseSubscriptionPaymentModalProps): UseSubscriptionPaymentModalReturn => {
    const intl = useIntl()
    const { useFlag } = useFeatureFlags()
    const hidePaidFeatures = useFlag(UI_HIDE_PAID_FEATURES)
    const ModalTitleMessage = intl.formatMessage({ id: 'subscription.paymentModal.title' })
    const CardOnlineMessage = intl.formatMessage({ id: 'subscription.paymentModal.cardOnline' })
    const InvoiceMessage = intl.formatMessage({ id: 'subscription.paymentModal.invoice' })
    const CardSaveNoticeMessage = intl.formatMessage({ id: 'subscription.paymentModal.cardSaveNotice' })
    const ProceedToPaymentMessage = intl.formatMessage({ id: 'subscription.paymentModal.proceedToPayment' })
    const IssueInvoiceMessage = intl.formatMessage({ id: 'subscription.paymentModal.issueInvoice' })

    const { breakpoints } = useLayoutContext()

    const [isOpenInvoiceModal, setIsOpenInvoiceModal] = useState<boolean>(false)
    const [invoice, setInvoice] = useState<Partial<Invoice> | null>(null)
    const [open, setOpen] = useState<boolean>(false)
    const [selectedMethod, setSelectedMethod] = useState<PaymentType>('card')

    const openModal = useCallback(() => {
        if (hidePaidFeatures) return
        setSelectedMethod('card')
        setOpen(true)
    }, [hidePaidFeatures])

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

    const handleProceedToPayment = useCallback(async () => {
        await registerSubscriptionContext({ paymentType: 'card' })
        closeModal()
    }, [registerSubscriptionContext, closeModal])

    const handleIssueInvoice = useCallback(async () => {
        const { invoice } = await registerSubscriptionContext({ paymentType: 'invoice' })
        closeModal()
        setIsOpenInvoiceModal(true)
        setInvoice(invoice)
    }, [registerSubscriptionContext, closeModal, setIsOpenInvoiceModal])

    const PaymentModal = useMemo(() => {
        if (hidePaidFeatures) return null

        const isCardSelected = selectedMethod === 'card'
        const isInvoiceSelected = selectedMethod === 'invoice'

        const footerButton = isCardSelected ? (
            <Button
                id='subscription-payment-modal-proceed-to-payment-button'
                type='primary'
                onClick={handleProceedToPayment}
                disabled={activateLoading}
            >
                {ProceedToPaymentMessage}
            </Button>
        ) : (
            <Button
                id='subscription-payment-modal-issue-invoice-button'
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
        hidePaidFeatures,
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

    const InvoiceModal = useMemo(() => {
        // if (!invoice) return null

        const isSmallScreen = !breakpoints.DESKTOP_SMALL


        // Вопросы к биллингу:
        // -- Какие данные у нас хранятся?
        // -- Какие данные необходимы для платежа?
        // -- У нас может быть несколько реквизитов для одного контекста? Что делать, если их несколько? Выбирать тот, который Дома?
        const qrCodeData = [
            ['ST00012'],
            ['Name', 'ООО "ДОМА"'], // получатель -- invoice.RECIPIENT_FIELD.name
            ['PersonalAcc', '40702810916540071538'], // счет получателя -- invoice.RECIPIENT_FIELD.bankAccount
            ['BankName', 'УРАЛЬСКИЙ БАНК ПАО СБЕРБАНК г.Екатеринбург'], // банк получателя -- invoice.RECIPIENT_FIELD.bankName
            ['BIC', '046577674'], // БИК -- invoice.RECIPIENT_FIELD.bic
            ['CorrespAcc', '40702810916540071538'], // корреспондентский счет -- invoice.RECIPIENT_FIELD.???
            ['PayeeINN', '9731062087'], // ИНН получателя -- invoice.RECIPIENT_FIELD.tin (???)
            ['KPP', '773101001'], // КПП -- invoice.RECIPIENT_FIELD.???
            ['Purpose', 'Л12'], // назначение платежа -- invoice.RECIPIENT_FIELD.
            ['Sum', '1'], // в копейках -- invoice.toPay
            // currency code
        ]
        const qrCodeValue = qrCodeData
            .map(item => item.join('='))
            .join('|')

        return (
            <Modal
                width='big'
                open={isOpenInvoiceModal || true}
                onCancel={() => {
                    setIsOpenInvoiceModal(false)
                    closeModal()
                }}
                title={
                    <Space direction='vertical' size={8}>
                        <Typography.Title level={2}>
                            Оплатите счет № {invoice?.number || '3122'} до {invoice?.createdAt || '12.21.2026'}
                        </Typography.Title>
                        <Typography.Paragraph type='secondary' size='medium'>
                            У вас есть 5 дней на оплату — скопируйте реквизиты или отсканируйте QR-код. Если будете оплачивать позже, сгенерируйте новый счет — иначе платеж не пройдет.
                        </Typography.Paragraph>
                    </Space>
                }
                footer={[
                    <Button
                        key='payByCard'
                        type='secondary'
                    >
                        Оплатить картой
                    </Button>,
                    <Button
                        key='printPdf'
                        type='primary'
                    >
                        Скачать PDF
                    </Button>,
                ]}
            >
                <Row gutter={[0, 24]}>
                    <Col span={24}>
                        <Row gutter={[24, 24]} wrap={isSmallScreen}>
                            <Col flex='auto'>
                                <div style={{ backgroundColor: '#F2F4F6', padding: 24, borderRadius: 16 }}>
                                    <Row gutter={[0, 12]}>
                                        <Col span={24}>
                                            <Typography.Title level={3}>
                                                Реквизиты для оплаты
                                            </Typography.Title>
                                        </Col>
                                        <Col span={24}>
                                            <Row gutter={[0, 24]}>
                                                <Col span={24}>
                                                    <Row gutter={[0, 16]}>
                                                        <Col span={24}>
                                                            <RequisiteLine label='Назначение платежа' value='Л12' bold />
                                                        </Col>
                                                        <Col span={24}>
                                                            <RequisiteLine label='Банк получателя' value='УРАЛЬСКИЙ БАНК ПАО СБЕРБАНК г.Екатеринбург' />
                                                        </Col>
                                                        <Col span={24}>
                                                            <RequisiteLine label='БИК' value='046577674' />
                                                        </Col>
                                                        <Col span={24}>
                                                            <RequisiteLine label='№ счета' value='40702810916540071538' />
                                                        </Col>
                                                        <Col span={24}>
                                                            <RequisiteLine label='ИНН' value='9731062087' />
                                                        </Col>
                                                        <Col span={24}>
                                                            <RequisiteLine label='КПП' value='773101001' />
                                                        </Col>
                                                        <Col span={24}>
                                                            <RequisiteLine label='Получатель' value='ООО "ДОМА"' />
                                                        </Col>
                                                    </Row>
                                                </Col>
                                                <Col span={24}>
                                                    <Button
                                                        minimal
                                                        compact
                                                        size='medium'
                                                        type='primary'
                                                        icon={<Copy size='small' />}
                                                        children='Скопировать реквизиты'
                                                        onClick={async () => {
                                                            await navigator.clipboard.writeText(qrCodeValue)
                                                        }}
                                                    />
                                                </Col>
                                            </Row>

                                        </Col>
                                    </Row>
                                </div>
                            </Col>
                            <Col flex={isSmallScreen ? 'auto' : 'none'}>
                                <div style={{ backgroundColor: '#F2F4F6', padding: '32px 24px', borderRadius: 16, maxWidth: isSmallScreen ? undefined : 320, textAlign: 'center', marginLeft: 'auto', marginRight: 'auto' }}>
                                    <Row gutter={[0, 12]}>
                                        <Col span={24}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <div style={{ display: 'flex', overflow: 'hidden', borderRadius: 16, padding: breakpoints.TABLET_SMALL ? 24 : 16, backgroundColor: '#ffffff' }}>
                                                    <QRCodeCanvas
                                                        value={qrCodeValue}
                                                        size={breakpoints.TABLET_SMALL ? 200 : 150}
                                                    />
                                                </div>
                                            </div>
                                        </Col>
                                        <Col span={24}>
                                            <div style={{ display: 'inline-flex', maxWidth: isSmallScreen ? 400 : 320 }}>
                                                <Typography.Paragraph size='medium'>
                                                    Отсканируйте QR-код в банковском приложении — реквизиты заполнятся автоматически
                                                </Typography.Paragraph>
                                            </div>
                                        </Col>
                                    </Row>
                                </div>
                            </Col>
                        </Row>
                    </Col>
                    <Col span={24}>
                        <Alert
                            type='info'
                            showIcon
                            message='Закрывающие документы'
                            description={(
                                <Space direction='vertical' size={4}>
                                    <Typography.Paragraph size='medium'>
                                        Чтобы получить закрывающие документы, отправьте нам приглашение в Диадоке или другой программе документооборота, которой пользуетесь. Найдите нас через ИНН <b>7721581040</b> или идентификатор ЭДО <b>2BM-9731062087-773101001-202005151155067272010</b>
                                    </Typography.Paragraph>
                                    <Typography.Link
                                        size='medium'
                                        onClick={async () => {
                                            await navigator.clipboard.writeText(qrCodeValue)
                                        }}
                                    >
                                        Посмотреть инструкцию
                                    </Typography.Link>
                                </Space>
                            )}
                        />
                    </Col>
                </Row>
            </Modal>
        )
    }, [breakpoints, closeModal, invoice, isOpenInvoiceModal])

    return {
        PaymentModal,
        InvoiceModal,
        openModal,
        closeModal,
    }
}
