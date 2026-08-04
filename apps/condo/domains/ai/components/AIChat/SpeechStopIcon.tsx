import React from 'react'

import type { IconProps } from '@open-condo/icons'

const getIconSize = (size: IconProps['size'] = 'large') => {
    switch (size) {
        case 'auto':
            return '1em'
        case 'medium':
            return 20
        case 'small':
            return 16
        default:
            return 24
    }
}

/** Red circle for white square stop button with red border. */
export const SpeechStopIcon: React.FC<IconProps> = ({
    size = 'small',
    color = 'currentcolor',
    className,
    id,
    onClick,
}) => {
    const iconSize = getIconSize(size)

    return (
        <span
            role='img'
            aria-hidden
            className={className}
            id={id}
            onClick={onClick}
            style={{
                color,
                width: iconSize,
                height: iconSize,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'inherit',
                lineHeight: 0,
            }}
        >
            <svg
                width='inherit'
                height='inherit'
                viewBox='0 0 24 24'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
            >
                <circle cx='12' cy='12' r='6' fill='var(--condo-global-color-red-5)' />
            </svg>
        </span>
    )
}
