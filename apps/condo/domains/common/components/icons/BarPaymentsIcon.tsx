import Icon from '@ant-design/icons'
import React from 'react'
import { Wallet } from '@open-condo/icons'


const BarPaymentsIconSVG: React.FC = () => <Wallet size='medium' />

export const BarPaymentsIcon: React.FC = (props) => {
    return (
        <Icon component={BarPaymentsIconSVG} {...props}/>
    )
}
