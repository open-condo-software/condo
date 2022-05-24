import React from 'react'
import Icon from '@ant-design/icons'

interface BarPropertyIconProps {
    viewBox?: string
}

const BarPropertyIconSVG: React.FC<BarPropertyIconProps> = ({ viewBox = '0 0 22 22' }) => {
    return (
        <svg width='22' height='22' viewBox={viewBox} fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.244 8.127A2.036 2.036 0 0 1 1.37 5.99a3.93 3.93 0 0 1 1.39-1.25l6.25-3.253a4.311 4.311 0 0 1 3.978 0l6.25 3.256a3.93 3.93 0 0 1 1.39 1.25 2.036 2.036 0 0 1 .127 2.138 2.26 2.26 0 0 1-2.013 1.204H18.5V16h.833a.834.834 0 0 1 0 1.666H2.668a.833.833 0 0 1 0-1.666H3.5V9.334h-.243a2.26 2.26 0 0 1-2.014-1.207ZM5.168 16h2.5V9.334h-2.5V16Zm4.166-6.666V16h3.333V9.334H9.334Zm7.5 0h-2.5V16h2.5V9.334ZM2.72 7.354a.597.597 0 0 0 .538.313h15.485a.597.597 0 0 0 .538-.312.376.376 0 0 0-.02-.417 2.25 2.25 0 0 0-.791-.72l-6.25-3.255a2.646 2.646 0 0 0-2.438 0l-6.25 3.255a2.26 2.26 0 0 0-.79.721.377.377 0 0 0-.022.416ZM19.998 20.167a.833.833 0 0 1-.833.833H2.833a.833.833 0 1 1 0-1.667h16.332a.833.833 0 0 1 .833.834Z" fill="currentColor" stroke="#82879F"/></svg>
    )
}

export const BarPropertyIcon: React.FC = (props) => {
    return (
        <Icon component={BarPropertyIconSVG} {...props}/>
    )
}
