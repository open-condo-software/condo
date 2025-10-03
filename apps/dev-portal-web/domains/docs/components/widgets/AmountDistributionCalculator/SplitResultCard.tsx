import { Col, Row, RowProps } from 'antd'
import React from 'react'
import { useIntl } from 'react-intl'

import type { Split } from '@open-condo/billing/utils/paymentSplitter'
import { Card, List } from '@open-condo/ui'

const CARD_PADDING = 8
const GUTTER_ROW: RowProps['gutter'] = [16, 16]

type SplitResultCardProps = {
    splits: Split[]
}

export const SplitResultCard: React.FC<SplitResultCardProps> = (props) => {
    const { splits } = props

    const intl = useIntl()

    const TinTitle = intl.formatMessage({ id: 'components.docs.widgets.amountDistributionCalculator.splitResult.fields.tin.label' })
    const AmountTitle = intl.formatMessage({ id: 'components.docs.widgets.amountDistributionCalculator.splitResult.fields.amount.label' })
    const FeeTitle = intl.formatMessage({ id: 'components.docs.widgets.amountDistributionCalculator.splitResult.fields.fee.label' })

    return (
        <Row gutter={GUTTER_ROW}>
            {splits.map((split, i) => (
                <Col key={i} span={8}>
                    <Card
                        title={`${TinTitle}: ${split.recipient?.tin}`}
                        titlePadding={CARD_PADDING}
                        bodyPadding={CARD_PADDING}
                    >
                        <List
                            size='large'
                            dataSource={[
                                { label: AmountTitle, value: split.amount || '—' },
                                { label: FeeTitle, value: split.feeAmount || '—' },
                            ]}
                        />
                    </Card>
                </Col>
            ))}
        </Row>
    )
}
