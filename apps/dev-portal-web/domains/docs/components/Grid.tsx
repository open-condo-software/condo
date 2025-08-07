import { Row, Col } from 'antd'
import React from 'react'

import { useContainerSize } from '@open-condo/ui/dist/hooks'

import type { RowProps } from 'antd'


type GridProps = {
    children: React.ReactNode
}

const GAP = 32
const ROW_GUTTER: RowProps['gutter'] = [GAP, GAP]
const MIN_COL_WIDTH = 350
const MIN_COLS = 1
const MAX_COLS = 4

function getColsAmount (width: number): number {
    const fitCols = Math.floor((width + GAP) / (MIN_COL_WIDTH + GAP))
    return Math.min(MAX_COLS, Math.max(MIN_COLS, fitCols))
}

export const Grid = ({ children }: GridProps): React.ReactElement => {
    const [{ width }, setRef] = useContainerSize()
    const cols = getColsAmount(width)
    const colSpan = 24 / cols
    return (
        <Row gutter={ROW_GUTTER} ref={setRef}>
            {React.Children.map(children, (child, index) => (
                <Col span={colSpan} key={index}>
                    {child}
                </Col>
            ))}
        </Row>
    )
}