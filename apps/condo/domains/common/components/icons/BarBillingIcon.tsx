import React from 'react'
import Icon from '@ant-design/icons'

interface BarBillingIconProps {
    viewBox?: string
}

const BarBillingIconSVG: React.FC<BarBillingIconProps> = ({ viewBox = '0 0 20 20' }) => {
    return (
        <svg width="20" height="20" fill="none" viewBox={viewBox} xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M4 2h12c1.1046 0 2 .8954 2 2v5H2V4c0-1.1046.8954-2 2-2Zm-2 9v5c0 1.1046.8954 2 2 2h12c1.1046 0 2-.8954 2-2v-5H2ZM0 4c0-2.2091 1.7909-4 4-4h12c2.2091 0 4 1.7909 4 4v12c0 2.2091-1.7909 4-4 4H4c-2.2091 0-4-1.7909-4-4V4Zm7 2c0-.5523.4477-1 1-1h4c.5523 0 1 .4477 1 1s-.4477 1-1 1H8c-.5523 0-1-.4477-1-1Zm1 7c-.5523 0-1 .4477-1 1s.4477 1 1 1h4c.5523 0 1-.4477 1-1s-.4477-1-1-1H8Z" fill="currentColor"/></svg>
    )
}

export const BarBillingIcon: React.FC = (props) => {
    return (
        <Icon component={BarBillingIconSVG} {...props}/>
    )
}
