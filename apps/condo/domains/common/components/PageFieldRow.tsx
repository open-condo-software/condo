import React from 'react'
import { Col, Typography } from 'antd'

interface IPageFieldRowProps {
    title: string
    highlight?: boolean
    children: React.ReactNode
    labelSpan?: number
}

const PageFieldRow: React.FC<IPageFieldRowProps> = (props) => {
    const { labelSpan = 8, title, children, highlight } = props
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

export { PageFieldRow }