import { MultiPaymentStatusType } from '@app/condo/schema'
import styled from '@emotion/styled'
import { Col, Row, Typography } from 'antd'
import Big from 'big.js'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import get from 'lodash/get'
import pick from 'lodash/pick'
import React, { useEffect, useRef } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { colors } from '@condo/domains/common/constants/style'
import { createWrappedPdf } from '@condo/domains/common/utils/pdf'

dayjs.extend(utc)

type PrintingOption = {
    key: string
    value: string
}

type ReceiptPrintingSectionRow = {
    name: string
    toPay: string
}

type ReceiptPrintingSection = {
    title?: string
    info: Array<PrintingOption>
    amount?: string
    rows: Array<ReceiptPrintingSectionRow>
    explicitFee?: string
    explicitServiceCharge?: string
}

type InvoicePrintingSectionRow = {
    name: string
    toPay: string
    count: number
    vatPercent: string
    amount: string
}

type InvoicePrintingSection = {
    number: string
    date: string
    amount: string
    vatAmount?: Record<string, string>
    taxRegime: string
    rows: Array<InvoicePrintingSectionRow>
    info: Array<PrintingOption>
}

// This colors are mobile oriented and dont match antd / CRM DS defaults
const STATUS_PROCESSING_COLOR = '#FF9500'
const STATUS_SUCCESS_COLOR = '#4CD174'
const STATUS_ERROR_COLOR = '#FF3B30'

interface IAcquiringReceiptProps {
    paymentDateTime: string
    documentNumber: string
    documentTitle: string
    status: MultiPaymentStatusType
    payerInfo: Array<PrintingOption>
    totalSum: {
        amountWithExplicits: string
        currencyCode: string
        explicitFee?: string
        explicitServiceCharge?: string
    }
    receipts: Array<ReceiptPrintingSection>
    invoices: Array<InvoicePrintingSection>
}

interface IReceiptSectionProps {
    section: ReceiptPrintingSection
    currencyCode: string
}

interface IInvoiceSectionProps {
    section: InvoicePrintingSection
    currencyCode: string
}

interface IInfoRowProps {
    row: PrintingOption
}

const SCROLL_BOX_STYLE: React.CSSProperties = { overflow: 'auto' }

const PageWrapper = styled.div`
  max-width: 500px;
  min-width: 380px;
  padding: 20px;
  font-family: 'SF Pro Text', 'Wix Madefor Display', -apple-system, BlinkMacSystemFont, Helvetica, sans-serif;
  font-size: 12px;
  line-height: normal;
  
  & .payerInfo {
    padding-top: 20px;
    padding-bottom: 16px;
  }
  
  & .receiptTitle {
    font-size: 20px;
    padding: 20px 0;
  }
  
  & .sectionTitle {
    padding: 24px 0 8px 0;
    border-bottom: 1px solid ${colors.lightGrey[5]};
  }

  & .payerTitle {
    padding: 0px 0 8px 0;
    border-bottom: 1px solid ${colors.lightGrey[5]};
  }

  & .rowsTable {
    
    border-bottom: 1px solid ${colors.lightGrey[5]};
    
    padding-bottom: 20px;
    color: ${colors.black[2]};
    
    & .rowsTableHeader {
      color: ${colors.lightGrey[7]};
      padding-bottom: 20px;
    }
    
    & .vatRow {
      color: ${colors.lightGrey[7]}
    }
    
    & .total {
      font-size: 14px;
      font-weight: 600;
    }
  }
  
  & .sectionInfo {
    color: ${colors.lightGrey[7]};
    
    & .taxRegime {
      border-top: 1px solid ${colors.lightGrey[5]};
      padding-top: 4px;
      margin-top: 4px;
    }
  }

  & .moneyContainer {
    border-top: 1px solid ${colors.lightGrey[5]};
    border-bottom: 1px solid ${colors.lightGrey[5]};
    box-sizing: border-box;
    margin: 40px 0;
    padding: 12px 0;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: flex-start;
  }

  & .statusContainer {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
  }
`

