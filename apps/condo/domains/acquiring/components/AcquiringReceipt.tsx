import React, { useEffect, useRef } from 'react'
import dayjs from 'dayjs'
import styled from '@emotion/styled'
import { Row, Col, Typography } from 'antd'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)
import { colors } from '@condo/domains/common/constants/style'
import { useIntl } from '@core/next/intl'
import {
    MULTIPAYMENT_DONE_STATUS,
    MULTIPAYMENT_ERROR_STATUS,
    MULTIPAYMENT_PROCESSING_STATUS,
} from '@condo/domains/acquiring/constants/payment'
import { createWrappedPdf } from '@condo/domains/common/utils/pdf'

type PrintingOption = {
    key: string
    value: string
}

// This colors are mobile oriented and dont match antd / CRM DS defaults
const STATUS_PROCESSING_COLOR = '#FF9500'
const STATUS_SUCCESS_COLOR = '#4CD174'
const STATUS_ERROR_COLOR = '#FF3B30'

interface IAcquiringReceiptProps {
    paymentDateTime: string
    documentNumber: string
    documentTitle: string
    status: MULTIPAYMENT_DONE_STATUS | MULTIPAYMENT_ERROR_STATUS | MULTIPAYMENT_PROCESSING_STATUS
    totalSum: {
        amountWithExplicitFee: string
        currencyCode: string
        explicitFee?: string
    }
    info: Array<PrintingOption>
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

const getInfoRow = (row: PrintingOption) => {
    return (
        <>
            <Col span={12}>
                <Typography.Text>{row.key}</Typography.Text>
            </Col>
            <Col span={12} style={{ textAlign: 'right' }}>
                <Typography.Paragraph style={{ marginBottom: 0 }}>{row.value}</Typography.Paragraph>
            </Col>
        </>
    )
}

export const AcquiringReceipt: React.FC<IAcquiringReceiptProps> = (props) => {
    const {
        documentNumber,
        paymentDateTime,
        documentTitle,
        totalSum: { amountWithExplicitFee, currencyCode, explicitFee },
        status,
        info,
    } = props

    const intl = useIntl()
    const IncludingFeeMessage = intl.formatMessage({ id: 'IncludingFee' })

    const moneyAmount = intl.formatNumber(amountWithExplicitFee, {
        style: 'currency',
        currency: currencyCode,
    })
    const feeAmount = intl.formatNumber(explicitFee || '', {
        style: 'currency',
        currency: currencyCode,
    })

    let statusMessage = intl.formatMessage({ id: 'MultiPayment.status.DONE' })
    if (status === MULTIPAYMENT_PROCESSING_STATUS) {
        statusMessage = intl.formatMessage({ id: 'MultiPayment.status.PROCESSING' })
    } else if (status === MULTIPAYMENT_ERROR_STATUS) {
        statusMessage = intl.formatMessage({ id: 'MultiPayment.status.ERROR' })
    }
    let statusColor = STATUS_SUCCESS_COLOR
    if (status === MULTIPAYMENT_PROCESSING_STATUS) {
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
            <Row gutter={[0, 40]}>
                <Col span={24}>
                    <Row justify={'space-between'}>
                        <Typography.Text type={'secondary'}>{documentNumber}</Typography.Text>
                        <Typography.Text>{dayjs(paymentDateTime).local().format('DD MMMM YYYY, HH:mm')}</Typography.Text>
                    </Row>
                </Col>
                <Col span={24}>
                    <Typography.Title level={4}>{documentTitle}</Typography.Title>
                </Col>
                {info.length > 0 && (
                    <Col span={24}>
                        <Row gutter={[20, 20]}>{info.map(getInfoRow)}</Row>
                    </Col>
                )}
            </Row>
            <Row>
                <Col span={24} className={'moneyContainer'}>
                    <Typography.Title level={4}>{moneyAmount}</Typography.Title>
                    {explicitFee && (
                        <Typography.Text>
                            {IncludingFeeMessage} {feeAmount}
                        </Typography.Text>
                    )}
                </Col>
            </Row>
            <Row justify={'center'}>
                <Typography.Title style={{ color: statusColor, textTransform: 'uppercase' }} level={4}>
                    {statusMessage}
                </Typography.Title>
            </Row>
        </PageWrapper>
    )
}
