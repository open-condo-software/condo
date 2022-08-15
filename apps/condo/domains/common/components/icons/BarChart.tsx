import Icon from '@ant-design/icons'
import { CustomIconComponentProps } from '@ant-design/icons/lib/components/Icon'
import React from 'react'

const BarChartSvg: React.FC<CustomIconComponentProps> = (props) => {
    return (
        <svg xmlns='http://www.w3.org/2000/svg' {...props}>
            <path d='M16 21.7a.3.3 0 00.3.3h5.4a.3.3 0 00.3-.3V2.3a.3.3 0 00-.3-.3h-5.4a.3.3 0 00-.3.3v19.4z'/>
            <rect width='6' height='14' rx='.3' transform='matrix(1 0 0 -1 9 22)'/>
            <rect width='6' height='12' rx='.3' transform='matrix(1 0 0 -1 2 22)'/>
        </svg>
    )
}

export const BarChartIcon: React.FC = (props) => {
    return (
        <Icon component={BarChartSvg} {...props} width='26' height='26' viewBox='0 0 24 24'/>
    )
}
