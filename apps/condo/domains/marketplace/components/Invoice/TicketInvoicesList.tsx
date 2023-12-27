import { Invoice as InvoiceType } from '@app/condo/schema'
import { Col, FormInstance, Row } from 'antd'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import omit from 'lodash/omit'
import React, { useCallback, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Space, Tag, Typography } from '@open-condo/ui'

import { INVOICE_STATUS_COLORS } from '@condo/domains/marketplace/constants'
import { InvoiceFormValuesType } from '@condo/domains/marketplace/utils/clientSchema/Invoice'

import { InvoiceRowsTable } from './InvoiceRowsTable'
import { UpdateInvoiceForm } from './UpdateInvoiceForm'


type TicketInvoiceCardPropsType = {
    organizationId: string
    invoiceIndex?: number
    form?: FormInstance
    invoice: InvoiceType
    initialValues?: InvoiceFormValuesType
    isAllFieldsDisabled?: boolean
    ticketCreatedByResident?: boolean
    refetchInvoices?: () => void
}

const TicketInvoiceCard: React.FC<TicketInvoiceCardPropsType> = ({ organizationId, refetchInvoices, invoiceIndex, form, invoice, initialValues, isAllFieldsDisabled, ticketCreatedByResident }) => {
    const intl = useIntl()
    const invoiceNumber = get(invoice, 'number')
    const InvoiceNumberMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.update.title' },
        { number: invoiceNumber }
    )
    const PaymentMessage = intl.formatMessage(
        { id: 'pages.condo.marketplace.invoice.ticketInvoice.payment' },
        { type: intl.formatMessage({ id: `pages.condo.marketplace.invoice.ticketInvoice.payment.${get(invoice, 'paymentType')}` }) }
    )
    const isNewInvoice = !invoiceNumber
    const invoiceStatus = get(invoice, 'status')
    const StatusMessage = intl.formatMessage({ id: `pages.condo.marketplace.invoice.invoiceStatus.${invoiceStatus}` })
    const NewInvoiceMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.create.title' })
    const ContractPriceMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.contractPrice' }).toLowerCase()
    const FromMessage = intl.formatMessage({ id: 'global.from' }).toLowerCase()

    const invoiceStatusColors = INVOICE_STATUS_COLORS[invoiceStatus]

    const { link } = useOrganization()
    const canManageInvoices = get(link, 'role.canManageInvoices', false)

    const [editModalOpen, setEditModalOpen] = useState<boolean>()
    const handleInvoiceNumberClick = useCallback(() => {
        if (!canManageInvoices) return
        setEditModalOpen(true)
    }, [canManageInvoices])
    const afterInvoiceUpdate = useCallback(async () => {
        await refetchInvoices()
        setEditModalOpen(false)
    }, [refetchInvoices])

    const handleUpdateInvoice = useCallback(async (values) => {
        const processedRows = get(values, 'rows', []).map(row => {
            const toPay = get(row, 'toPay')
            let resultToPay
            if (toPay === ContractPriceMessage) {
                resultToPay = '0'
            } else if (toPay.startsWith(FromMessage)) {
                resultToPay = toPay.split(' ')[1]
            } else {
                resultToPay = toPay
            }

            const resultRow = { ...row, toPay: resultToPay }

            return resultRow.sku ? resultRow : omit(resultRow, 'sku')
        })

        const invoiceValues = {
            ...values,
            rows: processedRows,
        }

        if (isNewInvoice) {
            const newInvoices = form.getFieldValue('newInvoices') || []

            newInvoices[invoiceIndex] = { ...newInvoices[invoiceIndex], ...invoiceValues }
            form.setFieldsValue({
                newInvoices,
            })
        } else {
            const existedInvoices = form.getFieldValue('existedInvoices') || []

            existedInvoices[invoiceIndex] = { ...existedInvoices[invoiceIndex], ...invoiceValues }
            form.setFieldsValue({
                existedInvoices,
            })
        }

        setEditModalOpen(false)
    }, [ContractPriceMessage, FromMessage, form, invoiceIndex, isNewInvoice])

    return (
        <Row gutter={[0, 24]}>
            <Col span={24}>
                <Row justify='space-between'>
                    <Col>
                        <Typography.Link onClick={handleInvoiceNumberClick}>
                            <Typography.Text strong>
                                {isNewInvoice ? NewInvoiceMessage : InvoiceNumberMessage}
                            </Typography.Text>
                        </Typography.Link>
                    </Col>
                    <Col>
                        <Space size={8} direction='horizontal'>
                            <Typography.Text size='small' type='secondary'>{PaymentMessage}</Typography.Text>
                            <Tag
                                textColor={get(invoiceStatusColors, 'color')}
                                bgColor={get(invoiceStatusColors, 'bgColor')}
                            >
                                {StatusMessage}
                            </Tag>
                        </Space>
                    </Col>
                </Row>
            </Col>
            <Col span={24}>
                <InvoiceRowsTable invoice={invoice} />
            </Col>
            {
                editModalOpen && (
                    <UpdateInvoiceForm
                        organizationId={organizationId}
                        invoice={invoice}
                        modalFormProps={{
                            ModalTitleMsg: isNewInvoice ? NewInvoiceMessage : InvoiceNumberMessage,
                            visible: editModalOpen,
                            showCancelButton: false,
                            cancelModal: () => setEditModalOpen(false),
                            modalProps: { width: 'big', destroyOnClose: true },
                        }}
                        action={form && handleUpdateInvoice}
                        initialValues={initialValues}
                        isAllFieldsDisabled={isAllFieldsDisabled}
                        ticketCreatedByResident={ticketCreatedByResident}
                        afterAction={!form && afterInvoiceUpdate}
                    />
                )
            }
        </Row>
    )
}

type TicketInvoicesListPropsType = {
    organizationId: string
    newInvoices?: InvoiceType[]
    existedInvoices?: InvoiceType[]
    form?: FormInstance
    initialValues?: InvoiceFormValuesType
    isAllFieldsDisabled?: boolean
    ticketCreatedByResident?: boolean
    refetchInvoices?: () => void
}

export const TicketInvoicesList: React.FC<TicketInvoicesListPropsType> = ({
    newInvoices,
    form,
    existedInvoices,
    initialValues,
    isAllFieldsDisabled,
    ticketCreatedByResident,
    refetchInvoices,
    organizationId,
}) => {
    return (
        <Row gutter={[0, 40]}>
            {
                !isEmpty(existedInvoices) && existedInvoices.map((invoice, index) => (
                    <Col key={invoice.id} span={24}>
                        <TicketInvoiceCard
                            organizationId={organizationId}
                            invoiceIndex={index}
                            invoice={invoice}
                            form={form}
                            initialValues={initialValues}
                            isAllFieldsDisabled={isAllFieldsDisabled}
                            ticketCreatedByResident={ticketCreatedByResident}
                            refetchInvoices={refetchInvoices}
                        />
                    </Col>
                ))
            }
            {
                !isEmpty(newInvoices) && newInvoices.map((invoice, index) => (
                    <Col key={invoice.id} span={24}>
                        <TicketInvoiceCard
                            organizationId={organizationId}
                            invoiceIndex={index}
                            form={form}
                            invoice={invoice}
                            initialValues={initialValues}
                            isAllFieldsDisabled={isAllFieldsDisabled}
                            ticketCreatedByResident={ticketCreatedByResident}
                            refetchInvoices={refetchInvoices}
                        />
                    </Col>
                ))
            }
        </Row>
    )
}