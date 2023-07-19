import { Row, Col } from 'antd'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import TicketChartView from '@condo/domains/analytics/components/TicketChartView'

import { AllTicketChartDataMapper } from './dataMappers'

import type { ITicketChartCard } from './dataMappers'

const AllTicketsChart: ITicketChartCard = ({ data }) => {
    const intl = useIntl()
    const ChartTitle = intl.formatMessage({ id: 'global.section.tickets' })

    return (
        <Row gutter={[0, 16]}>
            <Col span={24}>
                <Typography.Title level={3}>{ChartTitle}</Typography.Title>
            </Col>
            <Col span={24}>
                <TicketChartView
                    data={data}
                    mainGroup='status'
                    viewMode='line'
                    mapperInstance={AllTicketChartDataMapper}
                    chartConfig={{ chartOptions: { height: 300 }, animationEnabled: true }}
                />
            </Col>
        </Row>
    )
}

export { AllTicketsChart }
