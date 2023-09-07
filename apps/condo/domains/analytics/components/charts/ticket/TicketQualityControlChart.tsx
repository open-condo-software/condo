import React from 'react'

import TicketChartView from '@condo/domains/analytics/components/TicketChartView'

import { TicketQualityControlDataMapper } from './dataMappers'

import type { ITicketChartCard } from './dataMappers'

const TicketQualityControlChart: ITicketChartCard = ({ data, loading }) => {
    return (
        <TicketChartView
            data={data}
            loading={loading}
            viewMode='bar'
            mapperInstance={TicketQualityControlDataMapper}
            chartConfig={{ chartOptions: { height: 300 }, animationEnabled: false }}
        />
    )
}

export { TicketQualityControlChart }