const InfoRow: React.FC<IInfoRowProps> = ({ row }) => !!row.value && (
    <>
        <Col span={12}>
            {row.key}
        </Col>
        <Col span={12} style={{ textAlign: 'right' }}>
            {row.value}
        </Col>
    </>
)

const Money: React.FC<{ amount: string, currencyCode: string }> = ({ amount, currencyCode }) => {
    const intl = useIntl()
    const money = intl.formatNumber(parseFloat(amount || '0'), {
        style: 'currency',
        currency: currencyCode,
        currencyDisplay: 'narrowSymbol',
    })

    return (
        <>{money}</>
    )
}

const ReceiptRowsTable: React.FC<IReceiptSectionProps> = ({ section, currencyCode }) => {
    const intl = useIntl()
    const ServiceTitle = intl.formatMessage({ id: 'BillingServiceName' })
    const AmountTitle = intl.formatMessage({ id: 'BillingServiceAmount' })
    const TotalTitle = intl.formatMessage({ id: 'acquiringReceipt.total' })
    const IncludingFeeMessage = intl.formatMessage({ id: 'IncludingFee' })
    const IncludingServiceChargeMessage = intl.formatMessage({ id: 'IncludingServiceCharge' })

    const { explicitFee, explicitServiceCharge } = section
    const isPositiveFee = Big(explicitFee || '0').gt(0)
    const isPositiveCharge = Big(explicitServiceCharge || '0').gt(0)

    return (
        <Col span={24}>
            <Row justify='space-between' className='rowsTableHeader'>
                <Col>{ServiceTitle}</Col>
                <Col>{AmountTitle}</Col>
            </Row>
            <Row gutter={[0, 8]}>
                {
                    section.rows.map((row) => (
                        <>
                            <Col span={12}>{row.name}</Col>
                            <Col span={12} style={{ textAlign: 'right' }}>
                                <Money amount={row.toPay} currencyCode={currencyCode}/>
                            </Col>
                        </>
                    ))
                }
                <Col span={12}>
                    <Typography.Title level={5}>
                        {TotalTitle}
                    </Typography.Title>
                </Col>
                <Col span={12} style={{ textAlign: 'right' }}>
                    <Typography.Title level={5}>
                        <Money amount={section.amount} currencyCode={currencyCode}/>
                    </Typography.Title>
                </Col>
                {
                    isPositiveFee && (
                        <Col span={24} style={{ textAlign: 'right' }}>
                            <Typography.Text>
                                {IncludingFeeMessage} <Money amount={explicitFee} currencyCode={currencyCode}/>
                            </Typography.Text>
                        </Col>
                    )
                }
                {
                    isPositiveCharge && (
                        <Col span={24} style={{ textAlign: 'right' }}>
                            <Typography.Text>
                                {IncludingServiceChargeMessage} <Money
                                    amount={explicitServiceCharge}
                                    currencyCode={currencyCode}
                                />
                            </Typography.Text>
                        </Col>
                    )
                }
            </Row>
        </Col>
    )
}

