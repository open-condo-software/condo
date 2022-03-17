import React from 'react'
import { Col, Row } from 'antd'

export const CardsContainer: React.FC = ({ children }) => {
    return (
        <Row gutter={[40, 40]}>
            { React.Children.map(children, (child) => {
                return (
                    <Col span={8}>
                        {child}
                    </Col>
                )
            }) }
        </Row>
    )
}