import Icon from '@ant-design/icons'
import React from 'react'

import { Building } from '@open-condo/icons'


const BarPropertyIconSVG: React.FC = () => <Building size='medium' />

export const BarPropertyIcon: React.FC = (props) => {
    return (
        <Icon component={BarPropertyIconSVG} {...props}/>
    )
}
