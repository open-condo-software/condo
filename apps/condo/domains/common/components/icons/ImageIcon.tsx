import Icon from '@ant-design/icons'
import React from 'react'

const ImageIconSVG = () => (
    <svg width='25' height='24' viewBox='0 0 25 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <rect width='24.2887' height='20' fill='none'/>
        <rect x='5.0481' y='5' width='14.1924' height='14' rx='3' stroke='black' strokeWidth='2'/>
        <path d='M15.1924 12C15.1924 13.6456 13.839 15 12.1443 15C10.4496 15 9.09619 13.6456 9.09619 12C9.09619 10.3544 10.4496 9 12.1443 9C13.839 9 15.1924 10.3544 15.1924 12Z' stroke='black' strokeWidth='2'/>
    </svg>
)

export const ImageIcon: React.FC = (props) => {
    return (
        <Icon component={ImageIconSVG} {...props}/>
    )
}