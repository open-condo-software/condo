import { Row, Col } from 'antd'
import React, { useMemo } from 'react'

import { useBreakpoints } from '@open-condo/ui/dist/hooks'

import type { RowProps } from 'antd'


type GridProps = {
    children: React.ReactNode
}

const ROW_GUTTER: RowProps['gutter'] = [32, 32]

export const Grid: React.FC<GridProps> = ({ children }) => {
    const { DESKTOP_SMALL } = useBreakpoints()
    const colSpan = useMemo(() => DESKTOP_SMALL ? 12 : 24, [DESKTOP_SMALL])
    return (
        <Row gutter={ROW_GUTTER}>
            {React.Children.map(children, (child, index) => (
                <Col span={colSpan} key={index}>
                    {child}
                </Col>
            ))}
        </Row>
    )
}