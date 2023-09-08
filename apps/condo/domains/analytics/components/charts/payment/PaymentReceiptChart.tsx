import { Row, Col } from 'antd'
import React, { useMemo } from 'react'

import { Info } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Typography, Tooltip, Space } from '@open-condo/ui'

import { CustomChartView } from '@condo/domains/analytics/components/CustomChartView'

import { PaymentReceiptDataMapper } from './dataMappers'

import type { IPaymentChartCard } from './dataMappers'

const PaymentReceiptChart: IPaymentChartCard = ({ data }) => {
    const intl = useIntl()
    const ChargedTitle = intl.formatMessage({ id: 'Charged' })
    const PaidTitle = intl.formatMessage({ id: 'PaymentPaid' })
    const PaymentTooltipTitle = intl.formatMessage({ id: 'pages.reports.paymentTooltip' })

    const dataMapper = useMemo(() => PaymentReceiptDataMapper(ChargedTitle, PaidTitle), [ChargedTitle, PaidTitle])

    return (
        <Row gutter={[0, 16]}>
            <Col span={24}>
                <Tooltip title={PaymentTooltipTitle}>
                    <Space size={12} direction='horizontal' align='center'>
                        <Typography.Title level={3}>
                            {ChargedTitle} / {PaidTitle}
                        </Typography.Title>
                        <Info size='small' />
                    </Space>
                </Tooltip>
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
