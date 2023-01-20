import Icon from '@ant-design/icons'
import React, { useCallback } from 'react'

const BankCardIconSVG = ({ active, loading }) => (
    <svg width='40' height='40' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <g>
            <rect width='40' height='40' rx='12' fill='#F2F3F7'/>
            <rect x='10' y='13' width='20' height='14' rx='2' stroke={active ? '#34C759' : '#82879F'} strokeWidth='1.6'/>
            <path d='M29 16a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H11a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1h18ZM17.2 23a.8.8 0 0 1 0 1.6h-3.4a.8.8 0 0 1 0-1.6h3.4ZM21.2 23a.8.8 0 0 1 0 1.6h-1.4a.8.8 0 0 1 0-1.6h1.4Z' fill={active ? '#34C759' : '#82879F'}/>
            {!active && !loading && <path d='m33.5 8.5-25 25' stroke='#FF3B30' strokeWidth='1.4' strokeLinecap='round'/>}
        </g>
    </svg>
)

interface BankCardIconProps {
    active?: boolean
    loading?: boolean
}

export const BankCardIcon: React.FC<BankCardIconProps> = ({ active = true, loading = true, ...props }) => {
    const MobileIconComponent = useCallback(() => (
        <BankCardIconSVG active={active} loading={loading} />
    ), [active, loading])

    return (
        <Icon component={MobileIconComponent} {...props} />
    )
}
