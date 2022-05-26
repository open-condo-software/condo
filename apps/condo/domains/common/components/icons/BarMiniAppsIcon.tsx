import React from 'react'
import Icon from '@ant-design/icons'

interface BarMiniAppsIconProps {
    viewBox?: string
}

const BarMiniAppsIconSVG: React.FC<BarMiniAppsIconProps> = ({ viewBox = '0 0 20 20' }) => {
    return (
        <svg width="20" height="20" fill="none" viewBox={viewBox} xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M10.0001 1.9905c1.253 0 2.3228.748 2.7439 1.801H7.256c.4212-1.053 1.4909-1.801 2.7441-1.801Zm5.9701 1.801h-1.0541C14.4353 1.6255 12.4169 0 10.0001 0c-2.417 0-4.4354 1.6255-4.9162 3.7915h-1.054C1.8042 3.7915 0 5.5102 0 7.6303v8.5308C0 18.2813 1.8042 20 4.0299 20h11.9403C18.1958 20 20 18.2813 20 16.1611V7.6303c0-2.1201-1.8042-3.8388-4.0298-3.8388ZM4.0299 5.782c-1.0716 0-1.9403.8275-1.9403 1.8483v1.3008l7.5064 3.1781c.2572.1089.5509.1089.8082 0l7.5063-3.178V7.6303c0-1.0208-.8687-1.8483-1.9403-1.8483H4.0299Zm13.8806 5.2237-6.6981 2.8358a3.1217 3.1217 0 0 1-2.4247 0l-6.6981-2.8358v5.1554c0 1.0209.8687 1.8484 1.9403 1.8484h11.9403c1.0716 0 1.9403-.8275 1.9403-1.8484v-5.1554Z" fill="currentColor"/>
        </svg>
    )
}

export const BarMiniAppsIcon: React.FC = (props) => {
    return (
        <Icon component={BarMiniAppsIconSVG} {...props}/>
    )
}
