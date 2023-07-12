import {
    TicketStatusTypeType,
    IncidentStatusType,
    TicketQualityControlValueType,
} from '@app/condo/schema'
import { Row, Col, Skeleton } from 'antd'
import Big from 'big.js'
import dayjs, { Dayjs } from 'dayjs'
import get from 'lodash/get'
import isNull from 'lodash/isNull'
import { useRouter } from 'next/router'
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react'

import { Wallet, LayoutList, Smile, Frown } from '@open-condo/icons'
import { useLazyQuery } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { Card, Typography, Space, Radio, RadioGroup } from '@open-condo/ui'

import {
    TicketByPropertyChart,
    TicketByExecutorChart,
    ResidentByPropertyChart,
    AllTicketsChart,
    PaymentByPropertyChart,
    PaymentReceiptChart,
    TicketByCategoryChart,
    PaymentTotalChart,
} from '@condo/domains/analytics/components/charts'
import { OVERVIEW_DASHBOARD_MUTATION } from '@condo/domains/analytics/gql'
import DateRangePicker from '@condo/domains/common/components/Pickers/DateRangePicker'
import { Table } from '@condo/domains/common/components/Table/Index'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { useLightWeightTableColumns } from '@condo/domains/ticket/hooks/useTableColumns'
import { Incident, Ticket } from '@condo/domains/ticket/utils/clientSchema'
import { GET_TICKETS_COUNT_QUERY } from '@condo/domains/ticket/utils/clientSchema/search'

import type { OverviewData } from '@app/condo/schema'
import type { RowProps } from 'antd'

const DASHBOARD_ROW_GUTTER: RowProps['gutter'] = [20, 40]
const CARD_STYLE: React.CSSProperties = { height: '200px' }
const TEXT_CENTER_STYLE: React.CSSProperties = { textAlign: 'center' }
const DATA_CARD_DESCRIPTION_CONTAINER_STYLE: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
}

type DataCardProps = { label: string, value: string | number, secondaryLabel?: string }

const DataCard: React.FC<DataCardProps> = ({ label, value, secondaryLabel }) => (
    <Col>
        <Space direction='vertical' align='center' size={8}>
            <Typography.Title level={3} type='primary'>{value}</Typography.Title>
            <div style={DATA_CARD_DESCRIPTION_CONTAINER_STYLE}>
                <Typography.Text type='primary'>{label}</Typography.Text>
                {secondaryLabel && (
                    <Typography.Text type='secondary' size='small'>{secondaryLabel}</Typography.Text>
                )}
            </div>
        </Space>
    </Col>
)

