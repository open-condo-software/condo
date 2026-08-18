import { PaymentsFile as PaymentsFileType } from '@app/condo/schema'
import { Col, Row } from 'antd'
import dayjs from 'dayjs'
import get from 'lodash/get'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Button, Modal, Space, Tag, Typography } from '@open-condo/ui'
import type { ModalProps } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { PAYMENTS_FILE_NEW_STATUS } from '@condo/domains/acquiring/constants/constants'

import styles from './PaymentsFileDetailsModal.module.css'

const ROW_GUTTER = 8
const SECTION_SIZE = 16
const CONTENT_SIZE = 40

const formatDate = (date?: string): string => dayjs(date, 'YYYY-MM-DD').format('DD.MM.YYYY')
const formatDateTime = (date?: string): string => dayjs(date).format('DD.MM.YYYY')

const getPaymentsOrderFromBankComment = (comment = '', paymentOrderText = ''): string => {
    const map = Object.fromEntries(
        comment.split(/\n/g)
            .map(line => line.includes(':') ? line.split(':').map(chunk => chunk.trim()) : null)
            .filter(Boolean)
    )

    return map[paymentOrderText] ? map[paymentOrderText].trim().replace(/"/g, '') : ''
}

interface PaymentsFileDetailsModalProps {
    currency: string
    onDownload: (fileId: string) => Promise<void>
    onClose: VoidFunction
    open: boolean
    paymentsFile: PaymentsFileType | null
}

interface PaymentsFileDetailsRowProps {
    label: string
    value: string
}

const PaymentsFileDetailsRow: React.FC<PaymentsFileDetailsRowProps> = ({ label, value }) => (
    <Row align='bottom' gutter={ROW_GUTTER} wrap={false}>
        <Col flex='0 1 auto'>
            <Typography.Text type='secondary'>{label}</Typography.Text>
        </Col>
        <Col flex='auto'>
            <div className={styles.divider} />
        </Col>
        <Col flex='0 1 50%'>
            <div className={styles.value}>
                <Typography.Text>{value}</Typography.Text>
            </div>
        </Col>
    </Row>
)

export const PaymentsFileDetailsModal: React.FC<PaymentsFileDetailsModalProps> = ({
    currency,
    onDownload,
    onClose,
    open,
    paymentsFile,
}) => {
    const intl = useIntl()

    const CreationDate = intl.formatMessage({ id: 'accrualsAndPayments.payments.type.registry.details.creationDate' })
    const RegistryName = intl.formatMessage({ id: 'accrualsAndPayments.payments.type.registry.details.registryName' })
    const PaymentsAmountAndCount = intl.formatMessage({ id: 'accrualsAndPayments.payments.type.registry.details.paymentsAmountAndCount' })
    const PaymentOrderNumber = intl.formatMessage({ id: 'accrualsAndPayments.payments.type.registry.details.paymentOrderNumber' })
    const PaymentOrderText = intl.formatMessage({ id: 'accrualsAndPayments.payments.type.registry.details.paymentOrderText' })
    const TransferredToBankAccount = intl.formatMessage({ id: 'accrualsAndPayments.payments.type.registry.details.transferredToBankAccount' })
    const BankAccount = intl.formatMessage({ id: 'accrualsAndPayments.payments.type.registry.details.bankAccount' })
    const Period = intl.formatMessage({ id: 'accrualsAndPayments.payments.type.registry.details.period' })
    const DownloadLabel = intl.formatMessage({ id: 'accrualsAndPayments.payments.type.registry.details.downloadLabel' })

    const amount = intl.formatNumber(parseFloat(String(get(paymentsFile, 'amount') || '0')), { style: 'currency', currency })
    const amountWithoutFees = intl.formatNumber(parseFloat(String(get(paymentsFile, 'amountWithoutFees') || '0')), { style: 'currency', currency })
    const paymentsCount = Number(get(paymentsFile, 'paymentsCount') || 0)
    const paymentOrder = get(paymentsFile, 'paymentOrder') || getPaymentsOrderFromBankComment(get(paymentsFile, 'bankComment'), PaymentOrderText)

    const generalInfoRows = useMemo(() => ([
        { label: CreationDate, value: get(paymentsFile, 'loadedAt') ? formatDateTime(get(paymentsFile, 'loadedAt')) : '' },
        { label: RegistryName, value: get(paymentsFile, 'name') },
        {
            label: Period,
            value: get(paymentsFile, 'paymentPeriodStartDate') && get(paymentsFile, 'paymentPeriodEndDay')
                ? `${formatDate(get(paymentsFile, 'paymentPeriodStartDate'))} - ${formatDate(get(paymentsFile, 'paymentPeriodEndDay'))}`
                : '',
        },
    ].filter(({ value }) => Boolean(value))), [CreationDate, Period, RegistryName, paymentsFile])

    const moneyInfoRows = useMemo(() => ([
        {
            label: PaymentsAmountAndCount,
            value: paymentsCount > 0 ? `${amountWithoutFees} (${paymentsCount})` : amountWithoutFees,
        },
        { label: TransferredToBankAccount, value: amount },
    ].filter(({ value }) => Boolean(value))), [PaymentsAmountAndCount, TransferredToBankAccount, amount, amountWithoutFees, paymentsCount])

    const bankInfoRows = useMemo(() => ([
        { label: BankAccount, value: get(paymentsFile, 'bankAccount') },
        { label: PaymentOrderNumber, value: paymentOrder },
    ].filter(({ value }) => Boolean(value))), [BankAccount, PaymentOrderNumber, paymentOrder, paymentsFile])

    const modalTitle = intl.formatMessage({ id: 'accrualsAndPayments.payments.type.registry.details.registryTitle' }, {
        number: get(paymentsFile, 'number') || '',
    })

    const handleDownload = async () => {
        const fileId = get(paymentsFile, 'id')
        if (!fileId) return

        await onDownload(fileId)
    }

    const modalProps: ModalProps = {
        open,
        onCancel: onClose,
        title: modalTitle,
        footer: null,
        destroyOnClose: true,
        width: 'big',
    }

    return (
        <Modal {...modalProps}>
            {paymentsFile && (
                <Row gutter={[0, CONTENT_SIZE]}>
                    <Col span={24}>
                        <Tag
                            bgColor={paymentsFile.status === PAYMENTS_FILE_NEW_STATUS ? colors.blue[5] : colors.gray[7]}
                            textColor={colors.white}
                        >
                            {intl.formatMessage({ id: `accrualsAndPayments.payments.type.registry.status.${paymentsFile.status}` as FormatjsIntl.Message['ids'] })}
                        </Tag>
                    </Col>
                    <Col span={24}>
                        <Space direction='vertical' size={SECTION_SIZE}>
                            {generalInfoRows.map(({ label, value }) => <PaymentsFileDetailsRow key={`${label}-${value}`} label={label} value={value} />)}
                        </Space>
                    </Col>
                    <Col span={24}>
                        <Space direction='vertical' size={SECTION_SIZE}>
                            {moneyInfoRows.map(({ label, value }) => <PaymentsFileDetailsRow key={`${label}-${value}`} label={label} value={value} />)}
                        </Space>
                    </Col>
                    <Col span={24}>
                        <Space direction='vertical' size={SECTION_SIZE}>
                            {bankInfoRows.map(({ label, value }) => <PaymentsFileDetailsRow key={`${label}-${value}`} label={label} value={value} />)}
                        </Space>
                    </Col>
                    <Col span={24}>
                        <Row justify='end'>
                            <Button type='secondary' onClick={handleDownload}>
                                {DownloadLabel}
                            </Button>
                        </Row>
                    </Col>
                </Row>
            )}
        </Modal>
    )
}
