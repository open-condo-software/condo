import React from 'react'

import type { IconProps } from '@open-condo/icons'

interface IClientRenderedIconProps {
    icon: React.ElementType
    iconProps?: IconProps
}

export const ClientRenderedIcon: React.FC<IClientRenderedIconProps> = ({ icon: Icon, iconProps = {} }) => {
    if (typeof window === 'undefined') return null
    return <Icon {...iconProps}/>
}