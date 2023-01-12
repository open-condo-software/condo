import Icon from '@ant-design/icons'
import React from 'react'
import { Bill } from '@open-condo/icons'


const BarBillingIconSVG: React.FC = () => <Bill size='medium' />

export const BarBillingIcon: React.FC = (props) => {
    return (
        <Icon component={BarBillingIconSVG} {...props}/>
    )
}
