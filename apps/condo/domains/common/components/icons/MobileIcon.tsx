import React, { useCallback } from 'react'
import Icon from '@ant-design/icons'

const MobileIconSVG = ({ active }) => (
    <svg width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="12" fill="#F2F3F7"/>
        <rect x="14" y="9" width="12" height="22" rx="2" stroke={active ? '#34C759' : '#82879F'}/>
        <path d="M25.2 11a.8.8 0 0 1 0 1.6H14.8a.8.8 0 0 1 0-1.6h10.4ZM25.2 27a.8.8 0 0 1 0 1.6H14.8a.8.8 0 0 1 0-1.6h10.4Z" fill="#34C759" stroke={!active && '#82879F'}/>
        {!active && <path d="m33.5 8.5-25 25" stroke="#FF3B30"/> }
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
