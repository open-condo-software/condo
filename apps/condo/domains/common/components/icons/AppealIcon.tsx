import React from 'react'
import Icon from '@ant-design/icons'
import { colors } from '@condo/domains/common/constants/style'

export const AppealIconSVG = ({ width = 20, height = 20, bgColor = colors.white }) => {
    return (
        <svg width={width} height={height} fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M15 14c-.4541 0-.8948.1546-1.2494.4383L10 17.4387l-3.7506-3.0004A2 2 0 0 0 5 14H4c-1.1046 0-2-.8954-2-2V4c0-1.1046.8954-2 2-2h12c1.1046 0 2 .8954 2 2v8c0 1.1046-.8954 2-2 2h-1Zm1 2h-1l-4.3753 3.5002a1 1 0 0 1-1.2494 0L5 16H4c-2.2091 0-4-1.7909-4-4V4c0-2.2091 1.7909-4 4-4h12c2.2091 0 4 1.7909 4 4v8c0 2.2091-1.7909 4-4 4ZM5 6c0-.5523.4477-1 1-1h8c.5523 0 1 .4477 1 1s-.4477 1-1 1H6c-.5523 0-1-.4477-1-1Zm0 4c0-.5523.4477-1 1-1h8c.5523 0 1 .4477 1 1s-.4477 1-1 1H6c-.5523 0-1-.4477-1-1Z" fill="currentColor"/>
        </svg>
    )
}

export const AppealIcon: React.FC = (props) => {
    return (
        <Icon component={AppealIconSVG} {...props}/>
    )
}
