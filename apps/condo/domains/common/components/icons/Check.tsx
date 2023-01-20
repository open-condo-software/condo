import Icon from '@ant-design/icons'
import React from 'react'

interface CheckIconProps {
    width?: number | string
    height?: number | string
    fill?: string,
}

export const CheckIconSvg: React.FC<CheckIconProps> = () => {
    return (
        <svg width='18' height='18' viewBox='0 0 18 18' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <path d='M14.1454 3.77734L7.01224 10.3949L3.99556 7.17555L2 9.0455L6.8736 14.2465L16 5.78764L14.1454 3.77734Z' fill='url(#gradient)'/>
            <defs>
                <linearGradient id='gradient' x1='2' y1='9.01191' x2='11.3172' y2='15.6172' gradientUnits='userSpaceOnUse'>
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