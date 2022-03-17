import React from 'react'
import { Col, Row } from 'antd'

export type CardsPerRowType = 1 | 2 | 3 | 4

interface CardsContainerProps {
    cardsPerRow?: CardsPerRowType
}

export const CardsContainer: React.FC<CardsContainerProps> = ({ cardsPerRow = 3, children }) => {
    const colSpan = 24 / cardsPerRow
    return (
        <Row gutter={[40, 40]}>
            { React.Children.map(children, (child) => {
                return (
                    <Col span={colSpan}>
                        {child}
                    </Col>
                )
            }) }
        </Row>
    )
}