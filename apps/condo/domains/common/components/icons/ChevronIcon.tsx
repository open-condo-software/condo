import Icon from '@ant-design/icons'
import React from 'react'

const ChevronIconSVG = () => (
    <svg width='18' height='18' viewBox='0 0 18 18' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <path d='M13.6263 6L9 10.4137L4.37367 6L3 7.29314L9 13L15 7.29314L13.6263 6Z' fill='#222222' stroke='#222222' strokeWidth='0.7'/>
    </svg>
)

export const ChevronIcon: React.FC = (props) => {
    return (
        <Icon component={ChevronIconSVG} {...props}/>
    )
}

