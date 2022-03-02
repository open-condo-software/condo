import React from 'react'
import Head from 'next/head'
import Big from 'big.js'
import { Row, Typography, Col, Space } from 'antd'
import { useIntl } from '@core/next/intl'
import { Button } from '@condo/domains/common/components/Button'
import { Container } from './Layout'
import { MoneyBlock } from './MoneyBlock'

type PaymentInfo = {
    amountWithoutExplicitFee: string,
    currencyCode: string,
    explicitFee?: string,
    explicitServiceCharge?: string,
}


interface PayConfirmScreenProps {
    onConfirm: React.MouseEventHandler<HTMLElement>
    paymentInfo: PaymentInfo,
}

const PayConfirmScreen: React.FC<PayConfirmScreenProps> = ({
    onConfirm,
    paymentInfo: { amountWithoutExplicitFee, currencyCode, explicitFee, explicitServiceCharge },
}) => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'pages.paymentConfirm.PageTitle' })
    const PayLabel = intl.formatMessage({ id: 'pay' })
    const VerifyAmountMessage = intl.formatMessage({ id: 'pages.paymentConfirm.VerifyPaymentAmount' })

    const totalAmount = Big(amountWithoutExplicitFee).plus(explicitFee || '0').plus(explicitServiceCharge || '0').toString()
    const formattedTotal = intl.formatNumber(totalAmount, {
        style: 'currency',
        currency: currencyCode,
    })
    const PayMessage = `${PayLabel} ${formattedTotal}`

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <Container>
                <Row gutter={[0, 40]}>
                    <Col span={24}>
                        <Typography.Title level={2}>
                            {VerifyAmountMessage}
                        </Typography.Title>
                    </Col>
                    <Col span={24}>
                        <Space size={24} direction={'vertical'}>
                            <MoneyBlock
                                titleDescriptor={{ id: 'pay' }}
                                amount={amountWithoutExplicitFee}
                                currencyCode={currencyCode}
                            />
                            <MoneyBlock
                                titleDescriptor={{ id: 'ServiceCharge' }}
                                amount={explicitServiceCharge || '0'}
                                currencyCode={currencyCode}
                            />
                            <MoneyBlock
                                titleDescriptor={{ id: 'Fee' }}
                                amount={explicitFee || '0'}
                                currencyCode={currencyCode}
                                hideOnZero
                            />
                        </Space>
                    </Col>
                </Row>
                <Button key={'submit'} type={'sberPrimary'} onClick={onConfirm} size={'large'} style={{ width: '100%' }}>
                    {PayMessage}
                </Button>
            </Container>
        </>
    )
}

export default PayConfirmScreen
