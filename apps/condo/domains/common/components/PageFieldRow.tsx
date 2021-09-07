import React from 'react'
import { Col, Typography } from 'antd'
import { fontSizes } from '@condo/domains/common/constants/style'

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
            <Col span={labelSpan}>
                <Typography.Text style={{ fontSize: fontSizes.content }}>{title}</Typography.Text>
            </Col>
            <Col span={24 - labelSpan - 1} push={1} style={{ fontSize: fontSizes.content }}>
                <Typography.Text type={highlight ? 'success' : null}>{children}</Typography.Text>
            </Col>
        </>
    )
}

export { PageFieldRow }
