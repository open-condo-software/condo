import Icon from '@ant-design/icons'
import React from 'react'
import { Settings } from '@open-condo/icons'


const BarSettingIconSVG: React.FC = () => <Settings size='medium' />

export const BarSettingIcon: React.FC = (props) => {
    return (
        <Icon component={BarSettingIconSVG} {...props}/>
    )
}
