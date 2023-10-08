import Icon from '@ant-design/icons'
import React from 'react'

interface ArrowBoldProps {
    width?: number | string
    height?: number | string
}

export const ArrowBoldRightSvg: React.FC<ArrowBoldProps> = ({ width = 12, height = 8 }) => {
    return (
        <svg width={width} height={height} viewBox='0 0 8 12' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <path d='M.879 2.337 4.327 6 .88 9.663l1.306 1.387L6.94 6 2.185.95.88 2.337Z' fill='currentColor' stroke='currentColor' strokeWidth='.7'/>
        </svg>
    )
}

export const ArrowBoldRight: React.FC<ArrowBoldProps> = (props) => {
    return (
        <Icon component={ArrowBoldRightSvg} {...props}/>
    )
}