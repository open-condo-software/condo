import { Col, Row, RowProps } from 'antd'
import React, { useEffect, useState } from 'react'
import { useIntl } from 'react-intl'

import type { DistributionItem } from '@open-condo/billing/utils/paymentSplitter'
import { Input, Switch, Typography } from '@open-condo/ui'

import styles from './distributionItemCard.module.css'

const GUTTER_COMPACT_ROW: RowProps['gutter'] = [8, 8]

type DistributionItemCardProps = {
    index: number
    item: DistributionItem
    onUpdate: (index: number, item: DistributionItem) => void
}

export const DistributionItemCard: React.FC<DistributionItemCardProps> = (props) => {
    const { index, item, onUpdate } = props

    const intl = useIntl()

    const TinTitle = intl.formatMessage({ id: 'components.docs.widgets.amountDistributionCalculator.distributionItemCard.form.items.tin.prefix' })
    const AmountTitle = intl.formatMessage({ id: 'components.docs.widgets.amountDistributionCalculator.distributionItemCard.form.items.amount.prefix' })
    const OrderTitle = intl.formatMessage({ id: 'components.docs.widgets.amountDistributionCalculator.distributionItemCard.form.items.order.prefix' })
    const FeePayerTitle = intl.formatMessage({ id: 'components.docs.widgets.amountDistributionCalculator.distributionItemCard.form.items.isFeePayer.prefix' })
    const VORTitle = intl.formatMessage({ id: 'components.docs.widgets.amountDistributionCalculator.distributionItemCard.form.items.vor.prefix' })
    const OverpaymentTitle = intl.formatMessage({ id: 'components.docs.widgets.amountDistributionCalculator.distributionItemCard.form.items.overpaymentPart.prefix' })

    const [tin, setTin] = useState<string>(item.recipient.tin)
    const [bic] = useState<string>(item.recipient.bic)
    const [bankAccount] = useState<string>(item.recipient.bankAccount)
    const [amount, setAmount] = useState<string>(item.amount)
    const [isFeePayer, setIsFeePayer] = useState<boolean | undefined>(item.isFeePayer)
    const [order, setOrder] = useState<number | undefined>(item.order || 0)
    const [vor, setVor] = useState<boolean | undefined>(item.vor)
    const [overpaymentPart, setOverpaymentPart] = useState<number | undefined>(item.overpaymentPart)

    useEffect(() => {
        onUpdate(index, {
            recipient: { tin, bic, bankAccount },
            amount, isFeePayer, order, vor, overpaymentPart,
        })
    }, [amount, bankAccount, bic, index, isFeePayer, onUpdate, order, overpaymentPart, tin, vor])

    return (
        <Row align='middle' justify='space-between' gutter={GUTTER_COMPACT_ROW}>
            <Col span={24}>
                <Input
                    value={tin}
                    onChange={(e) => {
                        setTin(e.target.value)
                    }}
                    prefix={`${TinTitle}:`}
                />
            </Col>
            <Col span={24}>
                <Input
                    value={amount}
                    onChange={(e) => {
                        setAmount(e.target.value)
                    }}
                    prefix={`${AmountTitle}:`}
                />
            </Col>
            <Col span={24}>
                <Input
                    value={order}
                    onChange={(e) => {
                        const value = Number(e.target.value)
                        setOrder(Number.isNaN(value) ? 0 : value)
                    }}
                    prefix={`${OrderTitle}:`}
                />
            </Col>
            <Col span={18} className={styles.recipientCheckboxRow}><Typography.Text>{FeePayerTitle}:</Typography.Text></Col>
            <Col span={6} className={styles.recipientCheckboxRow}>
                <Switch size='large' checked={isFeePayer} onChange={(checked) => setIsFeePayer(checked)}/>
            </Col>
            <Col span={18} className={styles.recipientCheckboxRow}><Typography.Text>{VORTitle}:</Typography.Text></Col>
            <Col span={6} className={styles.recipientCheckboxRow}>
                <Switch size='large' checked={vor} onChange={(checked) => setVor(checked)}/>
            </Col>
            <Col span={24}>
                <Input
                    value={overpaymentPart}
                    onChange={(e) => {
                        const value = Number(e.target.value)
                        setOverpaymentPart(Number.isNaN(value) ? 0 : value)
                    }}
                    prefix={`${OverpaymentTitle}:`}
                />
            </Col>
        </Row>
    )
}
