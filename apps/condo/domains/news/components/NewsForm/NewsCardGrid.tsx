import { Row, Col } from 'antd'
import React from 'react'

import { useContainerSize } from '@open-condo/ui/dist/hooks'

import type { RowProps } from 'antd'

type NewsCardGridProps = {
    children: React.ReactNode
    minColWidth?: number
    gap?: number
    minCols?: number
    maxCols?: number
}

const GAP = 32
const ROW_GUTTER: RowProps['gutter'] = [GAP, GAP]
const MIN_COL_WIDTH = 350
const MIN_COLS = 1
const MAX_COLS = 4

function getColsAmount (
    width: number,
    minColWidth: number = MIN_COL_WIDTH,
    gap: number = GAP,
    minCols: number = MIN_COLS,
    maxCols: number = MAX_COLS,
): number {
    const fitCols = Math.floor((width + gap) / (minColWidth + gap))
    return Math.min(maxCols, Math.max(minCols, fitCols))
}

export const NewsCardGrid: React.FC<NewsCardGridProps> = ({ 
    children, 
    minColWidth,
    gap,
    minCols,
    maxCols,
}) => {
    const [{ width }, setRef] = useContainerSize()
    const cols = getColsAmount(width, minColWidth, gap, minCols, maxCols)
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