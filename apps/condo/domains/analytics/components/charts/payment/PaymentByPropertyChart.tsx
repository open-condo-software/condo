import { Row, Col } from 'antd'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { CustomChartView } from '@condo/domains/analytics/components/CustomChartView'

import { PaymentByPropertyDataMapper } from './dataMappers'

import type { IPaymentChartCard } from './dataMappers'

const PaymentByPropertyChart: IPaymentChartCard = ({ data }) => {
    const intl = useIntl()
    const ChartTitle = intl.formatMessage({ id: 'reports.paymentsByProperty' })
    const PaidTitle = intl.formatMessage({ id: 'paymentPaid' })

    const dataMapper = useMemo(() => PaymentByPropertyDataMapper(PaidTitle), [PaidTitle])

    return (
        <Row gutter={[0, 16]}>
            <Col span={24}>
                <Typography.Title level={3}>{ChartTitle}</Typography.Title>
            </Col>
            <Col span={24}>
                <CustomChartView
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
