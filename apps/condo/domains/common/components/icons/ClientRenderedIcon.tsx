import React from 'react'

import type { IconProps } from '@open-condo/icons'

interface IClientRenderedIconProps {
    icon: React.ElementType
    iconProps?: IconProps
}

/** @deprecated you don't need to use it! we will remove it in a future */
export const ClientRenderedIcon: React.FC<IClientRenderedIconProps> = ({ icon: Icon, iconProps = {} }) => {
    if (typeof window === 'undefined') return null
    return <Icon {...iconProps}/>
}