const InvoiceRowsTable: React.FC<IInvoiceSectionProps> = ({ section, currencyCode }) => {
    const intl = useIntl()

    const TotalTitle = intl.formatMessage({ id: 'acquiringReceipt.total' })
    const NameTitle = intl.formatMessage({ id: 'acquiringReceipt.invoice.row.name' })
    const ToPayTitle = intl.formatMessage({ id: 'acquiringReceipt.invoice.row.toPay' })
    const CountTitle = intl.formatMessage({ id: 'acquiringReceipt.invoice.row.count' })
    const VatTitle = intl.formatMessage({ id: 'acquiringReceipt.invoice.row.vatPercent' })
    const AmountTitle = intl.formatMessage({ id: 'acquiringReceipt.invoice.row.amount' })
    const NoVATTitle = intl.formatMessage({ id: 'pages.condo.marketplace.settings.requisites.noTax' })

    const vatPercents = Object.keys(get(section, 'vatAmount', {}))

    return (
        <Col span={24}>
            <Row className='rowsTableHeader'>
                <Col span={8}>{NameTitle}</Col>
                <Col span={4} style={{ textAlign: 'right' }}>{ToPayTitle}</Col>
                <Col span={4} style={{ textAlign: 'right' }}>{CountTitle}</Col>
                <Col span={4} style={{ textAlign: 'right' }}>{VatTitle}</Col>
                <Col span={4} style={{ textAlign: 'right' }}>{AmountTitle}</Col>
            </Row>
            <Row gutter={[0, 8]}>
                {
                    section.rows.map((row) => (
                        <>
                            <Col span={8}>{row.name}</Col>
                            <Col span={4} style={{ textAlign: 'right' }}>
                                <Money amount={row.toPay} currencyCode={currencyCode}/>
                            </Col>
                            <Col span={4} style={{ textAlign: 'right' }}>{row.count}</Col>
                            <Col
                                span={4}
                                style={{ textAlign: 'right' }}
                            >
                                {row.vatPercent ? `${Big(row.vatPercent).toString()}%` : NoVATTitle}
                            </Col>
                            <Col span={4} style={{ textAlign: 'right' }}>
                                <Money amount={row.amount} currencyCode={currencyCode}/>
                            </Col>
                        </>
                    ))
                }
                {
                    vatPercents.length > 0 && vatPercents.map((vatPercent) => (
                        <>
                            <Col span={12}>
                                <Typography.Text strong className='vatRow'>{VatTitle} {Big(vatPercent).toString()}%</Typography.Text>
                            </Col>
                            <Col span={12} style={{ textAlign: 'right' }}>
                                <Typography.Text strong className='vatRow'>
                                    <Money
                                        amount={get(section, ['vatAmount', vatPercent])}
                                        currencyCode={currencyCode}
                                    />
                                </Typography.Text>
                            </Col>
                        </>
                    ))
                }
                <Col span={12}>
                    <Typography.Title level={5}>
                        {TotalTitle}
                    </Typography.Title>
                </Col>
                <Col span={12} style={{ textAlign: 'right' }}>
                    <Typography.Title level={5}>
                        <Money amount={section.amount} currencyCode={currencyCode}/>
                    </Typography.Title>
                </Col>
            </Row>
        </Col>
    )
}

const ReceiptSection: React.FC<IReceiptSectionProps> = ({ section, currencyCode }) => {
    return (
        <Col span={24}>
            <Row gutter={[0, 8]}>
                <Col span={24} className='sectionTitle'>
                    {section.title && (<Typography.Text strong>{section.title}</Typography.Text>)}
                </Col>
                <Col span={24} className='rowsTable'>
                    <Row><ReceiptRowsTable section={section} currencyCode={currencyCode}/></Row>
                </Col>
                <Col className='sectionInfo'>
                    <Row gutter={[0, 4]}>
                        {
                            section.info.map((row, index) => (
                                <InfoRow row={row} key={index}/>
                            ))
                        }
                    </Row>
                </Col>
            </Row>
        </Col>
    )
}

const InvoiceSection: React.FC<IInvoiceSectionProps> = ({ section, currencyCode }) => {
    const intl = useIntl()
    const InvoiceTitle = intl.formatMessage({ id: 'acquiringReceipt.invoice.title' }, pick(section, 'number', 'date'))
    const TaxRegimeTitle = intl.formatMessage({ id: 'acquiringReceipt.taxRegime' })
    const TaxRegimeModeTitle = intl.formatMessage({ id: `acquiringReceipt.taxRegime.${section.taxRegime}` as FormatjsIntl.Message['ids'] })

    return (
        <Col span={24}>
            <Row gutter={[0, 8]}>
                <Col span={24} className='sectionTitle'>
                    <Typography.Text strong>{InvoiceTitle}</Typography.Text>
                </Col>
                <Col span={24} className='rowsTable'>
                    <Row><InvoiceRowsTable section={section} currencyCode={currencyCode}/></Row>
                </Col>
                <Col className='sectionInfo'>
                    <Row gutter={[0, 4]}>
                        {
                            section.info.map((row, index) => (
                                <InfoRow row={row} key={index}/>
                            ))
                        }
                        <Col span={12} className='taxRegime'>{TaxRegimeTitle}</Col>
                        <Col span={12} className='taxRegime' style={{ textAlign: 'right' }}>{TaxRegimeModeTitle}</Col>
                    </Row>
                </Col>

            </Row>
        </Col>
    )
}

