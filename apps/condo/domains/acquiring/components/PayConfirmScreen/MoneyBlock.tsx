import React, { useMemo, CSSProperties } from 'react'
import { MessageDescriptor } from '@formatjs/intl/src/types'
import { useIntl } from '@condo/next/intl'
import Big from 'big.js'
import { Row, Col, Typography } from 'antd'
import { getMoneyRender } from '@condo/domains/common/components/Table/Renders'

interface IMoneyBlockProps {
    titleDescriptor: MessageDescriptor,
    amount: string,
    currencyCode: string,
    hideOnZero?: boolean,
}

const TITLE_STYLES: CSSProperties = {
    fontSize: 16,
    fontWeight: 700,
}

const MONEY_STYLES: CSSProperties = {
    fontSize: 20,
    fontWeight: 700,
}

export const MoneyBlock: React.FC<IMoneyBlockProps> = ({
    titleDescriptor,
    amount,
    currencyCode,
    hideOnZero,
}) => {
    const intl = useIntl()
    const render = useMemo(() => {
        return getMoneyRender(intl, currencyCode)
    }, [intl, currencyCode])

    const isPositive = amount && Big(amount).gt(0)

    if (!isPositive && hideOnZero) return null

    const TitleLabel = intl.formatMessage(titleDescriptor)

    return (
        <Row gutter={[0, 4]}>
            <Col span={24}>
                <Typography.Text type={'secondary'} style={TITLE_STYLES}>
                    {TitleLabel}
                </Typography.Text>
            </Col>
            <Col span={24}>
                <Typography.Text style={MONEY_STYLES}>
                    {render(amount)}
                </Typography.Text>
            </Col>
        </Row>
    )
}