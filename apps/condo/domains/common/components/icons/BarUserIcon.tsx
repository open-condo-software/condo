import React from 'react'
import Icon from '@ant-design/icons'

interface EmployeeIconProps {
    viewBox?: string
}

const EmployeeIconSVG: React.FC<EmployeeIconProps> = ({ viewBox = '0 0 20 20' }) => {
    return (
        <svg width="20" height="20" fill="none" viewBox={viewBox} xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M13 5c0 1.6569-1.3431 3-3 3S7 6.6569 7 5c0-1.6568 1.3431-3 3-3s3 1.3432 3 3Zm2 0c0 2.7614-2.2386 5-5 5S5 7.7614 5 5s2.2386-5 5-5 5 2.2386 5 5ZM3 19c0-3.1925 3.0044-6 7-6s7 2.8075 7 6c0 .5523.4477 1 1 1s1-.4477 1-1c0-4.5395-4.159-8-9-8s-9 3.4605-9 8c0 .5523.4477 1 1 1s1-.4477 1-1Z" fill="currentColor"/>
        </svg>
    )
}

export const BarUserIcon: React.FC = (props) => {
    return (
        <Icon component={EmployeeIconSVG} {...props}/>
    )
}