const PerformanceCard = ({ organizationId, paymentSum, receiptSum, residentsData, paymentLoading }) => {
    const intl = useIntl()
    const SummaryTitle = intl.formatMessage({ id: 'pages.reports.summary' })
    const DoneLabel = intl.formatMessage({ id: 'Done' })
    const InWorkLabel = intl.formatMessage({ id: 'ticket.status.IN_PROGRESS.name' })
    const NewTicketsLabel = intl.formatMessage({ id: 'ticket.status.OPEN.many' })
    const ClosedTicketsLabel = intl.formatMessage({ id: 'ticket.status.CLOSED.many' })

    const PaymentsAmountPercent = intl.formatMessage({ id: 'pages.reports.paymentsAmountPercent' })
    const PaymentsAmount = intl.formatMessage({ id: 'pages.reports.paymentsAmount' })
    const ResidentsInApp = intl.formatMessage({ id: 'pages.reports.residentsWithApp' })
    const TodayTitle = intl.formatMessage({ id: 'pages.reports.aggregatePeriod.today' })
    const MonthTitle = intl.formatMessage({ id: 'pages.reports.aggregatePeriod.month' })
    const TotalTitle = intl.formatMessage({ id: 'pages.reports.aggregatePeriod.total' })

    const [completionPercent, setCompletionPercent] = useState('—')
    const [paymentsAmountPercent, setPaymentsAmountPercent] = useState('—')
    const [residentsCount, setResidentsCount] = useState(0)
    const ticketCounts = useRef(null)

    const [loadTicketCounts, { loading: ticketCountLoading }] = useLazyQuery(GET_TICKETS_COUNT_QUERY, {
        onCompleted: (result) => {
            ticketCounts.current = result
        },
        fetchPolicy: 'cache-first',
    })
    const [loadMonthTicketCounts, { loading: monthTicketLoading }] = useLazyQuery(GET_TICKETS_COUNT_QUERY, {
        onCompleted: (result) => {
            if (result.all.count > 0) {
                setCompletionPercent((result.completed.count + result.closed.count / result.all.count * 100)
                    .toFixed(0) + '%'
                )
            }
        },
        fetchPolicy: 'cache-first',
    })

    useEffect(() => {
        const ticketWhere = {
            organization: { id: organizationId },
            createdAt_gte: dayjs().startOf('day').toISOString(),
            createdAt_lte: dayjs().endOf('day').toISOString(),
        }
        const ticketMonthWhere = {
            ...ticketWhere,
            createdAt_gte: dayjs().startOf('month'),
            createdAt_lte: dayjs().endOf('month'),
        }

        loadTicketCounts({ variables: { where: ticketWhere, whereWithoutStatuses: ticketWhere } })
        loadMonthTicketCounts({ variables: { where: ticketMonthWhere, whereWithoutStatuses: ticketMonthWhere } })
    }, [organizationId, loadTicketCounts, loadMonthTicketCounts])

    useEffect(() => {
        if (!paymentLoading && !isNull(paymentSum) && !isNull(receiptSum)) {
            if (Number(receiptSum) > 0) {
                setPaymentsAmountPercent(Big(paymentSum).div(receiptSum).mul(100).round(0).toString() + '%')
            }
        }
    }, [receiptSum, paymentSum, paymentLoading])

    useEffect(() => {
        if (residentsData.length) {
            setResidentsCount(residentsData.reduce((p, c) => p + Number(c.count), 0))
        }
    }, [residentsData])

    const loading = monthTicketLoading || ticketCountLoading || isNull(ticketCounts.current)

    return (
        <Card title={<Typography.Title level={3}>{SummaryTitle}</Typography.Title>}>
            {loading || paymentLoading ? (
                <Skeleton loading paragraph={{ rows: 3 }} />
            ) : (
                <Row gutter={DASHBOARD_ROW_GUTTER}>
                    <Col span={24}>
                        <Row align='middle' justify='space-around'>
                            <LayoutList />
                            <DataCard
                                label={DoneLabel}
                                secondaryLabel={MonthTitle}
                                value={completionPercent}
                            />
                            <DataCard
                                label={NewTicketsLabel}
                                secondaryLabel={TodayTitle}
                                value={ticketCounts.current.new_or_reopened.count}
                            />
                            <DataCard
                                label={InWorkLabel}
                                secondaryLabel={TodayTitle}
                                value={ticketCounts.current.processing.count}
                            />
                            <DataCard
                                label={ClosedTicketsLabel}
                                secondaryLabel={TodayTitle}
                                value={ticketCounts.current.closed.count}
                            />
                        </Row>
                    </Col>
                    <Col span={24}>
                        <Row align='middle' justify='space-between'>
                            <Wallet />
                            <DataCard
                                label={PaymentsAmountPercent}
                                secondaryLabel={MonthTitle}
                                value={paymentsAmountPercent}
                            />
                            <DataCard
                                label={PaymentsAmount}
                                secondaryLabel={MonthTitle}
                                value={intl.formatNumber(paymentSum, { style: 'currency', currency: 'Rub' })}
                            />
                            <DataCard
                                label={ResidentsInApp}
                                secondaryLabel={TotalTitle}
                                value={residentsCount}
                            />
                        </Row>
                    </Col>
                </Row>
            )}
        </Card>
    )
}

const IncidentDashboard = ({ organizationId }) => {
    const intl = useIntl()
    const IncidentsTitle = intl.formatMessage({ id: 'pages.reports.incidentsTitle' })
    const IncidentDescription = intl.formatMessage({ id: 'pages.reports.incidentsDescription' })

    const { push } = useRouter()

    const { loading, count } = Incident.useCount({
        where: { organization: { id: organizationId }, status: IncidentStatusType.Actual },
    })

    const onCardClick = useCallback(async () => {
        await push('/incident')
    }, [push])

    const incidentCardContent = useMemo(() => (
        <Row style={CARD_STYLE} align='middle'>
            <Col span={24}>
                <Space direction='vertical' size={12} align='center'>
                    <Typography.Title level={1} type={count > 0 ? 'danger' : 'success'}>{count}</Typography.Title>
                    <div style={TEXT_CENTER_STYLE}>
                        <Typography.Paragraph type='secondary' size='medium'>
                            {IncidentDescription}
                        </Typography.Paragraph>
                    </div>
                </Space>
            </Col>
        </Row>
    ), [count, IncidentDescription])

    return (
        <Card
            title={<Typography.Title level={3}>{IncidentsTitle}</Typography.Title>}
            onClick={onCardClick}
            hoverable
        >
            {loading ? <Skeleton active paragraph={{ rows: 3 }} /> : incidentCardContent}
        </Card>
    )
}

