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

const PaymentReceiptDataMapper = (chargedTitle: string, paidTitle: string) => new PaymentChart({
    bar: {
        chart: (viewMode, dataset) => {
            const paymentsGroup = groupBy(dataset[0], 'dayGroup')

            const series: Array<EchartsSeries> = [
                {
                    name: chargedTitle,
                    data: dataset[1].map(receipt => [receipt.dayGroup, Number(receipt.sum).toFixed(2)]),
                    type: viewMode,
                    label: { show: true, position: 'top' },
                    barMaxWidth: 40,
                    color: colors.gray['7'],
                },
                {
                    name: paidTitle,
                    data: Object.entries(paymentsGroup).map(([groupLabel, dataObj]) => {
                        return [groupLabel, dataObj.reduce((p, c) => p + parseFloat(c.sum), 0)]
                    }),
                    type: viewMode,
                    label: { show: true, position: 'top' },
                    barMaxWidth: 40,
                    color: colors.green['7'],
                },
            ]

            return {
                legend: [chargedTitle, paidTitle],
                tooltip: { trigger: 'axis', axisPointer: { type: 'line' } },
                axisData: {
                    yAxis: { type: 'value', data: null, boundaryGap: [0, 0.05] },
                    xAxis: {
                        type: 'category',
                        data: Array.from(new Set(...dataset.map(e => e.map(q => q.dayGroup)))) as Array<string>,
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

interface IPaymentReceiptChart {
    ({ data }: { data: PaymentDataType }): React.ReactElement
}

const PaymentReceiptChart: IPaymentReceiptChart = ({ data }) => {
    const intl = useIntl()
    const ChargedTitle = intl.formatMessage({ id: 'Charged' })
    const PaidTitle = intl.formatMessage({ id: 'PaymentPaid' })

    const dataMapper = useMemo(() => PaymentReceiptDataMapper(ChargedTitle, PaidTitle), [ChargedTitle, PaidTitle])

    return (
        <Row gutter={[0, 12]}>
            <Col span={24}>
                <Typography.Title level={3}>{ChargedTitle} / {PaidTitle}</Typography.Title>
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

export { PaymentReceiptChart }
