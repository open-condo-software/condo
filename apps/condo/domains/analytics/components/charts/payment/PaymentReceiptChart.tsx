import { Row, Col } from 'antd'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { CustomChartView } from '@condo/domains/analytics/components/CustomChartView'

import { PaymentReceiptDataMapper } from './dataMappers'

import type { IPaymentChartCard } from './dataMappers'


const PaymentReceiptChart: IPaymentChartCard = ({ data }) => {
    const intl = useIntl()
    const ChargedTitle = intl.formatMessage({ id: 'charged' })
    const PaidTitle = intl.formatMessage({ id: 'paymentPaid' })

    const dataMapper = useMemo(() => PaymentReceiptDataMapper(ChargedTitle, PaidTitle), [ChargedTitle, PaidTitle])

    return (
        <Row gutter={[0, 16]}>
            <Col span={24}>
                <Typography.Title level={3}>{ChargedTitle} / {PaidTitle}</Typography.Title>
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

export { PaymentReceiptChart }
