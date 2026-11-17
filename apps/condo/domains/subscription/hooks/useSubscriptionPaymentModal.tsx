import { Invoice } from '@app/condo/schema'
import { QRCodeCanvas } from '@rc-component/qrcode'
import { Row, Col, RowProps } from 'antd'
import getConfig from 'next/config'
import React, { useCallback, useMemo, useState } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { Copy } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button, Card, Checkbox, Modal, Typography, Space, Alert } from '@open-condo/ui'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { UI_HIDE_PAID_FEATURES } from '@condo/domains/common/constants/featureflags'

import { generatePDF } from '../utils/clientSchema/pdf'


const { publicRuntimeConfig: { subscriptionPaymentRequisites, closingDocsRequisites } } = getConfig()

const TEST_SUBSCRIPTION_PAYMENT_REQUISITES = {
    bankName: 'УРАЛЬСКИЙ БАНК ПАО СБЕРБАНК г.Екатеринбург', // банк получателя
    bic: '046577674', // БИК
    correspondentAccount: '30101810500000000674', // корреспондентский счет
    name: 'ООО "ДОМА"', // получатель
    tin: '9731062087', // ИНН получателя
    iec: '773101001', // КПП
    personalAccount: '40702810916540071538', // счет получателя
}

const TEST_CLOSING_DOCS_REQUISITES = {
    tin: '7721581040',
    edoId: '2BM-9731062087-773101001-202005151155067272010',
}

