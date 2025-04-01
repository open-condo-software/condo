import { faker } from '@faker-js/faker'
import { Col, Row, RowProps } from 'antd'
import React, { useCallback, useEffect, useState } from 'react'
import { useIntl } from 'react-intl'

import { Plus, Trash } from '@open-condo/icons'
import { Alert, Button, Card, Input, List, MarkdownCodeWrapper, Switch, Tabs, Typography } from '@open-condo/ui'

import { split, createRecipientKey } from '@condo/domains/acquiring/utils/billingCentrifuge'

type TRecipient = {
    tin: string
    bic: string
    bankAccount: string
}

type TSplit = {
    recipient: TRecipient | null
    amount?: string
    feeAmount?: string
}

type TDistributionItem = {
    recipient: TRecipient
    amount: string
    isFeePayer?: boolean
    order?: number
    vor?: boolean
    overpaymentPart?: number
}

type TSplitOptions = {
    appliedSplits?: TSplit[]
    decimalPlaces?: number
    feeAmount?: string
}

type TDistributionItemProps = {
    index: number
    item: TDistributionItem
    onUpdate: (index: number, item: TDistributionItem) => void
}

const PADDING = 8
const GUTTER_COMPACT_ROW: RowProps['gutter'] = [PADDING, PADDING]
const GUTTER_ROW: RowProps['gutter'] = [16, 16]

const DistributionItem: React.FC<TDistributionItemProps> = (props) => {
    const { index, item, onUpdate } = props

    const intl = useIntl()

    const TinTitle = intl.formatMessage({ id: 'amountDistributionCalculator.tin' })
    const AmountTitle = intl.formatMessage({ id: 'amountDistributionCalculator.amount' })
    const OrderTitle = intl.formatMessage({ id: 'amountDistributionCalculator.order' })
    const FeePayerTitle = intl.formatMessage({ id: 'amountDistributionCalculator.isFeePayer' })
    const VORTitle = intl.formatMessage({ id: 'amountDistributionCalculator.vor' })
    const OverpaymentTitle = intl.formatMessage({ id: 'amountDistributionCalculator.overpaymentPart' })

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
                <Input value={tin} onChange={(e) => {
                    setTin(e.target.value)
                }} prefix={`${TinTitle}:`}/>
            </Col>
            <Col span={24}>
                <Input value={amount} onChange={(e) => {
                    setAmount(e.target.value)
                }} prefix={`${AmountTitle}:`}/>
            </Col>
            <Col span={24}>
                <Input value={order} onChange={(e) => {
                    try {
                        setOrder(Number(e.target.value))
                    } catch (err) {
                        setOrder(0)
                    }
                }} prefix={`${OrderTitle}:`}/>
            </Col>
            <Col span={24}>
                <Row gutter={0} align='middle' justify='space-between'>
                    <Col><Typography.Text>{FeePayerTitle}:</Typography.Text></Col>
                    <Col>
                        <Switch size='large' checked={isFeePayer} onChange={(checked) => setIsFeePayer(checked)}/>
                    </Col>
                </Row>
            </Col>
            <Col span={24}>
                <Row gutter={0} align='middle' justify='space-between'>
                    <Col><Typography.Text>{VORTitle}:</Typography.Text></Col>
                    <Col>
                        <Switch size='large' checked={vor} onChange={(checked) => setVor(checked)}/>
                    </Col>
                </Row>
            </Col>
            <Col span={24}>
                <Input value={overpaymentPart} onChange={(e) => {
                    try {
                        setOverpaymentPart(Number(e.target.value))
                    } catch (err) {
                        setOverpaymentPart(0)
                    }
                }} prefix={`${OverpaymentTitle}:`}/>
            </Col>
        </Row>
    )
}

type TSplitResultProps = {
    splits: TSplit[]
}

