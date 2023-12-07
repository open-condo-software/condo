import { Row, Col, Divider } from 'antd'
import React from 'react'

import { Typography } from '@open-condo/ui'

import type { RowProps } from 'antd'

const SECTION_ROW_GUTTER: RowProps['gutter'] = [80, 80]
const TITLE_ROW_GUTTER: RowProps['gutter'] = [40, 40]
const FULL_COL_SPAN = 24

export const Section: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <Row gutter={SECTION_ROW_GUTTER}>
            {React.Children.map(children, (child) => (
                <Col span={FULL_COL_SPAN}>
                    {child}
                </Col>
            ))}
        </Row>
    )
}

const SubSectionDivider: React.FC<{ title: string }> = ({ title }) => {
    return (
        <Divider orientation='left' orientationMargin={0}>
            <Typography.Title level={3}>{title}</Typography.Title>
        </Divider>
    )
}

export const SubSection: React.FC<{ children: React.ReactNode, title: string }> = ({ title, children }) => {
    return (
        <Row gutter={TITLE_ROW_GUTTER}>
            <Col span={FULL_COL_SPAN}>
                <SubSectionDivider title={title}/>
            </Col>
            <Col span={FULL_COL_SPAN}>
                {children}
            </Col>
        </Row>
    )
}