import React from 'react'
import Icon from '@ant-design/icons'

interface BarMiniAppsIconProps {
    viewBox?: string
}

const BarMiniAppsIconSVG: React.FC<BarMiniAppsIconProps> = ({ viewBox = '0 0 22 23' }) => {
    return (
        <svg width='22' height='23' viewBox={viewBox} fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M11 3.05C12.2593 3.05 13.3344 3.83918 13.7576 4.95H8.24229C8.66548 3.83918 9.74055 3.05 11 3.05ZM17 4.95H15.9406C15.4574 2.66489 13.4289 0.949997 11 0.949997C8.57096 0.949997 6.5425 2.66489 6.05926 4.95H4.99995C2.7632 4.95 0.949951 6.76324 0.949951 9V18C0.949951 20.2368 2.7632 22.05 4.99995 22.05H17C19.2367 22.05 21.0499 20.2368 21.0499 18V9C21.0499 6.76324 19.2367 4.95 17 4.95ZM4.99995 7.05C3.923 7.05 3.04995 7.92304 3.04995 9V10.3723L10.5939 13.7252C10.8524 13.8401 11.1476 13.8401 11.4061 13.7252L18.95 10.3724V9C18.95 7.92304 18.0769 7.05 17 7.05H4.99995ZM18.95 12.561L12.2184 15.5528C11.4427 15.8975 10.5573 15.8975 9.78159 15.5528L3.04995 12.561V18C3.04995 19.077 3.923 19.95 4.99995 19.95H17C18.0769 19.95 18.95 19.077 18.95 18V12.561Z" stroke="#82879F" fill="currentColor"/>
        </svg>
    )
}

export const BarMiniAppsIcon: React.FC = (props) => {
    return (
        <Icon component={BarMiniAppsIconSVG} {...props}/>
    )
}
