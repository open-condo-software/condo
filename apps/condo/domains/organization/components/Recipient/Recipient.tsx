import { useIntl } from '@core/next/intl'
import { Row, Col, Typography, Alert } from 'antd'
import React from 'react'

const RecipientRow = ({ recipientTitle, recipientValue }) => {
    const intl = useIntl()
    return (
        <>
            <Col span={6}>
                <Typography.Text
                    style={{ fontSize: '16px' }}
                >{recipientTitle}</Typography.Text>
            </Col>
            <Col span={18}>
                <Typography.Text
                    style={{ fontSize: '16px' }}
                >{recipientValue}</Typography.Text>
            </Col>
        </>
    )
}

export const Recipient = (props) => {
    const intl = useIntl()
    return (
        <Row gutter={[0, 24]}>
            <Col span={6}>
                <Typography.Text
                    strong={true}
                    style={{ fontSize: '20px' }}
                >{'Название'}</Typography.Text>
            </Col>
            <Col span={18}>
                <Typography.Text
                    strong={true}
                    style={{ fontSize: '20px' }}
                >{'ООО «Управление ЖКХ Инвест»'}</Typography.Text>
            </Col>
            <Col span={6}>
                <Typography.Text
                    style={{ fontSize: '16px' }}
                >{'ИНН'}</Typography.Text>
            </Col>
            <Col span={18}>
                <Typography.Text
                    style={{ fontSize: '16px' }}
                >{'00023432423'}</Typography.Text>
            </Col>
            <Col span={6}>
                <Typography.Text
                    style={{ fontSize: '16px' }}
                >{'ИНН'}</Typography.Text>
            </Col>
            <Col span={18}>
                <Typography.Text
                    style={{ fontSize: '16px' }}
                >{'00023432423'}</Typography.Text>
            </Col>
            <Col span={6}>
                <Typography.Text
                    style={{ fontSize: '16px' }}
                >{'ИНН'}</Typography.Text>
            </Col>
            <Col span={18}>
                <Typography.Text
                    style={{ fontSize: '16px' }}
                >{'00023432423'}</Typography.Text>
            </Col>
            <Col span={6}>
                <Typography.Text
                    style={{ fontSize: '16px' }}
                >{'ИНН'}</Typography.Text>
            </Col>
            <Col span={18}>
                <Typography.Text
                    style={{ fontSize: '16px' }}
                >{'00023432423'}</Typography.Text>
            </Col>
        </Row>
    )
}
