import Icon from '@ant-design/icons'
import React from 'react'

import { LayoutList } from '@open-condo/icons'


const BarTicketIconSVG: React.FC = () => <LayoutList size='medium' />

export const BarTicketIcon: React.FC = (props) => {
    return (
        <Icon component={BarTicketIconSVG} {...props}/>
    )
}
