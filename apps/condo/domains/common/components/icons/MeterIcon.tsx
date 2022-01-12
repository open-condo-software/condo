import React from 'react'
import Icon from '@ant-design/icons'
import { colors } from '@condo/domains/common/constants/style'

const MeterIconSVG = ({ width = 20, height = 20, bgColor = colors.white }) => {
    return (
        <svg width={width} height={height} fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2z" fill="currentColor" />
            <path
                d="M12.855 10.221v-4.13h-1.71v4.13A2.536 2.536 0 009.5 12.602c0 1.093.686 2.026 1.645 2.38v1.185h1.71v-1.184a2.536 2.536 0 001.645-2.38 2.536 2.536 0 00-1.645-2.382zM12 13.401a.795.795 0 01-.789-.799c0-.44.354-.8.789-.8.435 0 .789.36.789.8 0 .441-.354.8-.789.8z"
                fill={bgColor}
            />
        </svg>
    )
}

export const MeterIcon: React.FC = (props) => {
    return <Icon component={MeterIconSVG} {...props} />
}
