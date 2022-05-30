import React from 'react'
import Icon from '@ant-design/icons'

interface BarEmployeeIconProps {
    viewBox?: string
}

const BarEmployeeIconSVG: React.FC<BarEmployeeIconProps> = ({ viewBox = '0 0 18 20' }) => {
    return (
        <svg width="18" height="20" fill="none" viewBox={viewBox} xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M9 8c1.6569 0 3-1.3431 3-3 0-1.6568-1.3431-3-3-3S6 3.3432 6 5c0 1.6569 1.3431 3 3 3Zm0 2c2.7614 0 5-2.2386 5-5s-2.2386-5-5-5-5 2.2386-5 5 2.2386 5 5 5Zm-2.0629 3.2623C4.0141 14.0304 2 16.3862 2 19c0 .5523-.4477 1-1 1s-1-.4477-1-1c0-4.5395 4.159-8 9-8s9 3.4605 9 8c0 .5523-.4477 1-1 1s-1-.4477-1-1c0-2.6138-2.014-4.9696-4.937-5.7377l1.765 2.6054a1 1 0 0 1-.1772 1.3201l-3 2.5715a1.0002 1.0002 0 0 1-1.3016 0l-3-2.5715a1 1 0 0 1-.177-1.3201l1.765-2.6054Zm2.063 4.4206-1.6715-1.4326L9 13.783l1.6714 2.4673L9 17.6829Z" fill="currentColor"/>
        </svg>
    )
}

export const BarEmployeeIcon: React.FC = (props) => {
    return (
        <Icon component={BarEmployeeIconSVG} {...props}/>
    )
}
