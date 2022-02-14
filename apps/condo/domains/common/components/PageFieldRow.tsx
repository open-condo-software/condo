import React from 'react'
import { Col, Row, Typography } from 'antd'
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
    const { labelSpan = 6, title, children, highlight } = props

    return (
        <Col span={24}>
            <Row gutter={[16, 0]}>
                <Col lg={labelSpan} xs={24}>
                    <Typography.Paragraph style={{ fontSize: fontSizes.content }}>{title}</Typography.Paragraph>
                </Col>
                <Col lg={24 - labelSpan - 1} xs={24} offset={isSmall ? 0 : 1}>
                    <Typography.Text type={highlight ? 'success' : null} style={{ fontSize: fontSizes.content }}>
                        {children}
                    </Typography.Text>
                </Col>
            </Row>
        </Col>
    )
}

export { PageFieldRow }