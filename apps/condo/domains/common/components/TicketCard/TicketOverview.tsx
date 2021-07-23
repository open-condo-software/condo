import React from 'react'
import { Row, Col, Typography, Space } from 'antd'
import Link from 'next/link'
import { format } from 'date-fns'
import { LOCALES } from '../../constants/locale'
import { useIntl } from '@core/next/intl'
import { green } from '@ant-design/colors'

type TTicket = {
    id: string,
    details: string,
    createdAt: string,
    number: number,
    status: string
}

export const TicketOverview: React.FC<TTicket> = ({
    id,
    details,
    createdAt,
    number, status }) => {
    const intl = useIntl()
    const formattedCreatedAt = format(
        new Date(createdAt),
        'dd MMMM Y',
        { locale: LOCALES[intl.locale] }
    )
    const topLine = `№ ${number} ${status}`.toLowerCase()
    const ticketRef = `/ticket/${id}`

    return (
        <Row>
            <Col span={24}>
                <Link href={ticketRef}>
                    <Typography.Link style={{ color: `${green[6]}`, fontSize: 14 }}>
                        {topLine}
                    </Typography.Link>
                </Link>
            </Col>
            <Space direction={'vertical'} size={4} style={{ width: '100%' }}>
                <Col span={24}>
                    <Typography.Text type={'secondary'} style={{ fontSize: 12 }}>
                        {formattedCreatedAt}
                    </Typography.Text>
                </Col>
                <Col span={24}>
                    <Typography.Paragraph style={{ fontSize: 14 }} ellipsis>
                        {details}
                    </Typography.Paragraph>
                </Col>
            </Space>
        </Row>
    )
}