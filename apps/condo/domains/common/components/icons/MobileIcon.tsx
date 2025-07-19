import Icon from '@ant-design/icons'
import React, { useCallback } from 'react'

const MobileIconSVG = ({ active }) => (
    <svg width='40' height='40' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <g>
            <rect width='40' height='40' rx='12' fill='#F2F3F7'/>
            <rect x='14' y='9' width='12' height='22' rx='2' stroke={active ? '#34C759' : '#82879F'} strokeWidth='1.6'/>
            <path d='M25.2 11.5a.3.3 0 1 1 0 .6H14.8a.3.3 0 1 1 0-.6h10.4ZM25.2 27.5a.3.3 0 1 1 0 .6H14.8a.3.3 0 1 1 0-.6h10.4Z' fill='#34C759' stroke={active ? '#34C759' : '#82879F'}/>
            {!active && <path d='m33.5 8.5-25 25' stroke='#FF3B30' strokeWidth='1.4' strokeLinecap='round'/>}
        </g>
        <defs>
            <clipPath id='a'>
                <rect width='40' height='40' rx='12' fill='#fff'/>
            </clipPath>
        </defs>
    </svg>
)

interface MobileIconProps {
    active?: boolean
}

export const MobileIcon: React.FC<MobileIconProps> = ({ active = true, ...props }) => {
    const MobileIconComponent = useCallback(() => (
        <MobileIconSVG active={active} />
    ), [active])

    return (
        <Icon component={MobileIconComponent} {...props} />
    )
}
