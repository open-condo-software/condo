import { Download, IconProps } from '@open-condo/icons'

const ICON_MAP = {
    download: Download,
    // NOTE: you can add more if needed, don't forget to also add to PostMessageProvider/validators.ts
} as const


export const renderIcon = (iconName?: keyof typeof ICON_MAP, size?: IconProps['size']) => {
    if (!iconName) return undefined

    const IconComponent = ICON_MAP[iconName]
    if (!IconComponent) return undefined

    return <IconComponent size={size || 'medium'} />
}