import React from 'react'
import Icon from '@ant-design/icons'

interface BirdieArrowIcon {
    width?: number | string
    height?: number | string
}

export const BirdieArrowIconSvg: React.FC<BirdieArrowIcon> = ({ width = 10, height = 6 }) => {
    return (
        <svg width={width} height={height} fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M1.141 1.6342a.2.2 0 0 1 0-.2826l.7087-.7098a.2.2 0 0 1 .283 0L5 3.5141 7.8673.6418a.2.2 0 0 1 .283 0l.7087.7098a.2.2 0 0 1 0 .2826l-3.7175 3.724a.2.2 0 0 1-.283 0L1.141 1.6342Z" fill="#222" stroke="#222" strokeWidth=".6"/>
        </svg>
    )
}

export const BirdieArrowIcon: React.FC<BirdieArrowIcon> = (props) => {
    return (
        <Icon component={BirdieArrowIconSvg} {...props}/>
    )
}