import { Row, Col } from 'antd'
import React, { useMemo } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useIntl } from '@open-condo/next/intl'
import { Alert, Typography } from '@open-condo/ui'

import { CustomChartView, CHART_CONTAINER_HEIGHT } from '@condo/domains/analytics/components/CustomChartView'
import { UI_HIDE_PAID_FEATURES } from '@condo/domains/common/constants/featureflags'
import { SubscriptionGuardWithTooltip } from '@condo/domains/subscription/components'

import { PaymentTotalDataMapper } from './dataMappers'

import type { IPaymentChartCard } from './dataMappers'

const PaymentTotalChart: IPaymentChartCard = ({ data }) => {
    const intl = useIntl()
    const { useFlag } = useFeatureFlags()
    const hidePaidFeatures = useFlag(UI_HIDE_PAID_FEATURES)
    const ChartTitle = intl.formatMessage({ id: 'pages.reports.paymentsTotal' })
    const SumTitle = intl.formatMessage({ id: 'global.sum' })
    const PaymentCountTitle = intl.formatMessage({ id: 'pages.reports.paymentCount' })
    const MarketplaceHint = intl.formatMessage({ id: 'pages.reports.paymentsTotalMarketplaceHint' })

    const dataMapper = useMemo(() => PaymentTotalDataMapper(SumTitle, PaymentCountTitle), [SumTitle, PaymentCountTitle])

    return (
        <Row gutter={[0, 16]}>
            <Col span={24}>
                <Typography.Title level={3}>{ChartTitle}</Typography.Title>
            </Col>

            {!hidePaidFeatures && data.length > 0 &&
                <SubscriptionGuardWithTooltip
                    feature='marketplace'
                    placement='bottom'
                    children={null}
                    tooltipButtonId='PaymentTotalChartSubscriprionTooltip'
                    fallback={
                        <Alert
                            showIcon
                            type='info'
                            description={MarketplaceHint}
                        />
                    }
                />
            }

            <Col span={24}>
                <CustomChartView
                    viewMode='bar'
                    data={data}
                    mapperInstance={dataMapper}
                    chartConfig={{ chartOptions: { height: CHART_CONTAINER_HEIGHT }, animationEnabled: true }}
                />
            </Col>
        </Row>
    )
}

export { PaymentTotalChart }
