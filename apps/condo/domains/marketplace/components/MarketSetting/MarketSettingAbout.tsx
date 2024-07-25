import { Col, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

const MIDDLE_ROW_GUTTERS: [Gutter, Gutter] = [0, 40]
const SMALL_ROW_GUTTERS: [Gutter, Gutter] = [0, 20]

export const MarketSettingAbout: React.FC = () => {
    const intl = useIntl()
    const DescriptionLabel = intl.formatMessage({ id: 'Description' })
    const DescriptionMessage = intl.formatMessage({ id: 'pages.condo.settings.marketplace.paymentTypesAbout.description.message' })

    return (
        <Row gutter={MIDDLE_ROW_GUTTERS}>
            <Col span={24}>
                <Row gutter={SMALL_ROW_GUTTERS}>
                    <Col span={24}>
                        <Row>
                            <Col span={24} md={5}>
                                <Typography.Text type='secondary'>{DescriptionLabel}</Typography.Text>
                            </Col>
                            <Col span={24} md={19}>
                                <Typography.Text>{DescriptionMessage}</Typography.Text>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Col>
        </Row>
    )
}