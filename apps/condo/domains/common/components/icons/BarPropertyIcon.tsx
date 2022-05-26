import React from 'react'
import Icon from '@ant-design/icons'

interface BarPropertyIconProps {
    viewBox?: string
}

const BarPropertyIconSVG: React.FC<BarPropertyIconProps> = ({ viewBox = '0 0 18 20' }) => {
    return (
        <svg width="18" height="20" viewBox={viewBox} fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M9.926.3895a1.8 1.8 0 0 0-1.8521 0L.962 4.6565C-.6033 5.5958.0626 8 1.8882 8H2v7H1c-.5523 0-1 .4477-1 1s.4477 1 1 1h16c.5523 0 1-.4477 1-1s-.4477-1-1-1h-1V8h.1117c1.8256 0 2.4915-2.4042.9261-3.3435L9.926.3895ZM14 8h-2v7h2V8Zm-4 0H8v7h2V8ZM6 8H4v7h2V8ZM3.2294 5.6285 9 2.1662l5.7706 3.4623c.1739.1044.0999.3715-.1029.3715H3.3323c-.2028 0-.2768-.2671-.1029-.3715ZM0 19c0-.5523.4477-1 1-1h16c.5523 0 1 .4477 1 1s-.4477 1-1 1H1c-.5523 0-1-.4477-1-1Z" fill="currentColor"/>
        </svg>
    )
}

export const BarPropertyIcon: React.FC = (props) => {
    return (
        <Icon component={BarPropertyIconSVG} {...props}/>
    )
}
