import { CardProps, Col, Row, Typography } from 'antd'
import React from 'react'
import { Card } from './Card'

type SettingCardProps = Pick<CardProps, 'onClick'> & {
    title: string
    disabled?: boolean
}

export const SettingCard: React.FC<SettingCardProps> = ({ title, children, onClick, disabled }) => {
    return (
        <Card style={{ height: 216 }} onClick={onClick} disabled={disabled}>
            <Row gutter={[0, 12]}>
                <Col span={24}>
                    <Typography.Title level={5} ellipsis>
                        {title}
                    </Typography.Title>
                </Col>
                <Col span={24}>
                    <Typography.Paragraph ellipsis={{ rows: 6 }}>
                        {children}
                    </Typography.Paragraph>
                </Col>
            </Row>
        </Card>
    )
}