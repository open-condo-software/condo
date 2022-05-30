import React from 'react'
import Icon from '@ant-design/icons'

interface BarPaymentsIconProps {
    viewBox?: string
}

const BarPaymentsIconSVG: React.FC<BarPaymentsIconProps> = ({ viewBox = '0 0 20 20' }) => {
    return (
        <svg width="20" height="20" fill="none" viewBox={viewBox} xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M4 0C1.7909 0 0 1.7909 0 4v12c0 2.2091 1.7909 4 4 4h12c2.2091 0 4-1.7909 4-4V7c0-1.4924-.8173-2.7938-2.0287-3.4813C17.7336 1.5365 16.0463 0 14 0H4Zm11.7324 3c-.3458-.5978-.9921-1-1.7324-1H4c-.9317 0-1.7146.637-1.9368 1.4994A3.982 3.982 0 0 1 4 3h11.7324ZM2 7v9c0 1.1046.8954 2 2 2h12c1.1046 0 2-.8954 2-2V7c0-1.1046-.8954-2-2-2H4c-1.1046 0-2 .8954-2 2Zm14 4.5c0 .8284-.6716 1.5-1.5 1.5s-1.5-.6716-1.5-1.5.6716-1.5 1.5-1.5 1.5.6716 1.5 1.5Z" fill="currentColor"/>
        </svg>
    )
}

export const BarPaymentsIcon: React.FC = (props) => {
    return (
        <Icon component={BarPaymentsIconSVG} {...props}/>
    )
}
