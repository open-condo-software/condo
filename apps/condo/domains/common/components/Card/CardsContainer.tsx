import React, { useEffect, useState } from 'react'
import { Col, Row } from 'antd'
import { Breakpoint } from 'antd/es/_util/responsiveObserve'
import { Gutter } from 'antd/es/grid/row'

import { useLayoutContext } from '../LayoutContext'

export type CardsPerRowType = 1 | 2 | 3 | 4 | 5

interface CardsContainerProps {
    cardsPerRow?: CardsPerRowType
    autosize?: boolean
}

const getColSpan = (breakpoints: Partial<Record<Breakpoint, boolean>>) => {
    if (breakpoints.xxl) return 8
    if (breakpoints.xl) return 12
    return 24
}

const CONTAINER_GUTTER: Gutter | [Gutter, Gutter] = [40, 40]

// todo Use it in miniapps too
export const CardsContainer: React.FC<CardsContainerProps> = ({ cardsPerRow = 3, autosize = false, children }) => {
    const [colSpan, setColSpan] = useState<number>(24 / cardsPerRow)
    const { breakpoints } = useLayoutContext()

    useEffect(() => {
        if (!autosize) return
        setColSpan(getColSpan(breakpoints))
    }, [autosize, breakpoints])

    return (
        <Row gutter={CONTAINER_GUTTER}>
            {
                React.Children.map(children, (child, index) => {
                    return (
                        <Col span={colSpan} key={index}>
                            {child}
                        </Col>
                    )
                })
            }
        </Row>
    )
}
