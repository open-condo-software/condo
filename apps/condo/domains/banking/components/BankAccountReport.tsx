import styled from '@emotion/styled'
import { Row, Col } from 'antd'
import ReactECharts from 'echarts-for-react'
import get from 'lodash/get'
import React, { useState, useCallback, useRef, useMemo } from 'react'

import { Wallet } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import type { TypographyTextProps } from '@open-condo/ui'
import { Tabs, Card, Typography, Select, Option, Space, Button } from '@open-condo/ui'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'

import type { RowProps } from 'antd'
import type { EChartsOption, EChartsReactProps } from 'echarts-for-react'

const BANK_ACCOUNT_REPORT_ROW_GUTTER: RowProps['gutter'] = [40, 40]
const CHART_COLOR_SET = ['#E45241', '#9036AA', '#4154AE', '#4595EC', '#51B7D1', '#419488', '#96C15B', '#D1DB58', '#FBE960', '#F5C244', '#F29B38']
const CHART_OPTIONS: EChartsReactProps['opts'] = { renderer: 'svg', height: 'auto' }
const BASE_CHART_OPTS: EChartsOption = {
    grid: {
        left: 0,
        right: 0,
        bottom: 0,
        containLabel: true,
        borderWidth: 0,
    },
    tooltip: {
        trigger: 'item',
    },
    legend: {
        orient: 'vertical',
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        itemGap: 12,
        padding: 0,
    },
    color: CHART_COLOR_SET,
}

const LegendContainer = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  
  & > .condo-typography {
    word-break: keep-all;
  }
`
const LegendLabelItem = styled.div<{ color: string }>`
  &:before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 8px;
    margin-right: 16px;
    background-color: ${({ color }) => color};
  }
  
  cursor: pointer;
  word-break: break-word;
