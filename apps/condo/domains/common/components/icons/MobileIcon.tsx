import React, { useCallback } from 'react'
import Icon from '@ant-design/icons'

const MobileIconSVG = ({ active }) => (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="12" fill="#F2F3F7"/>
        <rect x="14" y="9" width="12" height="22" rx="2" stroke={active ? '#34C759' : '#82879F'} strokeWidth="1.6"/>
        <path d="M25.2 11C25.6418 11 26 11.3582 26 11.8C26 12.2418 25.6418 12.6 25.2 12.6L14.8 12.6C14.3582 12.6 14 12.2418 14 11.8C14 11.3582 14.3582 11 14.8 11L25.2 11Z" fill="#34C759" stroke={!active && '#82879F'}/>
        <path d="M25.2 27C25.6418 27 26 27.3582 26 27.8C26 28.2418 25.6418 28.6 25.2 28.6L14.8 28.6C14.3582 28.6 14 28.2418 14 27.8C14 27.3582 14.3582 27 14.8 27L25.2 27Z" fill="#34C759" stroke={!active && '#82879F'}/>
        {!active && <path d="M33.5 8.5L8.5 33.5" stroke="#FF3B30" strokeWidth="1.4" strokeLinecap="round"/>}
    </svg>
)

interface MobileIconProps {
    active?: boolean
}

export const MobileIcon: React.FC<MobileIconProps> = ({ active = true }) => {
    const MobileIconComponent = useCallback(() => (
        <MobileIconSVG active={active} />
    ), [active])

    return (
        <Icon component={MobileIconComponent} />
    )
}
