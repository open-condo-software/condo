import { Invoice as InvoiceType } from '@app/condo/schema'
import { Col, Row } from 'antd'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import React, { useCallback, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Space, Tag, Typography } from '@open-condo/ui'

import { INVOICE_STATUS_COLORS } from '@condo/domains/marketplace/constants'
import { InvoiceFormValuesType } from '@condo/domains/marketplace/utils/clientSchema/Invoice'

import { InvoiceRowsTable } from './InvoiceRowsTable'
import { UpdateInvoiceForm } from './UpdateInvoiceForm'


type TicketInvoiceCardPropsType = {
    isNewInvoice?: boolean
    invoice: InvoiceType
    refetchInvoices: () => void
    initialValues?: InvoiceFormValuesType
    isAllFieldsDisabled?: boolean
    ticketCreatedByResident?: boolean
}

const TicketInvoiceCard: React.FC<TicketInvoiceCardPropsType> = ({ isNewInvoice, invoice, refetchInvoices, initialValues, isAllFieldsDisabled, ticketCreatedByResident }) => {
    const intl = useIntl()
    const InvoiceNumberMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.update.title' },
        { number: get(invoice, 'number') }
    )
    const PaymentMessage = intl.formatMessage(
        { id: 'pages.condo.marketplace.invoice.ticketInvoice.payment' },
        { type: intl.formatMessage({ id: `pages.condo.marketplace.invoice.ticketInvoice.payment.${get(invoice, 'paymentType')}` }) }
    )
    const invoiceStatus = get(invoice, 'status')
    const StatusMessage = intl.formatMessage({ id: `pages.condo.marketplace.invoice.invoiceStatus.${invoiceStatus}` })
    const invoiceStatusColors = INVOICE_STATUS_COLORS[invoiceStatus]

    const [editModalOpen, setEditModalOpen] = useState<boolean>()
    const handleInvoiceNumberClick = useCallback(() => {
        setEditModalOpen(true)
    }, [])
    const afterInvoiceUpdate = useCallback(async () => {
        await refetchInvoices()
        setEditModalOpen(false)
    }, [refetchInvoices])

    return (
        <Row gutter={[0, 24]}>
            <Col span={24}>
                <Row justify='space-between'>
                    <Col>
                        <Typography.Link onClick={handleInvoiceNumberClick}>
                            <Typography.Text strong>
                                {isNewInvoice ? 'Новый счет' : InvoiceNumberMessage}
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
                        invoice={invoice}
                        modalFormProps={{
                            ModalTitleMsg: InvoiceNumberMessage,
                            visible: editModalOpen,
                            showCancelButton: false,
                            cancelModal: () => setEditModalOpen(false),
                            modalProps: { width: 'big', destroyOnClose: true },
                        }}
                        afterAction={afterInvoiceUpdate}
                        initialValues={initialValues}
                        isAllFieldsDisabled={isAllFieldsDisabled}
                        ticketCreatedByResident={ticketCreatedByResident}
                    />
                )
            }
        </Row>
    )
}

type TicketInvoicesListPropsType = {
    newInvoices?: InvoiceType[]
    invoices: InvoiceType[]
    refetchInvoices: () => void
    initialValues?: InvoiceFormValuesType
    isAllFieldsDisabled?: boolean
    ticketCreatedByResident?: boolean
}

export const TicketInvoicesList: React.FC<TicketInvoicesListPropsType> = ({
    newInvoices, invoices, refetchInvoices, initialValues, isAllFieldsDisabled, ticketCreatedByResident,
}) => {
    return (
        <Row gutter={[0, 40]}>
            {
                !isEmpty(newInvoices) && newInvoices.map(invoice => (
                    <Col key={invoice.id} span={24}>
                        <TicketInvoiceCard
                            isNewInvoice
                            invoice={invoice}
                            initialValues={initialValues}
                            refetchInvoices={refetchInvoices}
                            isAllFieldsDisabled={isAllFieldsDisabled}
                            ticketCreatedByResident={ticketCreatedByResident}
                        />
                    </Col>
                ))
            }
            {
                invoices.map(invoice => (
                    <Col key={invoice.id} span={24}>
                        <TicketInvoiceCard
                            invoice={invoice}
                            refetchInvoices={refetchInvoices}
                            initialValues={initialValues}
                            isAllFieldsDisabled={isAllFieldsDisabled}
                            ticketCreatedByResident={ticketCreatedByResident}
                        />
                    </Col>
                ))
            }
        </Row>
    )
}