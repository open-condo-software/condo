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

/**
 * Fill-style mic matching @open-condo/icons Paperclip (same IconWrapper layout + fill).
 * Package Mic is stroke-based and looks heavier next to Paperclip at small size.
 */
export const SpeechMicIcon: React.FC<IconProps> = ({
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
                {/*
                  Same proportions as package Mic (capsule r≈3–4, arc r=7), as fill.
                  Slight scale + lift so optical center matches Paperclip in the utils row.
                */}
                <g transform='translate(12 11.25) scale(1.1) translate(-12 -11.25)'>
                    <path
                        d='M12 3a3.5 3.5 0 0 0-3.5 3.5v6a3.5 3.5 0 1 0 7 0v-6A3.5 3.5 0 0 0 12 3Z'
                        fill='currentColor'
                    />
                    <path
                        d='M5.25 10.5a.75.75 0 0 1 .75.75 6 6 0 0 0 12 0 .75.75 0 0 1 1.5 0 7.5 7.5 0 0 1-6.75 7.462V21a.75.75 0 0 1-1.5 0v-2.288A7.5 7.5 0 0 1 4.5 11.25a.75.75 0 0 1 .75-.75Z'
                        fill='currentColor'
                    />
                </g>
            </svg>
        </span>
    )
}
