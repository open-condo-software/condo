import { Download, IconProps } from '@open-condo/icons'

import type { ComponentType } from 'react'


const ICON_MAP: Record<string, ComponentType<IconProps>> = {
    download: Download,
    // NOTE: add more icon mappings here as needed.
}

export const renderIcon = (iconName?: string, size?: IconProps['size']) => {
    if (!iconName) return undefined

    const IconComponent = ICON_MAP[iconName]
    if (!IconComponent) return undefined

    return <IconComponent size={size || 'medium'} />
}
