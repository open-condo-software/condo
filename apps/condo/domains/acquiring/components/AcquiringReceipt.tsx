import styled from '@emotion/styled'
import { Row, Col, Typography }  from 'antd'
import Big from 'big.js'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import React, { useEffect, useRef } from 'react'

dayjs.extend(utc)
import { useIntl } from '@open-condo/next/intl'

import {
    MULTIPAYMENT_DONE_STATUS,
    MULTIPAYMENT_ERROR_STATUS,
    MULTIPAYMENT_PROCESSING_STATUS,
    MULTIPAYMENT_WITHDRAWN_STATUS,
} from '@condo/domains/acquiring/constants/payment'
import { colors } from '@condo/domains/common/constants/style'
import { createWrappedPdf } from '@condo/domains/common/utils/pdf'


type PrintingOption = {
    key: string,
    value: string,
}

type PrintingSection = {
    title?: string,
    info: Array<PrintingOption>
    amount?: string,
}

// This colors are mobile oriented and dont match antd / CRM DS defaults
const STATUS_PROCESSING_COLOR = '#FF9500'
const STATUS_SUCCESS_COLOR = '#4CD174'
const STATUS_ERROR_COLOR = '#FF3B30'

interface IAcquiringReceiptProps {
    paymentDateTime: string,
    documentNumber: string,
    documentTitle: string,
    status: MULTIPAYMENT_DONE_STATUS | MULTIPAYMENT_ERROR_STATUS | MULTIPAYMENT_PROCESSING_STATUS | MULTIPAYMENT_WITHDRAWN_STATUS,
    totalSum: {
        amountWithExplicits: string,
        currencyCode: string,
        explicitFee?: string,
        explicitServiceCharge?: string,
    }
    sections: Array<PrintingSection>
}

interface IReceiptSectionProps {
    section: PrintingSection
    currencyCode: string,
}

interface IInfoRowProps {
    row: PrintingOption
}

const PageWrapper = styled.div`
  width: 335px;
  padding: 20px;
  font-size: 12px;
  
  & .moneyContainer {
    border-top: 1px solid ${colors.lightGrey[5]};
    box-sizing: border-box;
    margin-top: 20px;
    padding: 20px 0;
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

const InfoRow: React.FC<IInfoRowProps> = ({
    row,
}) => {
    return (
        <>
            <Col span={12}>
                <Typography.Text>
                    {row.key}
                </Typography.Text>
            </Col>
            <Col span={12} style={{ textAlign: 'right' }}>
                <Typography.Paragraph style={{ marginBottom: 0 }}>
                    {row.value}
                </Typography.Paragraph>
            </Col>
        </>
    )
}

const ReceiptSection: React.FC<IReceiptSectionProps> = ({
    section,
    currencyCode,
}) => {
    const intl = useIntl()
    const amount = intl.formatNumber(section.amount || '', {
        style: 'currency',
        currency: currencyCode,
    })

    return (
        <Col span={24}>
            <Row gutter={[0, 8]}>
                {
                    section.title && (
                        <Col span={24}>
                            <Typography.Text strong>
                                {section.title}
                            </Typography.Text>
                        </Col>
                    )
                }
                {
                    section.info.map((row, index) => (
                        <InfoRow row={row} key={index}/>
                    ))
                }
                {
                    section.amount && (
                        <Col span={24} style={{ textAlign: 'right' }}>
                            <Typography.Title level={5}>
                                {amount}
                            </Typography.Title>
                        </Col>
                    )
                }
            </Row>
        </Col>
    )
}

export const AcquiringReceipt: React.FC<IAcquiringReceiptProps> = (props) => {
    const {
        documentNumber,
        paymentDateTime,
        documentTitle,
        totalSum: {
            amountWithExplicits,
            currencyCode,
            explicitFee,
            explicitServiceCharge,
        },
        status,
        sections,
    } = props

    const intl = useIntl()
    const IncludingFeeMessage = intl.formatMessage({ id: 'IncludingFee' })
    const IncludingServiceChargeMessage = intl.formatMessage({ id: 'IncludingServiceCharge' })

    const moneyAmount = intl.formatNumber(amountWithExplicits, {
        style: 'currency',
        currency: currencyCode,
    })
    const feeAmount = intl.formatNumber(explicitFee || '', {
        style: 'currency',
        currency: currencyCode,
    })

    const chargeAmount = intl.formatNumber(explicitServiceCharge || '', {
        style: 'currency',
        currency: currencyCode,
    })

    const isPositiveFee = Big(explicitFee || '0').gt(0)
    const isPositiveCharge = Big(explicitServiceCharge || '0').gt(0)

    let statusMessage = intl.formatMessage({ id: 'MultiPayment.status.DONE' })
    if (status === MULTIPAYMENT_PROCESSING_STATUS || status === MULTIPAYMENT_WITHDRAWN_STATUS) {
        // NOTE: LOGICAL "WITHDRAWN" = UI "PROCESSING"
        statusMessage = intl.formatMessage({ id: 'MultiPayment.status.PROCESSING' })
    } else if (status === MULTIPAYMENT_ERROR_STATUS) {
        statusMessage = intl.formatMessage({ id: 'MultiPayment.status.ERROR' })
    }
    let statusColor = STATUS_SUCCESS_COLOR
    if (status === MULTIPAYMENT_PROCESSING_STATUS || status === MULTIPAYMENT_WITHDRAWN_STATUS) {
        statusColor = STATUS_PROCESSING_COLOR
    } else if (status === MULTIPAYMENT_ERROR_STATUS) {
        statusColor = STATUS_ERROR_COLOR
    }

    const containerRef = useRef(null)
    useEffect(() => {
        if (containerRef.current) {
            createWrappedPdf({ fileName: `Receipt_${documentNumber}`, element: containerRef.current })
        }
    }, [containerRef, documentNumber])
    return (
        <PageWrapper ref={containerRef}>
            <Row gutter={[0, 20]}>
                <Col span={24}>
                    <Row justify='space-between'>
                        <Typography.Text type='secondary'>
                            {documentNumber}
                        </Typography.Text>
                        <Typography.Text>
                            {dayjs(paymentDateTime).local().format('DD MMMM YYYY, HH:mm')}
                        </Typography.Text>
                    </Row>
                </Col>
                <Col span={24}>
                    <Typography.Title level={4}>
                        {documentTitle}
                    </Typography.Title>
                </Col>
                {
                    sections.map((section, index) => (
                        <ReceiptSection section={section} currencyCode={currencyCode} key={index}/>
                    ))
                }
            </Row>
            <Row>
                <Col span={24} className='moneyContainer'>
                    <Typography.Title level={4}>
                        {moneyAmount}
                    </Typography.Title>
                    {
                        isPositiveFee && (
                            <Typography.Text>
                                {IncludingFeeMessage} {feeAmount}
                            </Typography.Text>
                        )
                    }
                    {
                        isPositiveCharge && (
                            <Typography.Text>
                                {IncludingServiceChargeMessage} {chargeAmount}
                            </Typography.Text>
                        )
                    }
                </Col>
            </Row>
            <Row justify='center'>
                <Typography.Title style={{ color: statusColor, textTransform: 'uppercase' }} level={4}>
                    {statusMessage}
                </Typography.Title>
            </Row>
        </PageWrapper>
    )
}