import React from 'react'
import { Col, Typography } from 'antd'
import { fontSizes } from '@condo/domains/common/constants/style'
import { useLayoutContext } from './LayoutContext'

interface IPageFieldRowProps {
    title: string
    highlight?: boolean
    children: React.ReactNode
    labelSpan?: number
}

const PageFieldRow: React.FC<IPageFieldRowProps> = (props) => {
    const { isSmall } = useLayoutContext()
    const { labelSpan = 8, title, children, highlight } = props

    return (
        <>
            <Col lg={labelSpan} xs={24}>
                <Typography.Title level={5}>{title}</Typography.Title>
            </Col>
            <Col lg={24 - labelSpan - 1} xs={24} offset={isSmall ? 0 : 1}>
                <Typography.Text type={highlight ? 'success' : null} style={{ fontSize: fontSizes.content }}>
                    {children}
                </Typography.Text>
            </Col>
        </>
    )
}

export { PageFieldRow }
