import React from 'react'
import Icon from '@ant-design/icons'

interface BarPaymentsIconProps {
    viewBox?: string
}

const BarPaymentsIconSVG: React.FC<BarPaymentsIconProps> = ({ viewBox = '0 0 22 22' }) => {
    return (
        <svg width='22' height='22' viewBox={viewBox} fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.5 14a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" fill="currentColor" stroke="#82879F"/><path d="M19.077 4.71V3.45c0-.643-.238-1.26-.664-1.719a2.245 2.245 0 0 0-1.61-.73H4.778C1.385 1 1.042 3.951 1 5.44v13.111c0 .65.243 1.272.676 1.732.433.459 1.02.717 1.632.717h15.384c.612 0 1.2-.258 1.632-.717.433-.46.676-1.082.676-1.732V7.122a2.54 2.54 0 0 0-.546-1.579 2.28 2.28 0 0 0-1.377-.833Zm-14.3-2.077h12.027c.198.01.385.1.522.251a.844.844 0 0 1 .212.565v1.224H2.608c.196-1.481.834-2.04 2.169-2.04ZM19.46 18.55a.842.842 0 0 1-.225.577.748.748 0 0 1-.544.24H3.308a.748.748 0 0 1-.544-.24.843.843 0 0 1-.226-.577V6.306h16.154c.204 0 .4.086.544.24.145.152.226.36.226.576v11.429Z" fill="currentColor" stroke="#82879F"/></svg>
    )
}

export const BarPaymentsIcon: React.FC = (props) => {
    return (
        <Icon component={BarPaymentsIconSVG} {...props}/>
    )
}
