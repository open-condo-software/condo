import { Col, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import React, { useEffect, useState } from 'react'

import { ScreenMap } from '@open-condo/ui/dist/hooks'

import { useLayoutContext } from '../LayoutContext'

export type CardsPerRowType = 1 | 2 | 3 | 4 | 5

interface CardsContainerProps {
    cardsPerRow?: CardsPerRowType
    autosize?: boolean
}

const getColSpan = (breakpoints: ScreenMap) => {
    if (breakpoints.DESKTOP_LARGE) return 12
    return 24
}

const CONTAINER_GUTTER: Gutter | [Gutter, Gutter] = [40, 40]

// todo Use it in miniapps too
export const CardsContainer: React.FC<React.PropsWithChildren<CardsContainerProps>> = ({ cardsPerRow = 3, autosize = false, children }) => {
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
