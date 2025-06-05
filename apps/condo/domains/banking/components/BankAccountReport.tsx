import styled from '@emotion/styled'
import { Row, Col } from 'antd'
import dayjs from 'dayjs'
import ReactECharts from 'echarts-for-react'
import find from 'lodash/find'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react'

import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { Tabs, Card, Typography, Select, SelectProps, Space } from '@open-condo/ui'
import type { TypographyTitleProps } from '@open-condo/ui'
import type { CardProps } from '@open-condo/ui'

import { useBankReportTaskButton } from '@condo/domains/banking/hooks/useBankReportTaskUIInterface'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { TotalBalanceIcon, BalanceOutIcon, BalanceInIcon } from '@condo/domains/common/components/icons/TotalBalance'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'

import type { BankAccountReport as BankAccountReportType, OrganizationEmployeeRole as OrganizationEmployeeRoleType } from '@app/condo/schema'
import type { BankAccount as BankAccountType } from '@app/condo/schema'
import type { RowProps } from 'antd'
import type { EChartsOption, EChartsReactProps } from 'echarts-for-react'

const { publicRuntimeConfig: { defaultCurrencyCode } } = getConfig()

const BANK_ACCOUNT_REPORT_ROW_GUTTER: RowProps['gutter'] = [40, 40]
const LABEL_TRUNCATE_LENGTH = 17
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
    color: CHART_COLOR_SET,
}
const BASE_CHART_SERIES_CONFIG = {
    type: 'pie',
    radius: ['80%', '88%'],
    avoidLabelOverlap: true,
    top: 'center',
    left: 'center',
    width: '100%',
    height: '100%',
    labelLine: { show: false },
}

function truncate (str: string, n: number): string {
    return str.length > n ? str.slice(0, n - 1) + '...' : str
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
    onClick?: CardProps['onClick']
    currencyCode?: string
    valueType?: TypographyTitleProps['type']
    hoverable?: CardProps['hoverable']
}
interface IInfoCard { (props: InfoCardProps): React.ReactElement }
const InfoCard: IInfoCard = ({ value, currencyCode = defaultCurrencyCode,  ...props }) => {
    const intl = useIntl()
    const CurrencyValue = intl.formatNumber(parseFloat(value), { style: 'currency', currency: currencyCode })

    const { isSmall, label, icon, valueType, hoverable = false } = props

    return (
        <Card hoverable={hoverable} onClick={props.onClick}>
            <Space
                direction={isSmall ? 'vertical' : 'horizontal'}
                size={isSmall ? 20 : 40}
                align='center'
                width='100%'
            >
                {icon}
                <Space direction='vertical' size={8} align={isSmall ? 'center' : 'start' }>
                    <Typography.Paragraph>{label}</Typography.Paragraph>
                    <Typography.Title level={2} type={valueType}>{CurrencyValue}</Typography.Title>
                </Space>
            </Space>
        </Card>
    )
}

interface IBankReportContent {
    ({ bankAccountReports, currencyCode }: { bankAccountReports: Array<BankAccountReportType>, currencyCode?: string }
    ): React.ReactElement
}

enum ReportCategories {
    'Income',
    'Withdrawal',
}

