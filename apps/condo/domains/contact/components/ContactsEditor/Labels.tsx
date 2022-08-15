import React from 'react'
import { Col, Typography } from 'antd'

interface ILabelsProps {
    left: React.ReactNode,
    right?: React.ReactNode,
}

const LABELS_COL_STYLE = { marginTop: '24px' }

export const Labels: React.FC<ILabelsProps> = ({ left, right }) => (
    <>
        <Col span={10} style={LABELS_COL_STYLE}>
            <Typography.Text type='secondary'>
                {left}
            </Typography.Text>
        </Col>
        <Col span={10} style={LABELS_COL_STYLE}>
            <Typography.Text type='secondary'>
                {right}
            </Typography.Text>
        </Col>
        <Col span={2} style={LABELS_COL_STYLE}>
        </Col>
        <Col span={2} style={LABELS_COL_STYLE}>
        </Col>
    </>
)