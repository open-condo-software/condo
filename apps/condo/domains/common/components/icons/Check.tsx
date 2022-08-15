import React from 'react'
import Icon from '@ant-design/icons'

interface CheckIconProps {
    width?: number | string
    height?: number | string
    fill?: string,
}

export const CheckIconSvg: React.FC<CheckIconProps> = ({ width = 14, height = 10 }) => {
    return (
        <svg width={width} height={height} viewBox='0 -2 14 14' xmlns='http://www.w3.org/2000/svg'>
            <path d='M11.574.358 5.234 6.24 2.551 3.378.778 5.04 5.11 9.664l8.112-7.52L11.574.359Z' fill='url(#a)'/>
            <defs>
                <linearGradient id='a' x1='.778' y1='5.011' x2='9.06' y2='10.882' gradientUnits='userSpaceOnUse'>
                    <stop stopColor='#4CD174'/>
                    <stop offset='1' stopColor='#6DB8F2'/>
                </linearGradient>
            </defs>
        </svg>
    )
}

export const CheckIcon: React.FC<CheckIconProps> = (props) => {
    return (
        <Icon component={CheckIconSvg} {...props}/>
    )
}