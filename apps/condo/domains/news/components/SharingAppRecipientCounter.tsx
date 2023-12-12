import { Col, Row } from 'antd'
import sumBy from 'lodash/sumBy'
import React, { CSSProperties } from 'react'

import { Card, Space, Typography } from '@open-condo/ui'

import { Counter } from './RecipientCounter'

const styleMaxWidth: CSSProperties = { maxWidth: '500px' }

type SharingAppRecipientCounterProps = {
    name: string,
    recipients: { name: string, recipients: number }[]
}

export const SharingAppRecipientCounter: React.FC<SharingAppRecipientCounterProps> = ({ name, recipients }) => {

    return (
        <div style={styleMaxWidth}>
            <Card>
                <Space direction='vertical' size={24} width='100%'>
                    <Typography.Text>Mailing to: <b>{name}</b></Typography.Text>
                    <Col xs={24}>
                        <Row align='top' justify='space-evenly'>
                            <Col>
                                <Counter
                                    label='selected'
                                    value={recipients.length}
                                />
                            </Col>
                            <Col>
                                <Counter
                                    label='total recipients'
                                    value={sumBy(recipients, 'recipients')}
                                />
                            </Col>
                        </Row>
                    </Col>
                </Space>
            </Card>
        </div>
    )
}