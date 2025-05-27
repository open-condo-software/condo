import dayjs from 'dayjs'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography, Space } from '@open-condo/ui'

type TTicket = {
    id: string
    details: string
    createdAt: string
    number: number
    status: string
    statusColor: string
}

export const TicketOverview: React.FC<TTicket> = ({
    id,
    details,
    createdAt,
    number,
    status,
    statusColor,
}) => {
    const intl = useIntl()
    const locale = intl?.locale
    const date = locale ? dayjs(createdAt).locale(locale) : dayjs(createdAt)
    const formattedCreatedAt = date.format('DD MMMM YYYY')
    const topLine = `№ ${number} ${status}`.toLowerCase()

    return (
        <Space direction='vertical' size={4} width='100%'>
            <Typography.Link href={`/ticket/${id}`} style={{ color: statusColor, textDecorationColor: statusColor, fontSize: 14 }}>
                {topLine}
            </Typography.Link>
            <Typography.Text size='medium' ellipsis>
                {details}
            </Typography.Text>
            <Typography.Text size='small' type='secondary'>
                {formattedCreatedAt}
            </Typography.Text>
        </Space>
    )
}