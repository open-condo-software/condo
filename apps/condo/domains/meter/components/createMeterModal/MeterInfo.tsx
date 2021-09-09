import { Col, Form, Input, Row } from 'antd'
import React from 'react'
import { IMeterResourceUIState } from '../../utils/clientSchema/MeterResource'

type MeterInfoProps = {
    resource: IMeterResourceUIState
}

export const MeterInfo = ({ resource }: MeterInfoProps) => {
    return (
        <Row gutter={[0, 20]}>
            <Col span={24}>
                <Col span={24}>
                    <Form.Item
                        label={'Лицевой счет'}
                        name='account'
                        required={true}
                    >
                        <Input />
                    </Form.Item>
                </Col>
                <Form.Item
                    label={'Номер счетчика'}
                    name='number'
                    required={true}
                >
                    <Input />
                </Form.Item>
            </Col>
            <Col span={24}>
                <Form.Item
                    label={'Место установки счетчика'}
                    name='place'
                >
                    <Input />
                </Form.Item>
            </Col>
        </Row>
    )
}