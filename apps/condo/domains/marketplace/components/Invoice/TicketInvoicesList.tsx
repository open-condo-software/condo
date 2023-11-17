import { Invoice as InvoiceType } from '@app/condo/schema'
import { Col, Row } from 'antd'
import get from 'lodash/get'
import React, { useCallback } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Alert, Space, Tag, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import { Loader } from '@condo/domains/common/components/Loader'
import { INVOICE_STATUS_COLORS } from '@condo/domains/marketplace/constants'
import { Invoice, InvoiceContext } from '@condo/domains/marketplace/utils/clientSchema'

import { InvoiceRowsTable } from './InvoiceRowsTable'


const TicketInvoiceCard = ({ invoice }) => {
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

    const handleInvoiceNumberClick = useCallback(() => {
        // open invoice edit modal
    }, [])

    return (
        <Row gutter={[0, 24]}>
            <Col span={24}>
                <Row justify='space-between'>
                    <Col>
                        <Typography.Link onClick={handleInvoiceNumberClick}>{InvoiceNumberMessage}</Typography.Link>
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
        </Row>
    )
}

type TicketInvoicesListPropsType = {
    invoices: InvoiceType[]
}

export const TicketInvoicesList: React.FC<TicketInvoicesListPropsType> = ({ invoices }) => {
    return (
        <Row gutter={[0, 40]}>
            {
                invoices.map(invoice => (
                    <Col key={invoice.id} span={24}>
                        <TicketInvoiceCard invoice={invoice}/>
                    </Col>
                ))
            }
        </Row>
    )
}