export const AcquiringReceipt: React.FC<IAcquiringReceiptProps> = (props) => {
    const {
        documentNumber,
        paymentDateTime,
        documentTitle,
        payerInfo,
        totalSum: {
            amountWithExplicits,
            currencyCode,
        },
        status,
        receipts,
        invoices,
    } = props

    const intl = useIntl()

    let statusMessage = intl.formatMessage({ id: 'MultiPayment.status.DONE' })
    if (status === MultiPaymentStatusType.Processing) {
        statusMessage = intl.formatMessage({ id: 'MultiPayment.status.PROCESSING' })
    } else if (status === MultiPaymentStatusType.Error) {
        statusMessage = intl.formatMessage({ id: 'MultiPayment.status.ERROR' })
    }
    let statusColor = STATUS_SUCCESS_COLOR
    if (status === MultiPaymentStatusType.Processing) {
        statusColor = STATUS_PROCESSING_COLOR
    } else if (status === MultiPaymentStatusType.Error) {
        statusColor = STATUS_ERROR_COLOR
    }
    const payerTitle = intl.formatMessage({ id: 'acquiringReceipt.title' })

    const containerRef = useRef(null)
    useEffect(() => {
        if (containerRef.current) {
            createWrappedPdf({ fileName: `Receipt_${documentNumber}`, element: containerRef.current })
        }
    }, [containerRef, documentNumber])
    return (
        <Row style={SCROLL_BOX_STYLE} justify='center'>
            <Col>
                <PageWrapper ref={containerRef}>
                    <Row>
                        <Col span={24}>
                            <Row>
                                <Col span={12}>
                                    <Typography.Text type='secondary'>
                                        {documentNumber}
                                    </Typography.Text>
                                </Col>
                                <Col span={12} style={{ textAlign: 'right' }}>
                                    <Typography.Text>
                                        {dayjs(paymentDateTime).local().format('DD.MM.YYYY, HH:mm')}
                                    </Typography.Text>
                                </Col>
                            </Row>
                        </Col>
                        <Col span={24}>
                            <Typography.Title level={4} className='receiptTitle'>
                                {documentTitle}
                            </Typography.Title>
                        </Col>
                        {
                            receipts && receipts.length ? <Col span={24} className='payerTitle'>
                                <Typography.Text strong>{payerTitle}</Typography.Text>
                            </Col> : ''
                        }
                        <Col span={24} className='payerInfo'>
                            <Row gutter={[0, 8]}>{payerInfo.map((row, index) => <InfoRow row={row} key={index}/>)}</Row>
                        </Col>
                        {
                            receipts && receipts.map((section, index) => (
                                <ReceiptSection section={section} currencyCode={currencyCode} key={`receipt${index}`}/>
                            ))
                        }
                        {
                            invoices && invoices.map((section, index) => (
                                <InvoiceSection section={section} currencyCode={currencyCode} key={`invoice${index}`}/>
                            ))
                        }
                    </Row>
                    <Row>
                        <Col span={24} className='moneyContainer'>
                            <Typography.Title level={4}>
                                <Money amount={amountWithExplicits} currencyCode={currencyCode}/>
                            </Typography.Title>
                        </Col>
                    </Row>
                    <Row justify='center'>
                        <Typography.Title style={{ color: statusColor, textTransform: 'uppercase' }} level={4}>
                            {statusMessage}
                        </Typography.Title>
                    </Row>
                </PageWrapper>
            </Col>
        </Row>
    )
}
