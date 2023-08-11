import { TicketAnalyticsGroupBy as TicketGroupBy } from '@app/condo/schema'
import { Row, Col } from 'antd'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import TicketChartView from '@condo/domains/analytics/components/TicketChartView'

import { TicketHorizontalBarDataMapper } from './dataMappers'

import type { ITicketChartCard } from './dataMappers'

const mapperInstance = TicketHorizontalBarDataMapper([TicketGroupBy.Status, TicketGroupBy.Property])

const TicketByPropertyChart: ITicketChartCard = ({ data }) => {
    const intl = useIntl()
    const TicketTitle = intl.formatMessage({ id: 'global.section.tickets' })
    const TicketsByPropertyTitle = intl.formatMessage({ id: 'analytics.ticketAnalyticsPage.groupByFilter.property' })

    return (
        <Row gutter={[0, 16]}>
            <Col span={24}>
                <Typography.Title level={3}>{TicketTitle} {TicketsByPropertyTitle.toLowerCase()}</Typography.Title>
            </Col>
            <Col span={24}>
                <TicketChartView
                    data={data}
                    mainGroup='status'
                    mapperInstance={mapperInstance}
                    viewMode='bar'
                    chartConfig={{ chartOptions: { height: 350 }, animationEnabled: true }}
                />
            </Col>
        </Row>
    )
}

export { TicketByPropertyChart }
