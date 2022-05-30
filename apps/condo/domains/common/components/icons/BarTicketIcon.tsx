import React from 'react'
import Icon from '@ant-design/icons'

interface BarTicketIconProps {
    viewBox?: string
}

const BarTicketIconSVG: React.FC<BarTicketIconProps> = ({ viewBox = '0 0 20 20' }) => {
    return (
        <svg width="20" height="20" fill="none" viewBox={viewBox} xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M0 4c0-2.2091 1.7909-4 4-4h12c2.2091 0 4 1.7909 4 4v12c0 2.2091-1.7909 4-4 4H4c-2.2091 0-4-1.7909-4-4V4Zm4-2c-1.1046 0-2 .8954-2 2v2h16V4c0-1.1046-.8954-2-2-2H4ZM2 8v8c0 1.1046.8954 2 2 2h12c1.1046 0 2-.8954 2-2V8H2Zm2 3c0-.5523.4477-1 1-1h10c.5523 0 1 .4477 1 1s-.4477 1-1 1H5c-.5523 0-1-.4477-1-1Zm0-7c0-.5523.4477-1 1-1s1 .4477 1 1-.4477 1-1 1-1-.4477-1-1Zm4-1c-.5523 0-1 .4477-1 1s.4477 1 1 1 1-.4477 1-1-.4477-1-1-1Zm2 1c0-.5523.4477-1 1-1s1 .4477 1 1-.4477 1-1 1-1-.4477-1-1Zm-5 9c-.5523 0-1 .4477-1 1s.4477 1 1 1h8c.5523 0 1-.4477 1-1s-.4477-1-1-1H5Z" fill="currentColor"/>
        </svg>
    )
}

export const BarTicketIcon: React.FC = (props) => {
    return (
        <Icon component={BarTicketIconSVG} {...props}/>
    )
}
