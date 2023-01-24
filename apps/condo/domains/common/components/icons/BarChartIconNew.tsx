import Icon from '@ant-design/icons'
import React from 'react'

import { BarChartVertical } from '@open-condo/icons'

const BarChartIconNewSVG: React.FC = () => <BarChartVertical size='medium' />

export const BarChartIconNew: React.FC = (props) => {
    return (
        <Icon component={BarChartIconNewSVG} {...props}/>
    )
}
