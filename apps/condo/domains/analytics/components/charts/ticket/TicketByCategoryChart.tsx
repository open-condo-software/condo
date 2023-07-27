import { Row, Col } from 'antd'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import TicketChartView from '@condo/domains/analytics/components/TicketChartView'

import { TicketByCategoryDataMapper } from './dataMappers'

import type { ITicketChartCard } from './dataMappers'

const TicketByCategoryChart: ITicketChartCard = ({ data }) => {
    const intl = useIntl()
    const TicketTitle = intl.formatMessage({ id: 'global.section.tickets' })
    const TicketsByCategory = intl.formatMessage({ id: 'analytics.ticketAnalyticsPage.groupByFilter.category' })

    return (
        <Row gutter={[0, 16]}>
            <Col span={24}>
                <Typography.Title level={3}>{TicketTitle} {TicketsByCategory.toLowerCase()}</Typography.Title>
            </Col>
            <Col span={24}>
                <TicketChartView
                    data={data}
                    viewMode='bar'
                    mapperInstance={TicketByCategoryDataMapper}
                    chartConfig={{ chartOptions: { height: 300 }, animationEnabled: true }}
                />
            </Col>
        </Row>
    )
}

export { TicketByCategoryChart }