const TicketQualityControlDashboard = ({ organizationId }) => {
    const intl = useIntl()
    const QualityControlTitle = intl.formatMessage({ id: 'ticket.qualityControl' })
    const TicketFeedbackTitle = intl.formatMessage({ id: 'pages.reports.ticketFeedbackCount' })

    const { count: goodCount, loading: goodLoading } = Ticket.useCount({
        where: {
            organization: { id: organizationId },
            status: { type: TicketStatusTypeType.Completed },
            qualityControlValue: TicketQualityControlValueType.Good,
            AND: [
                { createdAt_gte: dayjs().startOf('month').toISOString() },
                { createdAt_lte: dayjs().endOf('month').toISOString() },
            ],
        },
    })
    const { count: badCount, loading: badLoading } = Ticket.useCount({
        where: {
            organization: { id: organizationId },
            status: { type: TicketStatusTypeType.Completed },
            qualityControlValue: TicketQualityControlValueType.Bad,
            AND: [
                { createdAt_gte: dayjs().startOf('month').toISOString() },
                { createdAt_lte: dayjs().endOf('month').toISOString() },
            ],
        },
    })

    const ticketCardContent = useMemo(() => {
        const totalCount = goodCount + badCount
        const goodPercent = totalCount  > 0 ? goodCount / totalCount * 100 : 0
        const badPercent = totalCount > 0 ? badCount / totalCount * 100 : 0

        return (
            <Row style={CARD_STYLE} align='middle'>
                <Col span={24}>
                    <Row justify='space-evenly' gutter={[0, 12]}>
                        <Col>
                            <Space size={8} direction='horizontal'>
                                <Smile />
                                <Typography.Title level={3} type='success'>
                                    {goodPercent}%
                                </Typography.Title>
                            </Space>
                        </Col>
                        <Col>
                            <Space size={8} direction='horizontal'>
                                <Frown />
                                <Typography.Title level={3} type='danger'>
                                    {badPercent}%
                                </Typography.Title>
                            </Space>
                        </Col>
                        {/* @ts-ignore */}
                        <Col span={24} align='center'>
                            <Typography.Text type='secondary' size='medium'>
                                {TicketFeedbackTitle} {goodCount + badCount}&nbsp;(
                                <Typography.Text type='success' size='medium'>{goodCount}</Typography.Text>
                                    /
                                <Typography.Text type='danger' size='medium'>{badCount}</Typography.Text>
                                    )
                            </Typography.Text>
                        </Col>
                    </Row>
                </Col>
            </Row>
        )
    }, [goodCount, badCount, TicketFeedbackTitle])

    return (
        <Card
            title={<Typography.Title level={3}>{QualityControlTitle}</Typography.Title>}
        >
            {goodLoading || badLoading ? <Skeleton active paragraph={{ rows: 3 }} /> : ticketCardContent}
        </Card>
    )
}

const TicketTableView = ({ organizationId, dateRange }) => {
    const intl = useIntl()
    const TicketTitle = intl.formatMessage({ id: 'global.section.tickets' })
    const InProgressTitle = intl.formatMessage({ id: 'ticket.status.IN_PROGRESS.name' })

    const router = useRouter()
    const { columns } = useLightWeightTableColumns()

    const { offset } = useMemo(() => parseQuery(router.query), [router.query])

    const currentPageIndex = useMemo(() => getPageIndexFromOffset(offset, 5), [offset])

    const { objs: tickets, loading, count } = Ticket.useObjects({
        where: {
            organization: { id: organizationId },
            status: { type: TicketStatusTypeType.Processing },
            AND: [
                { createdAt_gte: dateRange[0] },
                { createdAt_lte: dateRange[1] },
            ],
        },
        first: 5,
        skip: (currentPageIndex - 1) * 5,
    })

    const handleRowAction = useCallback((record) => {
        return {
            onClick: async () => {
                await router.push(`/ticket/${record.id}`)
            },
        }
    }, [router])

    return (
        <Row gutter={[0, 16]}>
            <Col span={24}>
                <Typography.Title level={3}>
                    {TicketTitle} {InProgressTitle.toLowerCase()}
                </Typography.Title>
            </Col>
            <Col span={24}>
                <Table
                    totalRows={count}
                    loading={loading}
                    columns={columns}
                    dataSource={tickets}
                    pageSize={5}
                    onRow={handleRowAction}
                />
            </Col>
        </Row>
    )
}

