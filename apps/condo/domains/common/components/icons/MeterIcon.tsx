import React from 'react'
import Icon from '@ant-design/icons'
import { colors } from '@condo/domains/common/constants/style'

const MeterIconSVG = ({ width = 20, height = 20, bgColor = colors.white }) => {
    return (
        <svg width={width} height={height} fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M18 10c0 4.4183-3.5817 8-8 8s-8-3.5817-8-8 3.5817-8 8-8 8 3.5817 8 8Zm2 0c0 5.5228-4.4772 10-10 10-5.5229 0-10-4.4772-10-10C0 4.4771 4.4771 0 10 0c5.5228 0 10 4.4771 10 10Zm-9 1c0 .5523-.4477 1-1 1s-1-.4477-1-1 .4477-1 1-1 1 .4477 1 1Zm-.0137 2.8341C12.1586 13.4262 13 12.3113 13 11s-.8414-2.4262-2.0137-2.8341C10.9953 8.1119 11 8.0565 11 8V5c0-.5523-.4477-1-1-1s-1 .4477-1 1v3c0 .0565.0047.112.0137.1659C7.8414 8.5739 7 9.6887 7 11s.8414 2.4262 2.0137 2.8341A1.0073 1.0073 0 0 0 9 14c0 .5523.4477 1 1 1s1-.4477 1-1c0-.0565-.0047-.1119-.0137-.1659Z" fill="currentColor"/>
        </svg>
    )
}

export const MeterIcon: React.FC = (props) => {
    return (
        <Icon component={MeterIconSVG} {...props}/>
    )
}