const SplitResult: React.FC<TSplitResultProps> = (props) => {
    const { splits } = props

    const intl = useIntl()

    const TinTitle = intl.formatMessage({ id: 'amountDistributionCalculator.tin' })
    const AmountTitle = intl.formatMessage({ id: 'amountDistributionCalculator.amount' })
    const FeeTitle = intl.formatMessage({ id: 'amountDistributionCalculator.fee' })

    return (
        <Row gutter={GUTTER_ROW}>
            {splits.map((split, i) => (
                <Col key={i} span={8}>
                    <Card
                        title={`${TinTitle}: ${split.recipient?.tin}`}
                        titlePadding={PADDING}
                        bodyPadding={PADDING}
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

function generateRandomDistributionItem (): TDistributionItem {
    return {
        recipient: {
            tin: faker.datatype.number().toString(),
            bic: faker.datatype.number().toString(),
            bankAccount: faker.datatype.number().toString(),
        },
        amount: '0',
        isFeePayer: false,
        vor: false,
    }
}

export const AmountDistributionCalculator: React.FC = () => {
    const intl = useIntl()
    const [paymentAmount, setPaymentAmount] = useState<string>('1000')
    const [distributions, setDistributions] = useState<TDistributionItem[]>([])
    const [options, setOptions] = useState<TSplitOptions>({ feeAmount: '100', decimalPlaces: 3 })
    const [splitResult, setSplitResult] = useState<TSplit[]>([])
    const [splitError, setSplitError] = useState<string>()
    const [currentTab, setCurrentTab] = useState<string>()

    const PaymentTitle = intl.formatMessage({ id: 'amountDistributionCalculator.paymentSettings' })
    const PaymentAmountTitle = intl.formatMessage({ id: 'amountDistributionCalculator.paymentAmount' })
    const PaymentFeeTitle = intl.formatMessage({ id: 'amountDistributionCalculator.paymentFee' })
    const RecipientsTitle = intl.formatMessage({ id: 'amountDistributionCalculator.recipients' })
    const OptionsTitle = intl.formatMessage({ id: 'amountDistributionCalculator.splitOptions' })
    const DecimalPlacesTitle = intl.formatMessage({ id: 'amountDistributionCalculator.decimalPlaces' })
    const AmountDistributionValueTitle = intl.formatMessage({ id: 'amountDistributionCalculator.amountDistributionFieldValue' })
    const SplitResultTitle = intl.formatMessage({ id: 'amountDistributionCalculator.splitResultTitle' })

    useEffect(() => {
        if (distributions.length === 0) {
            setSplitResult([])
            setSplitError(undefined)
        } else {
            try {
                const result = split(paymentAmount, distributions, options)
                setSplitError(undefined)
                setSplitResult(result as TSplit[])
            } catch (error: any) {
                setSplitError(error.message)
                setSplitResult([])
            }
        }
    }, [distributions, options, paymentAmount])

    const updateDistributionItem = useCallback((index: number, item: TDistributionItem) => {
        setDistributions((prevDistributions) => {
            const newDistributions = [...prevDistributions]
            newDistributions[index] = item

            return newDistributions
        })
    }, [])

    const onUpdateItem = useCallback((index: number, item: TDistributionItem) => {
        updateDistributionItem(index, item)
    }, [updateDistributionItem])

    return (
        <Row gutter={GUTTER_ROW} align='stretch' justify='start'>
            <Col>
                <Tabs
                    activeKey={currentTab}
                    onChange={setCurrentTab}
                    items={[{
                        label: PaymentTitle, key: 'payment', children: (
                            <Row gutter={GUTTER_ROW} align='stretch' justify='start'>
                                <Col span={12}>
                                    <Input
                                        value={paymentAmount}
                                        onChange={e => setPaymentAmount(e.target.value)}
                                        prefix={`${PaymentAmountTitle}:`}
                                    />
                                </Col>
                                <Col span={12}>
                                    <Input
                                        value={options.feeAmount}
                                        onChange={e => setOptions((prevOptions) => ({
                                            ...prevOptions,
                                            feeAmount: e.target.value,
                                        }))}
                                        prefix={`${PaymentFeeTitle}:`}
                                    />
                                </Col>
                            </Row>
                        ),
                    }, {
                        label: RecipientsTitle, key: 'recipients', children: (
                            <Row gutter={GUTTER_ROW} align='stretch' justify='start'>
                                {distributions.map((distribution, i) => (
                                    <Col key={createRecipientKey(distribution.recipient)} span={8}>
                                        <Card
                                            title={
                                                <Row align='middle' justify='end' gutter={0}>
                                                    <Col>
                                                        <Button.Icon
                                                            size='small'
                                                            onClick={() => {
                                                                setDistributions((prev) => {
                                                                    return prev.filter((_, index) => index !== i)
                                                                })
                                                            }}
                                                        >
                                                            <Trash/>
                                                        </Button.Icon>
                                                    </Col>
                                                </Row>
                                            }
                                            titlePadding={PADDING}
                                            bodyPadding={PADDING}
                                        >
                                            <DistributionItem
                                                onUpdate={onUpdateItem}
                                                index={i}
                                                item={distribution}
                                            />
                                        </Card>
                                    </Col>
                                ))}
                                <Col span={8}>
                                    <Card width='100%'>
                                        <Row align='bottom' justify='center' gutter={0}>
                                            <Col>
                                                <Button.Icon
                                                    onClick={() => setDistributions([...distributions, generateRandomDistributionItem()])}
                                                >
                                                    <Plus/>
                                                </Button.Icon>
                                            </Col>
                                        </Row>
                                    </Card>
                                </Col>
                            </Row>
                        ),
                    }, {
                        label: OptionsTitle, key: 'options', children: (
                            <Row gutter={GUTTER_ROW} align='stretch' justify='start'>
                                <Col span={24}>
                                    <Input
                                        value={options.decimalPlaces}
                                        onChange={e => setOptions((prevOptions) => {
                                            try {
                                                return {
                                                    ...prevOptions,
                                                    decimalPlaces: Number(e.target.value),
                                                }
                                            } catch (err) {
                                                return {
                                                    ...prevOptions,
                                                    decimalPlaces: 2,
                                                }
                                            }
                                        })}
                                        prefix={`${DecimalPlacesTitle}:`}
                                    />
                                </Col>
                            </Row>
                        ),
                    }]}
                    destroyInactiveTabPane
                />
            </Col>
            {
                distributions.length > 0 && (
                    <>
                        <Col span={24}><Typography.Title
                            level={4}>{AmountDistributionValueTitle}</Typography.Title></Col>
                        <Col span={24}>
                            <MarkdownCodeWrapper
                                className='language-json'>{JSON.stringify(distributions)}</MarkdownCodeWrapper>
                        </Col>
                    </>
                )
            }
            {
                ((!!splitResult && splitResult.length > 0) || !!splitError) && (
                    <Col span={24}><Typography.Title level={4}>{SplitResultTitle}</Typography.Title></Col>
                )
            }
            {
                !!splitError && (
                    <Col span={24}>
                        <Alert type='error' description={splitError} message='Code exception' showIcon/>
                    </Col>
                )
            }
            {
                !!splitResult && splitResult.length > 0 && (
                    <Col span={24}><SplitResult splits={splitResult}/></Col>
                )
            }
        </Row>
    )
}
