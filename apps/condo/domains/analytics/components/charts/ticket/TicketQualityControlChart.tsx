import get from 'lodash/get'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { CHART_CONTAINER_HEIGHT } from '@condo/domains/analytics/components/CustomChartView'
import TicketChartView from '@condo/domains/analytics/components/TicketChartView'


import { TicketQualityControlDataMapper } from './dataMappers'

import type { TicketChartCardType } from './dataMappers'

const TicketQualityControlChart: TicketChartCardType = ({ data, loading }) => {
    const intl = useIntl()
    const NoData = intl.formatMessage({ id: 'NoData' })

    if (get(data, '0.length', 0) === 0) {
        return (
            <div style={{ height: CHART_CONTAINER_HEIGHT }}>
                <Typography.Text>{NoData}</Typography.Text>
            </div>
        )
    }

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
