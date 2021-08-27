import React from 'react'
import { Col, Typography } from 'antd'

interface IPageFieldRowProps {
    title: string
    style?: React.CSSProperties
    highlight?: boolean
    children: React.ReactNode
    labelSpan?: number
}

const PageFieldRow: React.FC<IPageFieldRowProps> = ({ labelSpan, title, children, highlight, style }) => {
    return (
        <>
            <Col span={labelSpan} style={{ fontSize: '16px' }}>
                {title}
            </Col>
            <Col span={24 - labelSpan - 1} push={1} style={{ fontSize: '16px' }}>
                <Typography.Text
                    type={highlight ? 'success' : null}
                    style={{ wordWrap: 'break-word' }}
                >
                    {children}
                </Typography.Text>
            </Col>
        </>
    )
}

PageFieldRow.defaultProps = {
    labelSpan: 8,
}

export { PageFieldRow }