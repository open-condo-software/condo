import React from 'react'

import { Space, Typography } from '@open-condo/ui'

export type PaymentsSummaryItem = {
    key: string
    label: string
    value: React.ReactNode
    loading?: boolean
    type?: 'default' | 'success' | 'warning'
}

type PaymentsSummaryProps = {
    items: PaymentsSummaryItem[]
}

const VALUE_TYPE_BY_TYPE = {
    default: 'inherit',
    success: 'success',
    warning: 'warning',
} as const

export const PaymentsSummary: React.FC<PaymentsSummaryProps> = ({ items }) => {
    return (
        <Space wrap size={4}>
            {items.map(({ key, label, value, loading = false, type = 'default' }, index) => (
                <Space key={key} size={0}>
                    <Space key={key} size={4}>
                        <Typography.Text size='medium' type='secondary'>{label} — </Typography.Text>
                        <Typography.Text
                            size='large'
                            strong
                            type={VALUE_TYPE_BY_TYPE[type]}
                        >
                            {loading ? '…' : value}
                        </Typography.Text>
                    </Space>
                    {index < items.length - 1 && <Typography.Text size='medium' type='secondary'>; </Typography.Text>}
                </Space>
            ))}
        </Space>
    )
}
