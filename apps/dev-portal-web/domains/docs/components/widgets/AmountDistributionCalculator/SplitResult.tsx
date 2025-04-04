import { Col, Row, RowProps } from 'antd'
import React from 'react'
import { useIntl } from 'react-intl'

import type { TSplit } from '@open-condo/billing/utils/paymentSplitter'
import { Card, List } from '@open-condo/ui'

const CARD_PADDING = 8
const GUTTER_ROW: RowProps['gutter'] = [16, 16]

type TSplitResultProps = {
    splits: TSplit[]
}

export const SplitResult: React.FC<TSplitResultProps> = (props) => {
    const { splits } = props

    const intl = useIntl()

    const TinTitle = intl.formatMessage({ id: 'docs.widgets.amountDistributionCalculator.tin' })
    const AmountTitle = intl.formatMessage({ id: 'docs.widgets.amountDistributionCalculator.amount' })
    const FeeTitle = intl.formatMessage({ id: 'docs.widgets.amountDistributionCalculator.fee' })

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
