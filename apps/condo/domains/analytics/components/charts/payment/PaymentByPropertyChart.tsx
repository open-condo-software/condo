import { Row, Col } from 'antd'
import groupBy from 'lodash/groupBy'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import PaymentChart from '@condo/domains/analytics/components/PaymentChart'
import { PaymentChartView } from '@condo/domains/analytics/components/PaymentChartView'

import type { PaymentDataType } from '@condo/domains/analytics/components/PaymentChart'
import type { EchartsSeries } from '@condo/domains/analytics/components/TicketChart'

const TOP_VALUES = 9

// TODO: slice by top values
const PaymentByPropertyDataMapper = (paidTitle: string) => new PaymentChart({
    pie: {
        chart: (viewMode, data) => {
            const createdByGroup = groupBy(data, 'createdBy')

            const series: Array<EchartsSeries> = [{
                name: paidTitle,
                data: Object.entries(createdByGroup).map(([groupLabel, dataObj]) => {
                    return {
                        value: dataObj.reduce((p, c) => p + Number(c.sum), 0),
                        name: groupLabel,
                    }
                }),
                // data: data.slice(0, TOP_VALUES).map(resident => ({ value: resident.count, name: resident.address })),
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

interface IPaymentByPropertyChart {
    ({ data }: { data: PaymentDataType }): React.ReactElement
}

const PaymentByPropertyChart: IPaymentByPropertyChart = ({ data }) => {
    const intl = useIntl()
    const ChartTitle = intl.formatMessage({ id: 'pages.reports.paymentsByProperty' })
    const PaidTitle = intl.formatMessage({ id: 'PaymentPaid' })

    const dataMapper = useMemo(() => PaymentByPropertyDataMapper(PaidTitle), [PaidTitle])


    return (
        <Row gutter={[0, 16]}>
            <Col span={24}>
                <Typography.Title level={3}>{ChartTitle}</Typography.Title>
            </Col>
            <Col span={24}>
                <PaymentChartView
                    viewMode='pie'
                    mapperInstance={dataMapper}
                    chartConfig={{ chartOptions: { height: 300 }, animationEnabled: true }}
                    data={data}
                />
            </Col>
        </Row>
    )
}

export { PaymentByPropertyChart }
