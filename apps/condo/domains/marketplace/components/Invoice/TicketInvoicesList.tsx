import { Invoice as InvoiceType } from '@app/condo/schema'
import { Col, Row } from 'antd'
import get from 'lodash/get'
import React, { useCallback, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Space, Tag, Typography } from '@open-condo/ui'

import { INVOICE_STATUS_COLORS } from '@condo/domains/marketplace/constants'

import { InvoiceRowsTable } from './InvoiceRowsTable'
import { UpdateInvoiceForm } from './UpdateInvoiceForm'


const TicketInvoiceCard = ({ invoice, refetchInvoices }) => {
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
                                {InvoiceNumberMessage}
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
            <UpdateInvoiceForm
                invoice={invoice}
                modalFormProps={{
                    ModalTitleMsg: InvoiceNumberMessage,
                    visible: editModalOpen,
                    showCancelButton: false,
                    cancelModal: () => setEditModalOpen(false),
                    modalProps: { width: 'big' },
                }}
                afterAction={afterInvoiceUpdate}
            />
        </Row>
    )
}

type TicketInvoicesListPropsType = {
    invoices: InvoiceType[]
    refetchInvoices: () => void
}

export const TicketInvoicesList: React.FC<TicketInvoicesListPropsType> = ({ invoices, refetchInvoices }) => {
    return (
        <Row gutter={[0, 40]}>
            {
                invoices.map(invoice => (
                    <Col key={invoice.id} span={24}>
                        <TicketInvoiceCard
                            invoice={invoice}
                            refetchInvoices={refetchInvoices}
                        />
                    </Col>
                ))
            }
        </Row>
    )
}