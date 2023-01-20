import Icon from '@ant-design/icons'
import React from 'react'

const ExpandIconSVG = () => (
    <svg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <mask id='path-1-inside-1_845_4880' fill='white'>
            <path d='M0 0H12V12H0V0Z'/>
        </mask>
        <path d='M0 0V-3.5H-2V0H0ZM12 0H14V-3.5H12V0ZM12 12V14H14V12H12ZM0 12H-2V14H0V12ZM0 3.5H12V-3.5H0V3.5ZM10 0V12H14V0H10ZM12 10H0V14H12V10ZM2 12V0H-2V12H2Z' fill='#222222' mask='url(#path-1-inside-1_845_4880)'/>
    </svg>
)

export const ExpandIcon: React.FC = (props) => {
    return (
        <Icon component={ExpandIconSVG} {...props}/>
    )
}