import Icon from '@ant-design/icons'
import React from 'react'

import { Employee } from '@open-condo/icons'


const BarEmployeeIconSVG: React.FC = () => <Employee size='medium' />

export const BarEmployeeIcon: React.FC = (props) => {
    return (
        <Icon component={BarEmployeeIconSVG} {...props}/>
    )
}
