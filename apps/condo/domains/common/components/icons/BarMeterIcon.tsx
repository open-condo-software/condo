import React from 'react'
import Icon from '@ant-design/icons'

interface BarMeterIconProps {
    viewBox?: string
}

const BarMeterIconSVG: React.FC<BarMeterIconProps> = ({ viewBox = '0 0 20 20' }) => {
    return (
        <svg width="20" height="20" fill="none" viewBox={viewBox} xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M10 0C7.3298 0 4.817 1.0408 2.929 2.929 1.0407 4.817 0 7.3297 0 10c0 2.6702 1.0408 5.1829 2.929 7.0711C4.817 18.9592 7.3297 20 10 20c2.6702 0 5.183-1.0408 7.0711-2.9289C18.9592 15.1829 20 12.6702 20 10c0-2.6702-1.0408-5.183-2.9289-7.071C15.183 1.0407 12.6702 0 10 0ZM2.0728 10c0-4.3706 3.5566-7.9272 7.9272-7.9272S17.9272 5.6294 17.9272 10 14.3706 17.9272 10 17.9272 2.0728 14.3706 2.0728 10Zm5.5462 3.3333a.9524.9524 0 0 0-.9524.9524c0 .526.4264.9524.9524.9524h4.7619a.9524.9524 0 0 0 .9524-.9524.9524.9524 0 0 0-.9524-.9524H7.619Zm6.415-7.8442c-.4047-.4047-1.061-.4047-1.4657 0L10.5794 7.478c-.1655.1656-.4642.2258-.917.2258-1.1897 0-2.1568.9671-2.1568 2.1568 0 1.1898.9671 2.1569 2.1569 2.1569 1.1897 0 2.1568-.9671 2.1568-2.1569 0-.4527.0602-.7513.2258-.917l1.9889-1.9888c.4047-.4047.4047-1.061 0-1.4657Z" fill="currentColor"/>
        </svg>
    )
}

export const BarMeterIcon: React.FC = (props) => {
    return (
        <Icon component={BarMeterIconSVG} {...props}/>
    )
}
