import React from 'react'
import Icon from '@ant-design/icons'

const CrossIconSVG = () => (
    <svg width='12px' height='12px' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <rect x='2.00098' width='14.1465' height='2.82931' transform='rotate(45 2.00098 0)' fill='#222222'/>
        <rect x='12.0039' y='2.00098' width='14.1465' height='2.82931' transform='rotate(135 12.0039 2.00098)' fill='#222222'/>
    </svg>
)

export const CrossIcon: React.FC<React.ComponentProps<typeof Icon>> = (props) => {
    return (
        <Icon component={CrossIconSVG} {...props}/>
    )
}
