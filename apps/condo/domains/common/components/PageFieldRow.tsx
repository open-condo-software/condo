import { Col, Row, RowProps } from 'antd'
import { EllipsisConfig } from 'antd/es/typography/Base'
import React from 'react'

import { Typography, TypographyTextProps } from '@open-condo/ui'

import { useLayoutContext } from './LayoutContext'


interface IPageFieldRowProps {
    title: string
    children: React.ReactNode
    labelSpan?: number
    ellipsis?: boolean | EllipsisConfig
    lineWrapping?: TypographyTextProps['lineWrapping']
    align?: RowProps['align']
}

const HORIZONTAL_GUTTER: RowProps['gutter'] = [16, 0]
const VERTICAL_GUTTER: RowProps['gutter'] = [0, 16]

const PageFieldRow: React.FC<IPageFieldRowProps> = (props) => {
    const { breakpoints } = useLayoutContext()
    const { labelSpan = 6, title, children, ellipsis, lineWrapping, align } = props

    return (
        <Col span={24}>
            <Row gutter={!breakpoints.TABLET_LARGE ? VERTICAL_GUTTER : HORIZONTAL_GUTTER} align={align}>
                <Col md={labelSpan} xs={24}>
                    <Typography.Paragraph ellipsis={ellipsis} title={title} type='secondary'>{title}</Typography.Paragraph>
                </Col>
                <Col md={24 - labelSpan - 1} xs={24} offset={!breakpoints.TABLET_LARGE ? 0 : 1}>
                    <Typography.Text lineWrapping={lineWrapping}>
                        {children}
                    </Typography.Text>
                </Col>
            </Row>
        </Col>
    )
}

export { PageFieldRow }