`

type InfoCardProps = {
    value: string
    label: string
    icon: React.ReactElement
    isSmall: boolean
    currencyCode?: string
    valueType?: TypographyTextProps['type']
}
interface IInfoCard { (props: InfoCardProps): React.ReactElement }
const InfoCard: IInfoCard = ({ value, currencyCode = 'RUB',  ...props }) => {
    const intl = useIntl()
    const CurrencyValue = intl.formatNumber(parseFloat(value), { style: 'currency', currency: currencyCode })

    const { isSmall, label, icon, valueType } = props
    const bodyPadding = isSmall ? '' : '46px 60px'

    return (
        <Card hoverable bodyPadding={bodyPadding}>
            <Space direction='horizontal' size={40}>
                {icon}
                <Space direction='vertical' size={8}>
                    <Typography.Paragraph>{label}</Typography.Paragraph>
                    <Typography.Title level={2} type={valueType}>{CurrencyValue}</Typography.Title>
                </Space>
            </Space>
        </Card>
    )
}

interface IBankReportContent {
    ({ bankAccountReport, currencyCode }: { bankAccountReport: Record<string, any>, currencyCode?: string }): React.ReactElement
}

const BankAccountReportContent: IBankReportContent = ({ bankAccountReport = {}, currencyCode = 'RUB' }) => {
    const intl = useIntl()
    const PropertyBalanceLabel = intl.formatMessage({ id: 'pages.condo.property.id.propertyReportBalance.title' })
    const IncomeTitle = intl.formatMessage({ id: 'global.income' }, { isSingular: false })
    const WithdrawalTitle = intl.formatMessage({ id: 'global.withdrawal' }, { isSingular: false })

    const { isSmall, isMobile } = useLayoutContext()

    const [activeKey, setActiveKey] = useState(0)
    const chartInstance = useRef(null)

    const chartData = get(bankAccountReport, ['data', 'categoryGroups', activeKey, 'costItemGroups'], [])

    const echartsOption: EChartsOption = {
        ...BASE_CHART_OPTS,
        legend: {
            ...BASE_CHART_OPTS['legend'],
            show: false,
        },
        series: [
            {
                type: 'pie',
                radius: ['80%', '88%'],
                avoidLabelOverlap: true,
                top: 'center',
                left: 'center',
                width: '100%',
                height: '100%',
                emphasis: {
                    label: {
                        show: true,

                        formatter: (e) => {
                            return intl
                                .formatNumber(e.value, { style: 'currency', currency: currencyCode }) + '\n' + e.name
                        },
                    },
                },
                label: {
                    position: 'center',
                    fontSize: 24,
                    formatter: () => {
                        const totalSum = chartData
                            .map(e => e.sum)
                            .reduce((prev, cur) => prev + cur, 0)
                        const value = intl.formatNumber(totalSum, { style: 'currency', currency: currencyCode })

                        return value + '\n Total sum'
                    },
                },
                labelLine: {
                    show: false,
                },
                data: chartData.map(categoryInfo => ({
                    value: categoryInfo.sum,
                    name: categoryInfo.name,
                })),
            },
        ],
    }

    const onChangeTabs = useCallback((key) => {
        setActiveKey(key)
    }, [])
    const onMouseOver = useCallback((item) => () => {
        chartInstance.current.setOption({ series: [{ label: { show: false } }] })
        chartInstance.current._api.dispatchAction({
            type: 'highlight',
            name: item.name,
        })
    }, [])
    const onMouseLeave = useCallback((item) => () => {
        chartInstance.current.setOption({ series: [{ label: { show: true } }] })
        chartInstance.current._api.dispatchAction({
            type: 'downplay',
            name: item.name,
        })
    }, [])
    const onChartEvents = useMemo(() => ({
        mouseover: () => {
            chartInstance.current.setOption({ series: [{ label: { show: false } }] })
        },
        mouseout: () => {
            chartInstance.current.setOption({ series: [{ label: { show: true } }] })
        },
    }), [])

    const tabsItems = bankAccountReport.data.categoryGroups
        .map((reportData, key) => ({ label: reportData.name, key }))

    return (
        <Row gutter={BANK_ACCOUNT_REPORT_ROW_GUTTER}>
            <Col span={24}>
                <Select placeholder='Выберите отчет'>
                    <Option >Март 2022</Option>
                </Select>
            </Col>
            <Col span={24}>
                <Row gutter={BANK_ACCOUNT_REPORT_ROW_GUTTER}>
                    <Col xl={8} md={24} sm={24} xs={24}>
                        <InfoCard
                            value={(bankAccountReport.amount)}
                            label={PropertyBalanceLabel}
                            icon={<Wallet />}
                            isSmall={isSmall}
                            currencyCode={currencyCode}
                        />
                    </Col>
                    <Col xl={8} md={12} sm={24} xs={12}>
                        <InfoCard
                            value={bankAccountReport.totalOutcome}
                            label={WithdrawalTitle}
                            icon={<Wallet />}
                            valueType='danger'
                            isSmall={isSmall}
                            currencyCode={currencyCode}
                        />
                    </Col>
                    <Col xl={8} md={12} sm={24} xs={12}>
                        <InfoCard
                            value={bankAccountReport.totalIncome}
                            label={IncomeTitle}
                            icon={<Wallet />}
                            valueType='success'
                            isSmall={isSmall}
                            currencyCode={currencyCode}
                        />
                    </Col>
                </Row>
            </Col>
            <Col span={24}>
                <Card title='Статьи расходов по дому'>
                    <Tabs items={tabsItems} onChange={onChangeTabs} />
                    <Row gutter={BANK_ACCOUNT_REPORT_ROW_GUTTER} style={{ flexDirection: isSmall || isMobile ? 'column-reverse' : 'row' }}>
                        <Col span={isSmall || isMobile ? 24 : 12}>
                            {chartData.map((item, index) => (
                                <LegendContainer
                                    key={'legend-item-' + index}
                                    onMouseOver={onMouseOver(item)}
                                    onMouseLeave={onMouseLeave(item)}
                                >
                                    <LegendLabelItem color={index < CHART_COLOR_SET.length ? CHART_COLOR_SET[index] : CHART_COLOR_SET[index - CHART_COLOR_SET.length]}>
                                        <Typography.Text>
                                            {item.name}
                                        </Typography.Text>
                                    </LegendLabelItem>
                                    <Typography.Text>
                                        {intl.formatNumber(item.sum, { style: 'currency', currency: currencyCode })}
                                    </Typography.Text>
                                </LegendContainer>
                            ))}
                        </Col>
                        <Col span={isSmall || isMobile ? 24 : 12}>
                            <ReactECharts
                                onChartReady={(instance) => chartInstance.current = instance}
                                opts={CHART_OPTIONS}
                                onEvents={onChartEvents}
                                option={echartsOption}
                            />
                        </Col>
                    </Row>
                </Card>
            </Col>
        </Row>
    )
}

const BANK_REPORT_MOCK_DATA = {
    amount: 1234567,
    amountAt: new Date(),
    totalIncome: 82312,
    totalOutcome: 22312,
    data: {
        categoryGroups: [
            {
                id: 'categoryGroupId1',
                name: 'First category',
                costItemGroups: [
                    { sum: 104, name: 'Cost Item 1 dfasdasdasda sdasdasd sdasdasdasdasd asdasdasd asdasd as ' },
                    { sum: 735, name: 'Cost Item 2' },
                    { sum: 580, name: 'Cost Item 3' },
                    { sum: 484, name: 'Cost Item 4' },
                    { sum: 300, name: 'Cost Item 6' },
                    { sum: 300, name: 'Cost Item 7' },
                    { sum: 300, name: 'Cost Item 8' },
                    { sum: 300, name: 'Cost Item 9' },
                    { sum: 300, name: 'Cost Item 10' },
                    { sum: 300, name: 'Cost Item 11' },
                    { sum: 300, name: 'Cost Item 12' },
                    { sum: 300, name: 'Cost Item 13' },
                    { sum: 300, name: 'Cost Item 14' },
                    { sum: 300, name: 'Cost Item 15' },
                ],
            },
            {
                id: 'categoryGroupId2',
                name: 'Second category',
                costItemGroups: [
                    { sum: 204, name: 'Cost Item 21' },
                    { sum: 535, name: 'Cost Item 22' },
                    { sum: 480, name: 'Cost Item 23' },
                    { sum: 284, name: 'Cost Item 24' },
                    { sum: 100, name: 'Cost Item 25' },
                ],
            },
        ],
    },
}

const BankAccountReport = () => {

    return (
        <Row>
            <Col span={24}>
                <BankAccountReportContent bankAccountReport={BANK_REPORT_MOCK_DATA} />
            </Col>
        </Row>
    )
}

export {
    BankAccountReport,
}
