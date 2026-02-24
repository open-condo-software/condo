import dynamic from 'next/dynamic'
import React, { useMemo } from 'react'

import type { IconProps } from '@open-condo/icons'
import type * as Icons from '@open-condo/icons'

import type { ComponentType } from 'react'

export type IconName = Exclude<keyof typeof Icons, 'IconProps'>

type DynamicIconProps = {
    name: IconName
    iconProps?: IconProps
}

const DEFAULT_FALLBACK_ICON: IconName = 'Download'

const loadIcon = async (iconName: IconName) => {
    try {
        const mod = await import(`@open-condo/icons/src/components/${iconName}`)
        return (mod as Record<string, ComponentType<IconProps>>)[iconName] ?? null
    } catch (error) {
        return null
    }
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, iconProps }) => {
    const IconComponent = useMemo(() => {
        return dynamic<IconProps>(async () => {
            const Icon = await loadIcon(name)
            const ResolvedIcon = Icon ?? await loadIcon(DEFAULT_FALLBACK_ICON)
            if (!ResolvedIcon) {
                const Empty: React.FC = () => null
                Empty.displayName = 'DynamicIconEmpty'
                return Empty
            }

            const DynamicIconRenderer: React.FC<IconProps> = (props) => <ResolvedIcon {...props} />
            DynamicIconRenderer.displayName = `DynamicIcon(${name})`
            return DynamicIconRenderer
        }, {
            ssr: false,
            loading: () => null,
        })
    }, [name])

    return <IconComponent {...iconProps} />
}
