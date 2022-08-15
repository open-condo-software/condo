import React from 'react'
import Icon from '@ant-design/icons'

const ChevronIconSVG = () => (
    <svg width='20' height='20' viewBox='0 0 15 15' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <path d='M10.243 4.242 6 8.484 1.757 4.242' stroke='currentColor' strokeWidth='2'/>
    </svg>
)

export const ChevronIcon: React.FC = (props) => {
    return (
        <Icon component={ChevronIconSVG} {...props}/>
    )
}

