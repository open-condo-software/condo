import { Col, Row, RowProps } from 'antd'
import React, { useEffect, useState } from 'react'
import { useIntl } from 'react-intl'

import type { TDistributionItem } from '@open-condo/billing/utils/paymentSplitter'
import { Input, Switch, Typography } from '@open-condo/ui'

import styles from './distributionItem.module.css'

const GUTTER_COMPACT_ROW: RowProps['gutter'] = [8, 8]

type DistributionItemProps = {
    index: number
    item: TDistributionItem
    onUpdate: (index: number, item: TDistributionItem) => void
}

export const DistributionItem: React.FC<DistributionItemProps> = (props) => {
    const { index, item, onUpdate } = props

    const intl = useIntl()

    const TinTitle = intl.formatMessage({ id: 'docs.widgets.amountDistributionCalculator.tin' })
    const AmountTitle = intl.formatMessage({ id: 'docs.widgets.amountDistributionCalculator.amount' })
    const OrderTitle = intl.formatMessage({ id: 'docs.widgets.amountDistributionCalculator.order' })
    const FeePayerTitle = intl.formatMessage({ id: 'docs.widgets.amountDistributionCalculator.isFeePayer' })
    const VORTitle = intl.formatMessage({ id: 'docs.widgets.amountDistributionCalculator.vor' })
    const OverpaymentTitle = intl.formatMessage({ id: 'docs.widgets.amountDistributionCalculator.overpaymentPart' })

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
