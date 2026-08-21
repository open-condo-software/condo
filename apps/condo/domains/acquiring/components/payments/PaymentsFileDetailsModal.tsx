import { PaymentsFile as PaymentsFileType } from '@app/condo/schema'
import { Col, Row } from 'antd'
import dayjs from 'dayjs'
import React, { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Button, List, Modal, Tag } from '@open-condo/ui'
import type { ListProps, ModalProps } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { PAYMENTS_FILE_NEW_STATUS } from '@condo/domains/acquiring/constants/constants'

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

    const amount = intl.formatNumber(Number.parseFloat(String(paymentsFile?.amount || '0')), { style: 'currency', currency })
    const amountWithoutFees = intl.formatNumber(Number.parseFloat(String(paymentsFile?.amountWithoutFees || '0')), { style: 'currency', currency })
    const paymentsCount = Number(paymentsFile?.paymentsCount || 0)
    const paymentOrder = paymentsFile?.paymentOrder || getPaymentsOrderFromBankComment(paymentsFile?.bankComment, PaymentOrderText)

    const generalInfoRows = useMemo<ListProps['dataSource']>(() => ([
        { label: CreationDate, value: paymentsFile?.loadedAt ? formatDateTime(paymentsFile.loadedAt) : '' },
        { label: RegistryName, value: paymentsFile?.name || '' },
        {
            label: Period,
            value: paymentsFile?.paymentPeriodStartDate && paymentsFile?.paymentPeriodEndDay
                ? `${formatDate(paymentsFile.paymentPeriodStartDate)} - ${formatDate(paymentsFile.paymentPeriodEndDay)}`
                : '',
        },
    ].filter(({ value }) => Boolean(value))), [CreationDate, Period, RegistryName, paymentsFile])

    const moneyInfoRows = useMemo<ListProps['dataSource']>(() => ([
        {
            label: PaymentsAmountAndCount,
            value: paymentsCount > 0 ? `${amountWithoutFees} (${paymentsCount})` : amountWithoutFees,
        },
        { label: TransferredToBankAccount, value: amount },
    ].filter(({ value }) => Boolean(value))), [PaymentsAmountAndCount, TransferredToBankAccount, amount, amountWithoutFees, paymentsCount])

    const bankInfoRows = useMemo<ListProps['dataSource']>(() => ([
        { label: BankAccount, value: paymentsFile?.bankAccount || '' },
        { label: PaymentOrderNumber, value: paymentOrder },
    ].filter(({ value }) => Boolean(value))), [BankAccount, PaymentOrderNumber, paymentOrder, paymentsFile?.bankAccount])

    const modalTitle = intl.formatMessage({ id: 'accrualsAndPayments.payments.type.registry.details.registryTitle' }, {
        number: paymentsFile?.number || '',
    })

    const handleDownload = useCallback(async () => {
        const fileId = paymentsFile?.id
        if (!fileId) return

        await onDownload(fileId)
    }, [onDownload, paymentsFile?.id])

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
                    {paymentsFile.status && (
                        <Tag
                            bgColor={paymentsFile.status === PAYMENTS_FILE_NEW_STATUS ? colors.blue[5] : colors.gray[7]}
                            textColor={colors.white}
                        >
                            {intl.formatMessage({ id: `accrualsAndPayments.payments.type.registry.status.${paymentsFile.status}` as FormatjsIntl.Message['ids'] })}
                        </Tag>
                    )}
                    <Col span={24}>
                        <List dataSource={generalInfoRows} />
                    </Col>
                    <Col span={24}>
                        <List dataSource={moneyInfoRows} />
                    </Col>
                    <Col span={24}>
                        <List dataSource={bankInfoRows} />
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