const SUBSCRIPTION_PAYMENT_REQUISITES = (subscriptionPaymentRequisites ? JSON.parse(subscriptionPaymentRequisites) : null) || TEST_SUBSCRIPTION_PAYMENT_REQUISITES
const CLOSING_DOCS_REQUISITES = (closingDocsRequisites ? JSON.parse(closingDocsRequisites) : null) || TEST_CLOSING_DOCS_REQUISITES

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
    const InvoiceModalDescriptionMessage = intl.formatMessage({ id: 'subscription.invoiceModal.description' })
    const PayByCardMessage = intl.formatMessage({ id: 'subscription.invoiceModal.payByCard' })
    const DownloadPdfMessage = intl.formatMessage({ id: 'subscription.invoiceModal.downloadPdf' })
    const RequisitesTitleMessage = intl.formatMessage({ id: 'subscription.invoiceModal.requisitesTitle' })
    const PaymentPurposeMessage = intl.formatMessage({ id: 'subscription.invoiceModal.paymentPurpose' })
    const BankNameLabelMessage = intl.formatMessage({ id: 'subscription.invoiceModal.bankName' })
    const BicLabelMessage = intl.formatMessage({ id: 'subscription.invoiceModal.bic' })
    const PersonalAccountLabelMessage = intl.formatMessage({ id: 'subscription.invoiceModal.personalAccount' })
    const CorrespondentAccountLabelMessage = intl.formatMessage({ id: 'subscription.invoiceModal.correspondentAccount' })
    const InnLabelMessage = intl.formatMessage({ id: 'subscription.invoiceModal.inn' })
    const KppLabelMessage = intl.formatMessage({ id: 'subscription.invoiceModal.kpp' })
    const RecipientLabelMessage = intl.formatMessage({ id: 'subscription.invoiceModal.recipient' })
    const CopyRequisitesMessage = intl.formatMessage({ id: 'subscription.invoiceModal.copyRequisites' })
    const QrDescriptionMessage = intl.formatMessage({ id: 'subscription.invoiceModal.qrDescription' })
    const ClosingDocsTitleMessage = intl.formatMessage({ id: 'subscription.invoiceModal.closingDocs.title' })
    const ClosingDocsInstructionMessage = intl.formatMessage({ id: 'subscription.invoiceModal.closingDocs.instruction' })
    const ClosingDocsDescriptionMessage = intl.formatMessage(
        { id: 'subscription.invoiceModal.closingDocs.description' },
        { tin: CLOSING_DOCS_REQUISITES.tin, edoId: CLOSING_DOCS_REQUISITES.edoId },
    )

    const { breakpoints } = useLayoutContext()

    const [isOpenInvoiceModal, setIsOpenInvoiceModal] = useState<boolean>(false)
    const [invoice, setInvoice] = useState<Partial<Invoice> | null>(null)
    const InvoiceModalTitleMessage = intl.formatMessage(
        { id: 'subscription.invoiceModal.title' },
        { number: invoice?.number || '', date: invoice?.createdAt || '' },
    )
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

    // NOTE: Only for Russia: ГОСТ Р 56042-2014
    const getQRCodeValue = useCallback((purpose, sum) => {
        if (!SUBSCRIPTION_PAYMENT_REQUISITES.name || !SUBSCRIPTION_PAYMENT_REQUISITES.personalAccount || !SUBSCRIPTION_PAYMENT_REQUISITES.bankName || !SUBSCRIPTION_PAYMENT_REQUISITES.bic || !SUBSCRIPTION_PAYMENT_REQUISITES.correspondentAccount) {
            throw new Error('Missing required requisites for QR code generation')
        }

        if (!purpose || !sum) {
            throw new Error('Missing required purpose or sum for QR code generation')
        }

        const separator = '|'
        const requisiteSeperator = '='

        // metadata
        const formatIdentifier = 'ST'
        const version = '0001'
        const characterSetIdentifier = '2'
        const metadata = formatIdentifier + version + characterSetIdentifier

        const getRequisiteLine = (key: string, value: string) => `${key}${requisiteSeperator}${value}`

        const qrCodeData = [
            // metadata
            metadata,

            // required requisites (the order matters)
            getRequisiteLine('Name', SUBSCRIPTION_PAYMENT_REQUISITES.name),
            getRequisiteLine('PersonalAcc', SUBSCRIPTION_PAYMENT_REQUISITES.personalAccount),
            getRequisiteLine('BankName', SUBSCRIPTION_PAYMENT_REQUISITES.bankName),
            getRequisiteLine('BIC', SUBSCRIPTION_PAYMENT_REQUISITES.bic),
            getRequisiteLine('CorrespAcc', SUBSCRIPTION_PAYMENT_REQUISITES.correspondentAccount),

            // optional requisites
            getRequisiteLine('Sum', sum),
            getRequisiteLine('Purpose', purpose),
            SUBSCRIPTION_PAYMENT_REQUISITES.tin ? getRequisiteLine('PayeeINN', SUBSCRIPTION_PAYMENT_REQUISITES.tin) : null,
            SUBSCRIPTION_PAYMENT_REQUISITES.iec ? getRequisiteLine('KPP', SUBSCRIPTION_PAYMENT_REQUISITES.iec) : null,
        ]

        return qrCodeData.filter(Boolean).join(separator)
    }, [])

    const InvoiceModal = useMemo(() => {
        // if (!invoice) return null

        const isSmallScreen = !breakpoints.DESKTOP_SMALL
        const qrCodeValue = getQRCodeValue('Л12', '1')

        return (
            <Modal
                width='big'
                open={isOpenInvoiceModal || true}
                onCancel={() => {
                    setIsOpenInvoiceModal(false)
                    closeModal()
                    setInvoice(null)
                }}
                title={
                    <Space direction='vertical' size={8}>
                        <Typography.Title level={2}>
                            {InvoiceModalTitleMessage}
                        </Typography.Title>
                        <Typography.Paragraph type='secondary' size='medium'>
                            {InvoiceModalDescriptionMessage}
                        </Typography.Paragraph>
                    </Space>
                }
                footer={[
                    <Button
                        key='payByCard'
                        type='secondary'
                    >
                        {PayByCardMessage}
                    </Button>,
                    <Button
                        key='printPdf'
                        type='primary'
                        onClick={() => {
                            const pdfDoc = generatePDF()
                            pdfDoc.download(`invoice-${Date.now()}.pdf`)
                        }}
                    >
                        {DownloadPdfMessage}
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
                                                {RequisitesTitleMessage}
                                            </Typography.Title>
                                        </Col>
                                        <Col span={24}>
                                            <Row gutter={[0, 24]}>
                                                <Col span={24}>
                                                    <Row gutter={[0, 16]}>
                                                        <Col span={24}>
                                                            <RequisiteLine label={PaymentPurposeMessage} value='Л12' bold />
                                                        </Col>
                                                        <Col span={24}>
                                                            <RequisiteLine label={BankNameLabelMessage} value={SUBSCRIPTION_PAYMENT_REQUISITES.bankName} />
                                                        </Col>
                                                        <Col span={24}>
                                                            <RequisiteLine label={BicLabelMessage} value={SUBSCRIPTION_PAYMENT_REQUISITES.bic} />
                                                        </Col>
                                                        <Col span={24}>
                                                            <RequisiteLine label={CorrespondentAccountLabelMessage} value={SUBSCRIPTION_PAYMENT_REQUISITES.correspondentAccount} />
                                                        </Col>
                                                        <Col span={24}>
                                                            <RequisiteLine label={InnLabelMessage} value={SUBSCRIPTION_PAYMENT_REQUISITES.tin} />
                                                        </Col>
                                                        <Col span={24}>
                                                            <RequisiteLine label={KppLabelMessage} value={SUBSCRIPTION_PAYMENT_REQUISITES.iec} />
                                                        </Col>
                                                        <Col span={24}>
                                                            <RequisiteLine label={PersonalAccountLabelMessage} value={SUBSCRIPTION_PAYMENT_REQUISITES.personalAccount} />
                                                        </Col>
                                                        <Col span={24}>
                                                            <RequisiteLine label={RecipientLabelMessage} value={SUBSCRIPTION_PAYMENT_REQUISITES.name} />
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
                                                        children={CopyRequisitesMessage}
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
                                                    {QrDescriptionMessage}
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
                            message={ClosingDocsTitleMessage}
                            description={(
                                <Space direction='vertical' size={4}>
                                    <Typography.Paragraph size='medium'>
                                        {ClosingDocsDescriptionMessage}
                                    </Typography.Paragraph>
                                    <Typography.Link
                                        size='medium'
                                        href='https://help.doma.ai/article/83297'
                                        target='_blank'
                                    >
                                        {ClosingDocsInstructionMessage}
                                    </Typography.Link>
                                </Space>
                            )}
                        />
                    </Col>
                </Row>
            </Modal>
        )
    }, [
        breakpoints,
        closeModal,
        invoice,
        isOpenInvoiceModal,
        InvoiceModalTitleMessage,
        InvoiceModalDescriptionMessage,
        PayByCardMessage,
        DownloadPdfMessage,
        RequisitesTitleMessage,
        PaymentPurposeMessage,
        BankNameLabelMessage,
        BicLabelMessage,
        CorrespondentAccountLabelMessage,
        PersonalAccountLabelMessage,
        InnLabelMessage,
        KppLabelMessage,
        RecipientLabelMessage,
        CopyRequisitesMessage,
        QrDescriptionMessage,
        ClosingDocsTitleMessage,
        ClosingDocsDescriptionMessage,
        ClosingDocsInstructionMessage,
    ])

    return {
        PaymentModal,
        InvoiceModal,
        openModal,
        closeModal,
    }
}

