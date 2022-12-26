import React from 'react'

type IconWrapperProps = {
    icon: React.ReactNode
}

export const IconWrapper: React.FC<IconWrapperProps> = ({ icon }) => {
    return (
        <span
            role='img'
            aria-hidden={true}
        >
            {icon}
        </span>
    )
}