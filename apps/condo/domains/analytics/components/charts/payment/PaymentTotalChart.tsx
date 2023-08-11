import { Row, Col } from 'antd'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { CustomChartView } from '@condo/domains/analytics/components/CustomChartView'

import { PaymentTotalDataMapper } from './dataMappers'

import type { IPaymentChartCard } from './dataMappers'

const PaymentTotalChart: IPaymentChartCard = ({ data }) => {
    const intl = useIntl()
    const ChartTitle = intl.formatMessage({ id: 'reports.paymentsTotal' })
    const SumTitle = intl.formatMessage({ id: 'global.sum' })
    const PaymentCountTitle = intl.formatMessage({ id: 'reports.paymentCount' })

    const dataMapper = useMemo(() => PaymentTotalDataMapper(SumTitle, PaymentCountTitle), [SumTitle, PaymentCountTitle])

    return (
        <Row gutter={[0, 16]}>
            <Col span={24}>
                <Typography.Title level={3}>{ChartTitle}</Typography.Title>
            </Col>
            <Col span={24}>
                <CustomChartView
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
