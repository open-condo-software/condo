import React, { CSSProperties, MouseEventHandler, SVGProps } from 'react'

const SMALL_ICON_SIZE = 16
const MEDIUM_ICON_SIZE = 20
const LARGE_ICON_SIZE = 24

type IconSize = 'large' | 'medium' | 'small' | 'auto'

export type IconProps = {
    size?: IconSize,
    color?: CSSProperties['color']
    svgProps?: Pick<SVGProps<SVGSVGElement>, 'onClick'>
    className?: string
    id?: string
    onClick?: MouseEventHandler<HTMLSpanElement>
}

type IconWrapperProps = Omit<IconProps, 'svgProps'> & {
    icon: React.ReactNode
}

const getIconSize = (size: IconSize) => {
    switch (size) {
        case 'auto':
            return '1em'
        case 'medium':
            return MEDIUM_ICON_SIZE
        case 'small':
            return SMALL_ICON_SIZE
        default:
            return LARGE_ICON_SIZE
    }
}

export const IconWrapper: React.FC<IconWrapperProps> = ({
    icon,
    size = 'large',
    color = 'currentcolor',
    className,
    id,
    onClick,
}) => {
    const iconSize = getIconSize(size)
    const spanStyles: CSSProperties = {
        color,
        width: iconSize,
        height: iconSize,
        display: 'inline-flex',
        fontSize: 'inherit',
    }

    return (
        <span
            role='img'
            aria-hidden={true}
            style={spanStyles}
            className={className}
            id={id}
            onClick={onClick}
        >
            {icon}
        </span>
    )
}
