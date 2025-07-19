import Icon from '@ant-design/icons'
import React from 'react'

interface ArrowSemiBoldProps {
    width?: number | string
    height?: number | string
}

export const ArrowSemiBoldRightSvg: React.FC<ArrowSemiBoldProps> = ({ width = 14, height = 14 }) => {
    return (
        <svg width={width} height={height} viewBox='0 0 9 14' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <path fillRule='evenodd' clipRule='evenodd' d='M1.87392 13.8583C1.7958 13.9365 1.66903 13.9365 1.5909 13.8583L0.141155 12.4067C0.0631684 12.3287 0.0631682 12.2022 0.141155 12.1241L5.25879 7L0.141154 1.87592C0.063168 1.79784 0.0631682 1.67134 0.141155 1.59326L1.5909 0.141688C1.66903 0.063465 1.7958 0.063465 1.87392 0.141689L8.58246 6.85867C8.66045 6.93675 8.66045 7.06325 8.58246 7.14133L1.87392 13.8583Z' fill='black'/>
        </svg>
    )
}

export const ArrowSemiBoldRight: React.FC<ArrowSemiBoldProps> = (props) => {
    return (
        <Icon component={ArrowSemiBoldRightSvg} {...props}/>
    )
}