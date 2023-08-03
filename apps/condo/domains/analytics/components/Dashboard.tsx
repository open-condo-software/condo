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
import { Card, Typography, Space } from '@open-condo/ui'

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
import { GET_OVERVIEW_DASHBOARD_MUTATION } from '@condo/domains/analytics/gql'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
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

const TICKET_TABLE_PAGE_SIZE = 5
const DASHBOARD_ROW_GUTTER: RowProps['gutter'] = [20, 40]
const CARD_ROW_GUTTER: RowProps['gutter'] = [24, 24]
const CARD_STYLE: React.CSSProperties = { height: '160px' }
const TEXT_CENTER_STYLE: React.CSSProperties = { textAlign: 'center' }
const DATA_CARD_DESCRIPTION_CONTAINER_STYLE: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
}

type StatisticCardProps = { label: string, value: string | number, secondaryLabel?: string }

const StatisticCard: React.FC<StatisticCardProps> = ({ label, value, secondaryLabel }) => (
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

const PerformanceCard = ({ organizationId, paymentSum, receiptSum, residentsData, paymentLoading, dateRange }) => {
    const intl = useIntl()
    const SummaryTitle = intl.formatMessage({ id: 'pages.reports.summary' })
    const DoneLabel = intl.formatMessage({ id: 'Done' })
    const InWorkLabel = intl.formatMessage({ id: 'ticket.status.IN_PROGRESS.name' })
    const NewTicketsLabel = intl.formatMessage({ id: 'ticket.status.OPEN.many' })
    const ClosedTicketsLabel = intl.formatMessage({ id: 'ticket.status.CLOSED.many' })
    const PaymentsAmountPercent = intl.formatMessage({ id: 'pages.reports.paymentsAmountPercent' })
    const PaymentsAmount = intl.formatMessage({ id: 'pages.reports.paymentsAmount' })
    const ResidentsInApp = intl.formatMessage({ id: 'pages.reports.residentsWithApp' })

    const { breakpoints } = useLayoutContext()

    const [completionPercent, setCompletionPercent] = useState('—')
    const [paymentsAmountPercent, setPaymentsAmountPercent] = useState('—')
    const [residentsCount, setResidentsCount] = useState(0)
    const ticketCounts = useRef(null)

    const [loadTicketCounts, { loading: ticketCountLoading }] = useLazyQuery(GET_TICKETS_COUNT_QUERY, {
        onCompleted: (result) => {
            ticketCounts.current = result
            if (result.all.count > 0) {
                const doneTickets = result.completed.count + result.closed.count
                setCompletionPercent((doneTickets / result.all.count * 100).toFixed(0) + '%')
            } else {
                setCompletionPercent('—')
            }
        },
        fetchPolicy: 'network-only',
    })

    useEffect(() => {
        const ticketWhere = {
            organization: { id: organizationId },
            createdAt_gte: dateRange[0].startOf('day').toISOString(),
            createdAt_lte: dateRange[1].endOf('day').toISOString(),
        }

        loadTicketCounts({ variables: { where: ticketWhere, whereWithoutStatuses: ticketWhere } })
    }, [organizationId, loadTicketCounts, dateRange])

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
    const iconStyle = useMemo(() => ({ display: !breakpoints.TABLET_LARGE ? 'none' : 'block' }), [breakpoints.TABLET_LARGE])
    const cardRowJustify = useMemo(() => breakpoints.TABLET_LARGE ? 'space-between' : 'space-around', [breakpoints.TABLET_LARGE])

    const loading = ticketCountLoading || isNull(ticketCounts.current)

    return (
        <Card title={<Typography.Title level={3}>{SummaryTitle}</Typography.Title>}>
            {loading || paymentLoading ? (
                <Skeleton loading paragraph={{ rows: 5 }} />
            ) : (
                <Row gutter={DASHBOARD_ROW_GUTTER}>
                    <Col span={24}>
                        <Row align='middle' justify={cardRowJustify} gutter={CARD_ROW_GUTTER}>
                            <Col style={iconStyle}>
                                <LayoutList />
                            </Col>
                            <StatisticCard
                                label={DoneLabel}
                                value={completionPercent}
                            />
                            <StatisticCard
                                label={NewTicketsLabel}
                                value={ticketCounts.current.new_or_reopened.count}
                            />
                            <StatisticCard
                                label={InWorkLabel}
                                value={ticketCounts.current.processing.count}
                            />
                            <StatisticCard
                                label={ClosedTicketsLabel}
                                value={ticketCounts.current.closed.count}
                            />
                        </Row>
                    </Col>
                    <Col span={24}>
                        <Row align='middle' justify={cardRowJustify} gutter={CARD_ROW_GUTTER}>
                            <Col style={iconStyle}>
                                <Wallet />
                            </Col>
                            <StatisticCard
                                label={PaymentsAmountPercent}
                                value={paymentsAmountPercent}
                            />
                            <StatisticCard
                                label={PaymentsAmount}
                                value={intl.formatNumber(paymentSum, { style: 'currency', currency: 'Rub' })}
                            />
                            <StatisticCard
                                label={ResidentsInApp}
                                value={residentsCount}
                            />
                        </Row>
                    </Col>
                </Row>
            )}
        </Card>
    )
}

interface IDashboardCard {
    ({ organizationId, dateRange }: { organizationId: string, dateRange: [Dayjs, Dayjs] }): React.ReactElement
}

const IncidentDashboard: IDashboardCard = ({ organizationId, dateRange }) => {
    const intl = useIntl()
    const IncidentsTitle = intl.formatMessage({ id: 'pages.reports.incidentsTitle' })
    const IncidentDescription = intl.formatMessage({ id: 'pages.reports.incidentsDescription' })

    const { push } = useRouter()

    const { loading, count } = Incident.useCount({
        where: {
            organization: { id: organizationId },
            status: IncidentStatusType.Actual,
            createdAt_gte: dateRange[0].startOf('day').toISOString(),
            createdAt_lte: dateRange[1].endOf('day').toISOString(),
        },
    })

    const onCardClick = useCallback(async () => {
        await push('/incident')
    }, [push])

    const incidentCardContent = useMemo(() => (
        <Row style={CARD_STYLE} align='middle'>
            <Col span={24} style={TEXT_CENTER_STYLE}>
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

const TicketQualityControlDashboard: IDashboardCard = ({ organizationId, dateRange }) => {
    const intl = useIntl()
    const QualityControlTitle = intl.formatMessage({ id: 'ticket.qualityControl' })
    const TicketFeedbackTitle = intl.formatMessage({ id: 'pages.reports.ticketFeedbackCount' })

    const { count: goodCount, loading: goodLoading } = Ticket.useCount({
        where: {
            organization: { id: organizationId },
            status: { OR: [{ type: TicketStatusTypeType.Completed }, { type: TicketStatusTypeType.Closed }] },
            qualityControlValue: TicketQualityControlValueType.Good,
            AND: [
                { createdAt_gte: dateRange[0].startOf('day').toISOString() },
                { createdAt_lte: dateRange[1].endOf('day').toISOString() },
            ],
        },
    })
    const { count: badCount, loading: badLoading } = Ticket.useCount({
        where: {
            organization: { id: organizationId },
            status: { OR: [{ type: TicketStatusTypeType.Completed }, { type: TicketStatusTypeType.Closed }] },
            qualityControlValue: TicketQualityControlValueType.Bad,
            AND: [
                { createdAt_gte: dateRange[0].startOf('day').toISOString() },
                { createdAt_lte: dateRange[1].endOf('day').toISOString() },
            ],
        },
    })

    const ticketCardContent = useMemo(() => {
        const totalCount = goodCount + badCount
        const goodPercent = totalCount  > 0 ? (goodCount / totalCount * 100).toFixed(0) : 0
        const badPercent = totalCount > 0 ? (badCount / totalCount * 100).toFixed(0) : 0

        return (
            <Row style={CARD_STYLE} align='middle'>
                <Col span={24}>
                    <Row gutter={[0, 12]}>
                        <Col span={24} style={TEXT_CENTER_STYLE}>
                            <Space direction='horizontal' size={24} align='center'>
                                <Space size={8} direction='horizontal'>
                                    <Smile />
                                    <Typography.Title level={3} type='success'>
                                        {goodPercent}%
                                    </Typography.Title>
                                </Space>
                                <Space size={8} direction='horizontal'>
                                    <Frown />
                                    <Typography.Title level={3} type='danger'>
                                        {badPercent}%
                                    </Typography.Title>
                                </Space>
                            </Space>
                        </Col>
                        <Col span={24} style={TEXT_CENTER_STYLE}>
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

const TicketTableView: IDashboardCard = ({ organizationId, dateRange }) => {
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
                { createdAt_gte: dateRange[0].startOf('day').toISOString() },
                { createdAt_lte: dateRange[1].endOf('day').toISOString() },
            ],
        },
        first: TICKET_TABLE_PAGE_SIZE,
        skip: (currentPageIndex - 1) * TICKET_TABLE_PAGE_SIZE,
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
    const [overview, setOverview] = useState<OverviewData>(null)
    const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([dayjs().subtract(1, 'month'), dayjs()])

    const [loadDashboardData, { loading }] = useLazyQuery(GET_OVERVIEW_DASHBOARD_MUTATION, {
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
                    aggregatePeriod: 'day',
                },
            },
        } })
    }, [organizationId, loadDashboardData, dateRange])

    const disabledDate = useCallback((currentDate) => {
        return currentDate && currentDate < dayjs().startOf('year')
    }, [])

    const newTickets = get(overview, 'ticketByDay.tickets', [])
    const propertyTickets = get(overview, 'ticketByProperty.tickets', [])
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
            <Col span={24}>
                <TableFiltersContainer>
                    <Row gutter={[24, 24]} align='middle' justify='start'>
                        <Col>
                            <DateRangePicker
                                value={dateRange}
                                onChange={setDateRange}
                                allowClear={false}
                                disabled={loading}
                                disabledDate={disabledDate}
                            />
                        </Col>
                    </Row>

                </TableFiltersContainer>
            </Col>
            <Col xl={12} lg={24}>
                <PerformanceCard
                    organizationId={organizationId}
                    paymentSum={paymentSum}
                    receiptSum={receiptSum}
                    residentsData={residentsData}
                    paymentLoading={false}
                    dateRange={dateRange}
                />
            </Col>
            <Col xl={6} lg={12} xs={24}>
                <IncidentDashboard organizationId={organizationId} dateRange={dateRange} />
            </Col>
            <Col xl={6} lg={12} xs={24}>
                <TicketQualityControlDashboard organizationId={organizationId} dateRange={dateRange} />
            </Col>
            {overview === null ? (
                <Skeleton paragraph={{ rows: 62 }} />
            ) : (
                <Col span={24}>
                    <Row gutter={DASHBOARD_ROW_GUTTER}>
                        <Col lg={12} md={24} xs={24}>
                            <AllTicketsChart data={newTickets} />
                        </Col>
                        <Col lg={12} md={24} xs={24}>
                            <TicketByCategoryChart data={categoryTickets} />
                        </Col>
                        <Col span={24}>
                            <TicketTableView organizationId={organizationId} dateRange={dateRange} />
                        </Col>
                        <Col lg={12} md={24} xs={24}>
                            <PaymentTotalChart data={paymentsData} />
                        </Col>
                        <Col lg={12} md={24} xs={24}>
                            <PaymentReceiptChart data={chargedToPaidData} />
                        </Col>
                        <Col lg={12} md={24} xs={24}>
                            <PaymentByPropertyChart data={paymentsData} />
                        </Col>
                        <Col lg={12} md={24} xs={24}>
                            <ResidentByPropertyChart data={residentsData} />
                        </Col>
                        <Col lg={12} md={24} xs={24}>
                            <TicketByExecutorChart data={executorTickets} />
                        </Col>
                        <Col lg={12} md={24} xs={24}>
                            <TicketByPropertyChart data={propertyTickets} />
                        </Col>
                    </Row>
                </Col>
            )}
        </Row>
    )
}
