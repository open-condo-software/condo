import Icon from '@ant-design/icons'
import React from 'react'

import { Services } from '@open-condo/icons'


const BarMiniAppsIconSVG: React.FC = () => <Services size='medium' />

export const BarMiniAppsIcon: React.FC = (props) => {
    return (
        <Icon component={BarMiniAppsIconSVG} {...props}/>
    )
}
