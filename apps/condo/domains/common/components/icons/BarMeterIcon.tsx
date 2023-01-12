import Icon from '@ant-design/icons'
import React from 'react'
import { Meters } from '@open-condo/icons'

const BarMeterIconSVG: React.FC = () => <Meters size='medium' />

export const BarMeterIcon: React.FC = (props) => {
    return (
        <Icon component={BarMeterIconSVG} {...props}/>
    )
}