export const Dashboard: React.FC<{ organizationId: string }> = ({ organizationId }) => {
    const intl = useIntl()
    const PerDayTitle = intl.formatMessage({ id: 'pages.reports.aggregatePeriod.day' })
    const PerWeekTitle = intl.formatMessage({ id: 'pages.reports.aggregatePeriod.week' })

    const [overview, setOverview] = useState<OverviewData>(null)
    const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([dayjs().subtract(1, 'month'), dayjs()])
    const [aggregatePeriod, setAggregatePeriod] = useState<'day' | 'week' | 'month'>('day')

    const [loadDashboardData, { loading }] = useLazyQuery(OVERVIEW_DASHBOARD_MUTATION, {
        onCompleted: (response) => {
            const { result } = response
            setOverview(result.overview)
        },
        onError: error => {console.log(error)},
    })

    useEffect(() => {
        loadDashboardData({ variables: {
            data: { dv: 1, sender: getClientSideSenderInfo(),
                where: {
                    organization: organizationId,
                    dateFrom: dateRange[0].toISOString(),
                    dateTo: dayjs(dateRange[1]).endOf('day').toISOString(),
                },
                groupBy: {
                    aggregatePeriod,
                },
            },
        } })
    }, [organizationId, loadDashboardData, dateRange, aggregatePeriod])

    const onAggregatePeriodChange = useCallback((aggregatePeriod) => {
        setAggregatePeriod(aggregatePeriod.target.value)
    }, [])

    const newTickets = get(overview, 'ticketByDay.tickets', [])
    const propertyTickets = get(overview, 'ticketByProperty.tickets')
    const categoryTickets = get(overview, 'ticketByCategory.tickets', [])
    const executorTickets = get(overview, 'ticketByExecutor.tickets', [])
    const paymentsData = get(overview, 'payment.payments', [])
    const paymentSum = get(overview, 'payment.sum', null)
    const receiptsData = get(overview, 'receipt.receipts', [])
    const receiptSum = get(overview, 'receipt.sum', null)
    const residentsData = get(overview, 'resident.residents', [])
    const chargedToPaidData = paymentsData.length > 0 && receiptsData.length > 0 ? [paymentsData, receiptsData] : []

    return (
        <Row gutter={DASHBOARD_ROW_GUTTER}>
            <Col lg={12} md={24}>
                <PerformanceCard
                    organizationId={organizationId}
                    paymentSum={paymentSum}
                    receiptSum={receiptSum}
                    residentsData={residentsData}
                    paymentLoading={false}
                />
            </Col>
            <Col lg={6} md={12}>
                <IncidentDashboard organizationId={organizationId} />
            </Col>
            <Col lg={6} md={12}>
                <TicketQualityControlDashboard organizationId={organizationId} />
            </Col>
            <Col span={24}>
                <TableFiltersContainer>
                    <Space direction='horizontal' size={24}>
                        <DateRangePicker
                            value={dateRange}
                            onChange={setDateRange}
                            allowClear={false}
                            disabled={loading}
                            disabledDate={(current) => {
                                return current && current < dayjs().startOf('year')
                            }}
                        />
                        <RadioGroup value={aggregatePeriod} onChange={onAggregatePeriodChange} disabled={loading}>
                            <Space direction='horizontal' size={24}>
                                <Radio value='day' label={PerDayTitle} />
                                <Radio value='week' label={PerWeekTitle} />
                            </Space>
                        </RadioGroup>
                    </Space>
                </TableFiltersContainer>
            </Col>
            {loading || overview === null ? (
                <Skeleton paragraph={{ rows: 10 }} />
            ) : (
                <Col span={24}>
                    <Row gutter={DASHBOARD_ROW_GUTTER}>
                        <Col lg={12} md={24}>
                            <AllTicketsChart data={newTickets} />
                        </Col>
                        <Col lg={12} md={24}>
                            <TicketByCategoryChart data={categoryTickets} />
                        </Col>
                        <Col span={24}>
                            <TicketTableView organizationId={organizationId} dateRange={dateRange} />
                        </Col>
                        <Col lg={12} md={24}>
                            <PaymentTotalChart data={paymentsData} />
                        </Col>
                        <Col lg={12} md={24}>
                            <PaymentReceiptChart data={chargedToPaidData} />
                        </Col>
                        <Col lg={12} md={24}>
                            <PaymentByPropertyChart data={paymentsData} />
                        </Col>
                        <Col lg={12} md={24}>
                            <ResidentByPropertyChart data={residentsData} />
                        </Col>
                        <Col lg={12} md={24}>
                            <TicketByExecutorChart data={executorTickets} />
                        </Col>
                        <Col lg={12} md={24}>
                            <TicketByPropertyChart data={propertyTickets} />
                        </Col>
                    </Row>
                </Col>
            )}
        </Row>
    )
}
