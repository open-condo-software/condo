import React, { CSSProperties } from 'react'
import { Col, Row, Typography } from 'antd'

interface ISectionProps {
    title: string
    hideTitle?: boolean
}

const SECTION_TITLE_STYLES: CSSProperties = {
    fontWeight: 700,
}

export const Section: React.FC<ISectionProps> = ({ title, hideTitle, children }) => {
    return (
        <Row gutter={[0, 24]}>
            {
                !hideTitle && <Col span={24}>
                    <Typography.Title level={4} style={SECTION_TITLE_STYLES}>{title}</Typography.Title>
                </Col>
            }
            <Col span={24}>
                {children}
            </Col>
        </Row>
    )
}