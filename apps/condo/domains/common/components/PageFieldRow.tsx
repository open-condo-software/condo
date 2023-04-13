import { Col, Row, Typography } from 'antd'
import { EllipsisConfig } from 'antd/es/typography/Base'
import { WhiteSpaceProperty } from 'csstype'
import React, { useMemo } from 'react'

import { fontSizes } from '@condo/domains/common/constants/style'

import { useLayoutContext } from './LayoutContext'

interface IPageFieldRowProps {
    title: string
    highlight?: boolean
    children: React.ReactNode
    labelSpan?: number
    ellipsis?: boolean | EllipsisConfig
    lineWrapping?: WhiteSpaceProperty,
}

const PageFieldRow: React.FC<IPageFieldRowProps> = (props) => {
    const { breakpoints } = useLayoutContext()
    const { labelSpan = 6, title, children, highlight, ellipsis, lineWrapping } = props

    const textStyle = useMemo(() => ({ fontSize: fontSizes.content, whiteSpace: lineWrapping || 'normal' }), [lineWrapping])

    return (
        <Col span={24}>
            <Row gutter={[16, 0]}>
                <Col md={labelSpan} xs={24}>
                    <Typography.Paragraph style={{ fontSize: fontSizes.content }} ellipsis={ellipsis} title={title}>{title}</Typography.Paragraph>
                </Col>
                <Col md={24 - labelSpan - 1} xs={24} offset={!breakpoints.TABLET_LARGE ? 0 : 1}>
                    <Typography.Text type={highlight ? 'success' : null} style={textStyle}>
                        {children}
                    </Typography.Text>
                </Col>
            </Row>
        </Col>
    )
}

export { PageFieldRow }