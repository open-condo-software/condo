import React from 'react'

import { CHART_CONTAINER_HEIGHT } from '@condo/domains/analytics/components/CustomChartView'
import TicketChartView from '@condo/domains/analytics/components/TicketChartView'

import { TicketQualityControlDataMapper } from './dataMappers'

import type { TicketChartCardType } from './dataMappers'

const TicketQualityControlChart: TicketChartCardType = ({ data, loading }) => {
    return (
        <TicketChartView
            data={data}
            loading={loading}
            viewMode='bar'
            mapperInstance={TicketQualityControlDataMapper}
            chartConfig={{ chartOptions: { height: CHART_CONTAINER_HEIGHT }, animationEnabled: false }}
        />
    )
}

export { TicketQualityControlChart }
