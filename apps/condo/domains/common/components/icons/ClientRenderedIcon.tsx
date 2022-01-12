import React from 'react'

interface IClientRenderedIconProps {
    icon: React.ElementType
}

export const ClientRenderedIcon: React.FC<IClientRenderedIconProps> = ({ icon: Icon }) => {
    if (typeof window === 'undefined') return null
    return <Icon />
}
