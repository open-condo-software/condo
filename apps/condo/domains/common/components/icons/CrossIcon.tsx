import Icon from '@ant-design/icons'
import React from 'react'

const CrossIconSVG = () => (
    <svg width='18' height='18' viewBox='0 0 18 18' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <rect x='5.66667' y='3.99991' width='11.7849' height='2.35699' transform='rotate(45 5.66667 3.99991)' fill='#222222'/>
        <rect x='14' y='5.66765' width='11.7849' height='2.35699' transform='rotate(135 14 5.66765)' fill='#222222'/>
    </svg>
)

export const CrossIcon: React.FC<React.ComponentProps<typeof Icon>> = (props) => {
    return (
        <Icon component={CrossIconSVG} {...props}/>
    )
}