const BankAccountReportContent: IBankReportContent = ({ bankAccountReports = [], currencyCode = defaultCurrencyCode }) => {
    const intl = useIntl()
    const PropertyBalanceLabel = intl.formatMessage({ id: 'pages.condo.property.id.propertyReportBalance.title' })
    const IncomeTitle = intl.formatMessage({ id: 'global.income' }, { isSingular: false })
    const WithdrawalTitle = intl.formatMessage({ id: 'global.withdrawal' }, { isSingular: false })
    const ChooseReportTitle = intl.formatMessage({ id: 'pages.condo.property.id.propertyReport.chooseReportTitle' })
    const ReportCardWithdrawalTitle = intl.formatMessage({ id: 'pages.condo.property.id.propertyReport.reportCardTitle.withdrawal' })
    const ReportCardIncomeTitle = intl.formatMessage({ id: 'pages.condo.property.id.propertyReport.reportCardTitle.income' })
    const NoDataTitle = intl.formatMessage({ id: 'NoData' })

    const { breakpoints, isMobile } = useLayoutContext()
    const router = useRouter()

    const [activeTab, setActiveTab] = useState(get(bankAccountReports, '0.data.categoryGroups.0.id'))
    const [selectedPeriod, setSelectedPeriod] = useState(get(router, 'query.period') || get(bankAccountReports, '0.period'))
    const [activeCategory, setActiveCategory] = useState<ReportCategories>(ReportCategories.Withdrawal)
    const chartInstance = useRef(null)

    const bankAccountReport = find(bankAccountReports, { period: selectedPeriod })
    const categoryGroups = get(bankAccountReport, 'data.categoryGroups', []).filter(categoryGroup => {
        if (activeCategory === ReportCategories.Income) {
            return categoryGroup.costItemGroups.some(item => item.isOutcome === false)
        } else if (activeCategory === ReportCategories.Withdrawal) {
            return categoryGroup.costItemGroups.some(item => item.isOutcome === true)
        }
    })

    let chartData = get(find(categoryGroups, { id: activeTab }), 'costItemGroups', [])
    chartData = chartData.filter(costItemGroup => {
        if (activeCategory === ReportCategories.Withdrawal) {
            return costItemGroup.isOutcome === true
        }

        if (activeCategory === ReportCategories.Income) {
            return costItemGroup.isOutcome === false
        }
    })


    const echartsOption: EChartsOption = useMemo(() => ({
        ...BASE_CHART_OPTS,
        legend: { show: false },
        series: [
            {
                ...BASE_CHART_SERIES_CONFIG,
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 24,
                        formatter: (e) => {
                            const amountValue = intl
                                .formatNumber(e.value, { style: 'currency', currency: currencyCode }) + '\n'
                            return amountValue + truncate(e.name, LABEL_TRUNCATE_LENGTH)
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
                        const value = intl.formatNumber(totalSum, { style: 'currency', currency: currencyCode }) + '\n'
                        const isOutcome = get(chartData, '0.isOutcome', false)

                        return value + truncate(intl.formatMessage({ id: 'pages.condo.property.id.propertyReport.totalSumTitle' }, {
                            sumItem: isOutcome ? WithdrawalTitle.toLowerCase() : IncomeTitle.toLowerCase(),
                        }), LABEL_TRUNCATE_LENGTH)
                    },
                },
                data: chartData.map(categoryInfo => ({
                    value: categoryInfo.sum,
                    name: intl.formatMessage({ id: `banking.costItem.${categoryInfo.name}.name` as FormatjsIntl.Message['ids'] }),
                    isOutcome: categoryInfo.isOutcome,
                })),
            },
        ],
    }), [chartData, WithdrawalTitle, IncomeTitle, currencyCode, intl])

    const onChangeTabs = useCallback((key) => {
        setActiveTab(key)
    }, [])
    const onReportPeriodSelectChange = useCallback(async (period) => {
        setSelectedPeriod(period)

        if (!isEmpty(bankAccountReports)) {
            await router.replace({
                pathname: router.pathname,
                query: { ...router.query, period },
            }, undefined, { shallow: true })
        }
    }, [router, bankAccountReports])
    const onMouseOver = useCallback((itemName) => () => {
        chartInstance.current.setOption({ series: [{ label: { show: false } }] })
        chartInstance.current._api.dispatchAction({
            type: 'highlight',
            name: itemName,
        })
    }, [])
    const onMouseLeave = useCallback((itemName) => () => {
        chartInstance.current.setOption({ series: [{ label: { show: true } }] })
        chartInstance.current._api.dispatchAction({
            type: 'downplay',
            name: itemName,
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

    const tabsItems = useMemo(() => categoryGroups
        .map(reportData => ({
            label: intl.formatMessage({ id: `banking.category.${reportData.name}.name` as FormatjsIntl.Message['ids'] }),
            key: reportData.id,
        }))
    , [categoryGroups, intl])
    const reportOptionItems: SelectProps['options'] = useMemo(() => bankAccountReports
        .map((bankAccountReport) => ({
            label: dayjs(bankAccountReport.period).format('MMMM YYYY'),
            key: bankAccountReport.id,
            value: bankAccountReport.period,
        })), [bankAccountReports])
    const chartLegendItems = useMemo(() => {
        return chartData.map((item, index) => {
            const itemName = intl.formatMessage({ id: `banking.costItem.${item.name}.name` as FormatjsIntl.Message['ids'] })
            return (
                <LegendContainer
                    key={'legend-item-' + index}
                    onMouseOver={onMouseOver(itemName)}
                    onMouseLeave={onMouseLeave(itemName)}
                >
                    <LegendLabelItem
                        color={index < CHART_COLOR_SET.length ? CHART_COLOR_SET[index] : CHART_COLOR_SET[index - CHART_COLOR_SET.length]}
                    >
                        <Typography.Text>
                            {itemName}
                        </Typography.Text>
                    </LegendLabelItem>
                    <Typography.Text>
                        {intl.formatNumber(item.sum, { style: 'currency', currency: currencyCode })}
                    </Typography.Text>
                </LegendContainer>
            )
        })
    }, [chartData, intl, currencyCode, onMouseLeave, onMouseOver])
    const emptyPlaceholder = useMemo(() => (
        <BasicEmptyListView image='/dino/searching@2x.png'>
            <Typography.Title level={5}>{NoDataTitle}</Typography.Title>
        </BasicEmptyListView>
    ), [NoDataTitle])

    useEffect(() => {
        if (!router.query.period && !isEmpty(bankAccountReports)) {
            router.replace({
                pathname: router.pathname,
                query: { ...router.query, period: selectedPeriod },
            }, undefined, { shallow: true })
        }
    }, [router])

    useEffect(() => {
        const defaultSelectedTab = get(bankAccountReport, ['data', 'categoryGroups', '0', 'id'])

        if (defaultSelectedTab) {
            setActiveTab(defaultSelectedTab)
        }
    }, [bankAccountReport])

    useEffect(() => {
        if (isEmpty(chartData) && !isEmpty(categoryGroups)) {
            setActiveTab(get(categoryGroups, '0.id'))
        }
    }, [chartData, categoryGroups])

    if (!bankAccountReport) return emptyPlaceholder

    return (
        <Row gutter={BANK_ACCOUNT_REPORT_ROW_GUTTER}>
            <Col span={24}>
                <Select
                    placeholder={ChooseReportTitle}
                    value={selectedPeriod}
                    onChange={onReportPeriodSelectChange}
                    options={reportOptionItems}
                />
            </Col>
            <Col span={24}>
                <Row gutter={BANK_ACCOUNT_REPORT_ROW_GUTTER}>
                    <Col xl={8} md={24} sm={24} xs={24}>
                        <InfoCard
                            value={(bankAccountReport.amount)}
                            label={PropertyBalanceLabel}
                            icon={<TotalBalanceIcon />}
                            isSmall={!breakpoints.TABLET_LARGE}
                            currencyCode={currencyCode}
                        />
                    </Col>
                    <Col xl={8} md={12} sm={24} xs={12}>
                        <InfoCard
                            value={bankAccountReport.totalOutcome}
                            label={WithdrawalTitle}
                            icon={<BalanceOutIcon />}
                            valueType='danger'
                            isSmall={!breakpoints.TABLET_LARGE}
                            currencyCode={currencyCode}
                            onClick={() => setActiveCategory(ReportCategories.Withdrawal)}
                            hoverable
                        />
                    </Col>
                    <Col xl={8} md={12} sm={24} xs={12}>
                        <InfoCard
                            value={bankAccountReport.totalIncome}
                            label={IncomeTitle}
                            icon={<BalanceInIcon />}
                            valueType='success'
                            isSmall={!breakpoints.TABLET_LARGE}
                            currencyCode={currencyCode}
                            onClick={() => setActiveCategory(ReportCategories.Income)}
                            hoverable
                        />
                    </Col>
                </Row>
            </Col>
            <Col span={24}>
                <Card
                    title={
                        <Typography.Title level={3}>
                            {activeCategory === ReportCategories.Income ? ReportCardIncomeTitle : ReportCardWithdrawalTitle }
                        </Typography.Title>
                    }
                >
                    <Tabs items={tabsItems} onChange={onChangeTabs} activeKey={activeTab} />
                    <Row
                        gutter={BANK_ACCOUNT_REPORT_ROW_GUTTER}
                        style={{ flexDirection: !breakpoints.TABLET_LARGE || isMobile ? 'column-reverse' : 'row' }}
                    >
                        {isEmpty(chartData)
                            ? (
                                emptyPlaceholder
                            ) : (
                                <>
                                    <Col span={!breakpoints.TABLET_LARGE || isMobile ? 24 : 12}>
                                        {chartLegendItems}
                                    </Col>
                                    <Col span={!breakpoints.TABLET_LARGE || isMobile ? 24 : 12}>
                                        <ReactECharts
                                            onChartReady={(instance) => chartInstance.current = instance}
                                            opts={CHART_OPTIONS}
                                            onEvents={onChartEvents}
                                            option={echartsOption}
                                        />
                                    </Col>
                                </>
                            )}
                    </Row>
                </Card>
            </Col>
        </Row>
    )
}

type BankAccountReportProps = {
    bankAccountReports: Array<BankAccountReportType>
    bankAccount: BankAccountType
    role: Pick<OrganizationEmployeeRoleType, 'canManageBankAccountReportTasks'>
}

interface IBankAccountReport {
    (props: BankAccountReportProps): React.ReactElement
}

const BankAccountReport: IBankAccountReport = ({ bankAccount, bankAccountReports, role }) => {
    const intl = useIntl()
    const NoDataTitle = intl.formatMessage({ id: 'NoData' })

    const { user } = useAuth()

    const { BankReportTaskButton } = useBankReportTaskButton({
        organizationId: bankAccount.organization.id,
        userId: user?.id || null,
        bankAccount,
    })

    const sortedBankAccountReports = [...bankAccountReports]
        .sort((a, b) => dayjs(a.period).isBefore(b.period) ? 1 : -1)
    const canManageBankAccountReportTasks = get(role, 'canManageBankAccountReportTasks', false)

    return (
        <Row>
            <Col span={24}>
                {isEmpty(sortedBankAccountReports)
                    ? (
                        <BasicEmptyListView image='/dino/searching@2x.png'>
                            <Space size={16} direction='vertical'>
                                <Typography.Title level={5}>{NoDataTitle}</Typography.Title>
                                {canManageBankAccountReportTasks && (
                                    <BankReportTaskButton key='reportTask' />
                                )}
                            </Space>
                        </BasicEmptyListView>
                    ) : (
                        <BankAccountReportContent
                            bankAccountReports={sortedBankAccountReports}
                            currencyCode={bankAccount.currencyCode}
                        />
                    )
                }
            </Col>
        </Row>
    )
}

const MemoizedBankAccountReport = React.memo(BankAccountReport)

export {
    MemoizedBankAccountReport as BankAccountReport,
}
