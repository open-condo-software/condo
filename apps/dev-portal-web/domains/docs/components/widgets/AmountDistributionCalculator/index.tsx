import { Col, Row, RowProps } from 'antd'
import React, { useCallback, useEffect, useState } from 'react'
import { useIntl } from 'react-intl'

import { split, createRecipientKey } from '@open-condo/billing/utils/paymentSplitter'
import type { Split, DistributionItem, SplitOptions } from '@open-condo/billing/utils/paymentSplitter'
import { Plus, Trash } from '@open-condo/icons'
import { Alert, Button, Card, Input, MarkdownCodeWrapper, Tabs, Typography } from '@open-condo/ui'

import { DistributionItemCard } from './DistributionItemCard'
import { SplitResultCard } from './SplitResultCard'

const CARD_PADDING = 8
const GUTTER_ROW: RowProps['gutter'] = [16, 16]

function generateDecimalString (length: number): string {
    return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('') // NOSONAR
}

function generateRandomDistributionItem (): DistributionItem {
    return {
        recipient: {
            tin: generateDecimalString(8),
            bic: generateDecimalString(10),
            bankAccount: generateDecimalString(20),
        },
        amount: '0',
        isFeePayer: false,
        vor: false,
    }
}

export const AmountDistributionCalculator: React.FC = () => {
    const intl = useIntl()
    const [paymentAmount, setPaymentAmount] = useState<string>('1000')
    const [distributions, setDistributions] = useState<DistributionItem[]>([])
    const [options, setOptions] = useState<SplitOptions>({ feeAmount: '100', decimalPlaces: 2 })
    const [splitResult, setSplitResult] = useState<Split[]>([])
    const [splitError, setSplitError] = useState<string>()
    const [currentTab, setCurrentTab] = useState<string>()

    const PaymentTitle = intl.formatMessage({ id: 'docs.widgets.amountDistributionCalculator.paymentSettings.title' })
    const PaymentAmountTitle = intl.formatMessage({ id: 'docs.widgets.amountDistributionCalculator.paymentSettings.amount.title' })
    const PaymentFeeTitle = intl.formatMessage({ id: 'docs.widgets.amountDistributionCalculator.paymentSettings.fee.title' })
    const RecipientsTitle = intl.formatMessage({ id: 'docs.widgets.amountDistributionCalculator.recipients.title' })
    const OptionsTitle = intl.formatMessage({ id: 'docs.widgets.amountDistributionCalculator.splitOptions.title' })
    const DecimalPlacesTitle = intl.formatMessage({ id: 'docs.widgets.amountDistributionCalculator.options.decimalPlaces' })
    const AmountDistributionValueTitle = intl.formatMessage({ id: 'docs.widgets.amountDistributionCalculator.amountDistributionFieldValue.title' })
    const SplitResultTitle = intl.formatMessage({ id: 'docs.widgets.amountDistributionCalculator.splitResultCard.title' })

    useEffect(() => {
        if (distributions.length === 0) {
            setSplitResult([])
            setSplitError(undefined)
        } else {
            try {
                const result = split(paymentAmount, distributions, options)
                setSplitError(undefined)
                setSplitResult(result as Split[])
            } catch (error: any) {
                setSplitError(error.message)
                setSplitResult([])
            }
        }
    }, [distributions, options, paymentAmount])

    const updateDistributionItem = useCallback((index: number, item: DistributionItem) => {
        setDistributions((prevDistributions) => {
            const newDistributions = [...prevDistributions]
            newDistributions[index] = item

            return newDistributions
        })
    }, [])

    const onUpdateItem = useCallback((index: number, item: DistributionItem) => {
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
                                            titlePadding={CARD_PADDING}
                                            bodyPadding={CARD_PADDING}
                                        >
                                            <DistributionItemCard
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
                        <Col span={24}>
                            <Typography.Title level={4}>{AmountDistributionValueTitle}</Typography.Title>
                        </Col>
                        <Col span={24}>
                            <MarkdownCodeWrapper className='language-json'>
                                {JSON.stringify(distributions)}
                            </MarkdownCodeWrapper>
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
                    <Col span={24}><SplitResultCard splits={splitResult}/></Col>
                )
            }
        </Row>
    )
}
