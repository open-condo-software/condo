import { Row, Col } from 'antd'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { CustomChartView } from '@condo/domains/analytics/components/CustomChartView'

import { ResidentByPropertyDataMapper } from './dataMappers'

import type { IResidentChartCard } from './dataMappers'

const ResidentByPropertyChart: IResidentChartCard = ({ data }) => {
    const intl = useIntl()
    const ChartTitle = intl.formatMessage({ id: 'reports.residentsTitle' })
    const ResidentTitle = intl.formatMessage({ id: 'global.section.contacts' })

    const dataMapper = useMemo(() => ResidentByPropertyDataMapper(ResidentTitle), [ResidentTitle])

    return (
        <Row gutter={[0, 16]}>
            <Col span={24}>
                <Typography.Title level={3}>{ChartTitle}</Typography.Title>
            </Col>
            <Col span={24}>
                <CustomChartView
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
