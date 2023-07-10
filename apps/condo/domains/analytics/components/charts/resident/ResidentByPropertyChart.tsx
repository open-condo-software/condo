import { Row, Col } from 'antd'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import PaymentChart from '@condo/domains/analytics/components/PaymentChart'
import { PaymentChartView } from '@condo/domains/analytics/components/PaymentChartView'

import type { PaymentDataType } from '@condo/domains/analytics/components/PaymentChart'
import type { EchartsSeries } from '@condo/domains/analytics/components/TicketChart'

const TOP_VALUES = 9

const ResidentByPropertyDataMapper = (residentsTitle: string) => new PaymentChart({
    pie: {
        chart: (viewMode, data) => {
            const series: Array<EchartsSeries> = [{
                name: residentsTitle,
                data: data.slice(0, TOP_VALUES).map(resident => ({ value: resident.count, name: resident.address })),
                radius: '75%',
                type: 'pie',
                label: { show: true, formatter: (e) =>  e.percent + '%' },
            }]
            return {
                legend: [],
                tooltip: { trigger: 'item', axisPointer: { type: 'none' } },
                axisData: {
                    yAxis: { type: 'category', data: null, axisLabel: { show: false } },
                    xAxis: { type: 'value', data: null, boundaryGap: [0, 0.02] },
                },
                series,
            }
        },
    },
})

interface IResidentByPropertyChart {
    ({ data }: { data: PaymentDataType }): React.ReactElement
}

const ResidentByPropertyChart: IResidentByPropertyChart = ({ data }) => {
    const intl = useIntl()
    const ChartTitle = intl.formatMessage({ id: 'pages.reports.residentsTitle' })
    const ResidentTitle = intl.formatMessage({ id: 'global.section.contacts' })

    const dataMapper = useMemo(() => ResidentByPropertyDataMapper(ResidentTitle), [ResidentTitle])

    return (
        <Row gutter={[0, 16]}>
            <Col span={24}>
                <Typography.Title level={3}>{ChartTitle}</Typography.Title>
            </Col>
            <Col span={24}>
                <PaymentChartView
                    data={data}
                    viewMode='pie'
                    chartConfig={{ chartOptions: { height: 300 }, animationEnabled: true }}
                    mapperInstance={dataMapper}
                />
            </Col>
        </Row>
    )
}

export { ResidentByPropertyChart }
