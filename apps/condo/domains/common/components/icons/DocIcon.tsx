import Icon from '@ant-design/icons'
import React from 'react'

const DocIconSVG = () => (
    <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <rect width='24' height='24' fill='#F2F3F7'/>
        <path d='M5 6C5 4.34315 6.34315 3 8 3H16C17.6569 3 19 4.34315 19 6V14.3431C19 15.1388 18.6839 15.9019 18.1213 16.4645L14.4645 20.1213C13.9019 20.6839 13.1388 21 12.3431 21H8C6.34315 21 5 19.6569 5 18V6Z' stroke='black' strokeWidth='2'/>
    </svg>
)

export const DocIcon: React.FC = (props) => {
    return (
        <Icon component={DocIconSVG} {...props}/>
    )
}