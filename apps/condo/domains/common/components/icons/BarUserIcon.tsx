import Icon from '@ant-design/icons'
import React from 'react'

import { Contacts } from '@open-condo/icons'


const EmployeeIconSVG: React.FC = () => <Contacts size='medium' />

export const BarUserIcon: React.FC = (props) => {
    return (
        <Icon component={EmployeeIconSVG} {...props}/>
    )
}
