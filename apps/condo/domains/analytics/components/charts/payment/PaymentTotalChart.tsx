import { Row, Col } from 'antd'
import dayjs from 'dayjs'
import groupBy from 'lodash/groupBy'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import PaymentChart from '@condo/domains/analytics/components/PaymentChart'
import { PaymentChartView } from '@condo/domains/analytics/components/PaymentChartView'

import type { PaymentDataType } from '@condo/domains/analytics/components/PaymentChart'
import type { EchartsSeries } from '@condo/domains/analytics/components/TicketChart'

const PaymentTotalDataMapper = (sumTitle: string, paymentCountTitle: string) => new PaymentChart({
    bar: {
        chart: (viewMode, data) => {
            const totalGroup = groupBy(data, 'dayGroup')
            const paymentsCount = Object.entries(totalGroup).map(([groupLabel, dataObj]) => {
                return [groupLabel, dataObj.reduce((p, c) => p + Number(c.count), 0)]
            })
            const series: Array<EchartsSeries> = [
                {
                    name: sumTitle,
                    data: Object.entries(totalGroup).map(([groupLabel, dataObj]) => {
                        return [groupLabel, dataObj.reduce((p, c) => p + parseFloat(c.sum), 0)]
                    }),
                    type: 'bar',
                    label: { show: true, position: 'top' },
                    color: colors.green['7'],
                    barMaxWidth: 40,
                },
                {
                    name: paymentCountTitle,
                    data: paymentsCount,
                    type: 'line',
                    itemStyle: {
                        opacity: 0,
                    },
                    color: 'transparent',
                },
            ]

            return {
                legend: [],
                tooltip: { trigger: 'axis', axisPointer: { type: 'line' } },
                axisData: {
                    yAxis: { type: 'value', data: null, boundaryGap: [0, 0.02] },
                    xAxis: {
                        type: 'category',
                        data: null,
                        axisLabel: {
                            formatter: (value) => dayjs(value).format('MMM, YYYY'),
                        },
                    },
                },
                series,
            }
        },
    },
})

interface IPaymentTotalChart {
    ({ data }: { data: PaymentDataType }): React.ReactElement
}

const PaymentTotalChart: IPaymentTotalChart = ({ data }) => {
    const intl = useIntl()
    const ChartTitle = intl.formatMessage({ id: 'pages.reports.paymentsTotal' })
    const SumTitle = intl.formatMessage({ id: 'global.sum' })
    const PaymentCountTitle = intl.formatMessage({ id: 'pages.reports.paymentCount' })

    const dataMapper = useMemo(() => PaymentTotalDataMapper(SumTitle, PaymentCountTitle), [SumTitle, PaymentCountTitle])

    return (
        <Row gutter={[0, 16]}>
            <Col span={24}>
                <Typography.Title level={3}>{ChartTitle}</Typography.Title>
            </Col>
            <Col span={24}>
                <PaymentChartView
                    viewMode='bar'
                    data={data}
                    mapperInstance={dataMapper}
                    chartConfig={{ chartOptions: { height: 300 }, animationEnabled: true }}
                />
            </Col>
        </Row>
    )
}

export { PaymentTotalChart }
