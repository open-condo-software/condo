import { Row, Typography, Col, Space } from 'antd'
import Big from 'big.js'
import Head from 'next/head'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import { Button } from '@condo/domains/common/components/Button'

import { Container } from './Layout'
import { MoneyBlock } from './MoneyBlock'

import type { MessageDescriptor } from 'react-intl'


export type BlockType = {
    descriptor: MessageDescriptor
    amount: string
    hideOnZero?: boolean
}


interface PayConfirmScreenProps {
    onConfirm: React.MouseEventHandler<HTMLElement>
    currencyCode: string
    parts: Array<BlockType>
}

const PayConfirmScreen: React.FC<PayConfirmScreenProps> = ({
    onConfirm,
    currencyCode,
    parts,
}) => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'pages.paymentConfirm.PageTitle' })
    const PayLabel = intl.formatMessage({ id: 'pay' })
    const VerifyAmountMessage = intl.formatMessage({ id: 'pages.paymentConfirm.VerifyPaymentAmount' })

    const totalAmount = parts
        .reduce((acc, cur) => acc.plus(cur.amount), Big(0))
        .toString()

    const formattedTotal = intl.formatNumber(parseFloat(totalAmount), {
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
                        <Space size={24} direction='vertical'>
                            {
                                parts.map((part, index) => {
                                    return <MoneyBlock
                                        key={index}
                                        titleDescriptor={part.descriptor}
                                        amount={part.amount}
                                        currencyCode={currencyCode}
                                        hideOnZero={part.hideOnZero || false}
                                    />
                                })
                            }
                        </Space>
                    </Col>
                </Row>
                <Button key='submit' type='sberPrimary' onClick={onConfirm} size='large' style={{ width: '100%' }}>
                    {PayMessage}
                </Button>
            </Container>
        </>
    )
}

export default PayConfirmScreen
