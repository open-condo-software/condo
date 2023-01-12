import React from 'react'
import Icon from '@ant-design/icons'
import { OnOff } from '@open-condo/icons'


const BarIncidentIconSVG: React.FC = () => <OnOff size='medium' />

export const BarIncidentIcon: React.FC = (props) => {
    return <Icon component={BarIncidentIconSVG} {...props} />
}
