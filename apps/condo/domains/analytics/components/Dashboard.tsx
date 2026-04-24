import { TicketQualityControlValueType } from '@app/condo/schema'
import { Row, Col, Skeleton } from 'antd'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import isNull from 'lodash/isNull'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react'

import { Wallet, LayoutList, Smile, Frown } from '@open-condo/icons'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useLazyQuery } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { Card, Typography, Space, Modal } from '@open-condo/ui'

import {
    TicketByPropertyChart,
    TicketByExecutorChart,
    TicketQualityControlChart,
    ResidentByPropertyChart,
    AllTicketsChart,
    PaymentByPropertyChart,
    PaymentReceiptChart,
    TicketByCategoryChart,
    PaymentTotalChart,
} from '@condo/domains/analytics/components/charts'
import { GET_OVERVIEW_DASHBOARD_MUTATION } from '@condo/domains/analytics/gql'
import { usePropertyFilter, useDateRangeFilter } from '@condo/domains/analytics/hooks/useDashboardFilters'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { Table } from '@condo/domains/common/components/Table/Index'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { useWindowSize } from '@condo/domains/common/hooks/useWindowSize'
import { parseQuery, getPageIndexFromOffset } from '@condo/domains/common/utils/tables.utils'
import { QUALITY_CONTROL_VALUES } from '@condo/domains/ticket/constants/qualityControl'
import { Ticket as TicketGQL } from '@condo/domains/ticket/gql'
import { useTicketQualityTableColumns } from '@condo/domains/ticket/hooks/useTableColumns'
import { GET_TICKETS_COUNT_QUERY } from '@condo/domains/ticket/utils/clientSchema/search'

import type { OverviewData } from '@app/condo/schema'
import type { RowProps } from 'antd'

const DASHBOARD_ROW_GUTTER: RowProps['gutter'] = [20, 40]
const CARD_ROW_GUTTER: RowProps['gutter'] = [8, 24]
const CARD_STYLE: React.CSSProperties = { height: '160px' }
const TEXT_CENTER_STYLE: React.CSSProperties = { textAlign: 'center' }
const DATA_CARD_DESCRIPTION_CONTAINER_STYLE: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
}
const MODAL_TABLE_PAGE_SIZE = 5
const DASHBOARD_WIDTH_BREAKPOINT = 1300

const { publicRuntimeConfig: { defaultCurrencyCode } } = getConfig()

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

const PerformanceCard = ({ organizationId, paymentSum, propertyData, residentsData, loading, dateRange, propertyIds }) => {
    const intl = useIntl()
    const SummaryTitle = intl.formatMessage({ id: 'pages.reports.summary' })
    const DoneLabel = intl.formatMessage({ id: 'Done' })
    const InWorkLabel = intl.formatMessage({ id: 'ticket.status.IN_PROGRESS.name' })
    const NewTicketsLabel = intl.formatMessage({ id: 'ticket.status.OPEN.many' })
    const CompletedLabel = intl.formatMessage({ id: 'ticket.status.COMPLETED.many' })
    const ClosedTicketsLabel = intl.formatMessage({ id: 'ticket.status.CLOSED.many' })
    const PaymentsAmount = intl.formatMessage({ id: 'pages.reports.paymentsAmount' })
    const ResidentsInApp = intl.formatMessage({ id: 'pages.reports.residentsWithApp' })
    const UnitsCount = intl.formatMessage({ id: 'pages.condo.property.id.UnitsCount' })

    const { breakpoints } = useLayoutContext()

    const [completionPercent, setCompletionPercent] = useState('—')
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

        if (!isEmpty(propertyIds)) {
            ticketWhere['property'] = { id_in: propertyIds }
        }

        loadTicketCounts({ variables: { where: ticketWhere, whereWithoutStatuses: ticketWhere } })
    }, [organizationId, loadTicketCounts, dateRange, propertyIds])

    useEffect(() => {
        if (residentsData.length) {
            setResidentsCount(residentsData.reduce((p, c) => p + Number(c.count), 0))
        } else {
            setResidentsCount(0)
        }
    }, [residentsData])
    const iconStyle = useMemo(() => ({ display: !breakpoints.TABLET_LARGE ? 'none' : 'block' }), [breakpoints.TABLET_LARGE])
    const cardRowJustify = useMemo(() => breakpoints.TABLET_LARGE ? 'space-between' : 'space-around', [breakpoints.TABLET_LARGE])

    const isTicketCountLoading = ticketCountLoading || isNull(ticketCounts.current)

    return (
        <Card title={<Typography.Title level={3}>{SummaryTitle}</Typography.Title>}>
            {isTicketCountLoading || loading ? (
                <Skeleton loading active paragraph={{ rows: 3 }} />
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
                                label={CompletedLabel}
                                value={ticketCounts.current.completed.count}
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
                                label={PaymentsAmount}
                                value={intl.formatNumber(paymentSum, { style: 'currency', currency: defaultCurrencyCode })}
                            />
                            <StatisticCard
                                label={ResidentsInApp}
                                value={residentsCount}
                            />
                            <StatisticCard
                                label={UnitsCount}
                                value={propertyData}
                            />
                        </Row>
                    </Col>
                </Row>
            )}
        </Card>
    )
}

type DashboardCardType = ({ count, loading }: {
    count: string
    loading: boolean
}) => React.ReactElement

const IncidentDashboard: DashboardCardType = ({ count, loading }) => {
    const intl = useIntl()
    const IncidentsTitle = intl.formatMessage({ id: 'pages.reports.incidentsTitle' })
    const IncidentDescription = intl.formatMessage({ id: 'pages.reports.incidentsDescription' })

    const { push } = useRouter()

    const onCardClick = useCallback(async () => {
        await push('/incident')
    }, [push])

    const incidentCardContent = useMemo(() => (
        <Row style={CARD_STYLE} align='middle'>
            <Col span={24} style={TEXT_CENTER_STYLE}>
                <Space direction='vertical' size={12} align='center'>
                    <Typography.Title level={1} type={Number(count) > 0 ? 'danger' : 'success'}>{count}</Typography.Title>
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

const TicketQualityControlDashboard = ({ data, translations, loading, organizationId }) => {
    const intl = useIntl()
    const QualityControlTitle = intl.formatMessage({ id: 'ticket.qualityControl' })
    const TicketFeedbackTitle = intl.formatMessage({ id: 'pages.reports.ticketFeedbackCount' })

    const [isOpen, setIsOpen] = useState(false)
    const [localData, setLocalData] = useState([])
    const [tickets, setTickets] = useState([])
    const [ticketsCount, setTicketsCount] = useState(0)

    const router = useRouter()
    const { dateRange, SearchInput: DateRangeSearch } = useDateRangeFilter()
    const { values, SearchInput } = usePropertyFilter({ organizationId })
    const { offset } = useMemo(() => parseQuery(router.query), [router.query])
    const currentPageIndex = useMemo(() => getPageIndexFromOffset(offset, MODAL_TABLE_PAGE_SIZE), [offset])

    const { columns } = useTicketQualityTableColumns()

    const [loadTicketFeedback, { loading: ticketFeedbackLoading }] = useLazyQuery(GET_OVERVIEW_DASHBOARD_MUTATION, {
        onCompleted: (response) => {
            setLocalData(get(response, 'result.overview.ticketQualityControlValue.tickets', []))
        },
    })
    const [loadAllTickets, { loading: ticketsLoading }] = useLazyQuery(TicketGQL.GET_ALL_OBJS_WITH_COUNT_QUERY, {
        onCompleted: (response) => {
            setTickets(response.objs)
            setTicketsCount(response.meta.count)
        },
    })

    useEffect(() => {
        if (isOpen) {
            loadTicketFeedback({
                variables: {
                    data: {
                        dv: 1,
                        sender: getClientSideSenderInfo(),
                        where: {
                            organization: organizationId,
                            dateFrom: dateRange[0].toISOString(),
                            dateTo: dateRange[1].toISOString(),
                            propertyIds: values,
                        },
                        groupBy: { aggregatePeriod: 'day' },
                        entities: ['ticketQualityControlValue'],
                    },
                },
            })
            loadAllTickets({
                variables: {
                    where: {
                        organization: { id: organizationId },
                        AND: [
                            { createdAt_gte: dateRange[0].toISOString() },
                            { createdAt_lte: dateRange[1].toISOString() },
                        ],
                        OR: [
                            { qualityControlValue_in: QUALITY_CONTROL_VALUES },
                            { feedbackValue_in: QUALITY_CONTROL_VALUES },
                        ],
                        ...(values.length && { property: { id_in: values } }),
                    },
                    sortBy: ['createdAt_DESC'],
                    first: MODAL_TABLE_PAGE_SIZE,
                    skip: (currentPageIndex - 1) * MODAL_TABLE_PAGE_SIZE,
                },
            })
        }
    }, [isOpen, organizationId, loadAllTickets, currentPageIndex, values, dateRange, loadTicketFeedback])

    const ticketCardContent = useMemo(() => {
        const goodKey = get(translations.find(t => t.value === TicketQualityControlValueType.Good), 'key')
        const badKey = get(translations.find(t => t.value === TicketQualityControlValueType.Bad), 'key')
        const goodCount = data
            .filter(e => e.qualityControlValue === goodKey)
            .reduce((prev, curr) => prev + curr.count, 0)
        const badCount = data.
            filter(e => e.qualityControlValue === badKey)
            .reduce((prev, curr) => prev + curr.count, 0)

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
    }, [data, translations, TicketFeedbackTitle])

    const onCardClick = useCallback(() => {
        setIsOpen(true)
    }, [])

    const onCancel = useCallback(() => {
        setIsOpen(false)
        router.replace('/reports', undefined, { shallow: true })
    }, [router])

    return (
        <>
            <Card
                title={<Typography.Title level={3}>{QualityControlTitle}</Typography.Title>}
                hoverable
                onClick={onCardClick}
            >
                {loading ? <Skeleton active paragraph={{ rows: 3 }} /> : ticketCardContent}
            </Card>
            <Modal width='big' scrollX={false} title={QualityControlTitle} open={isOpen} onCancel={onCancel}>
                <Row gutter={[24, 40]}>
                    <Col span={24}>
                        <DateRangeSearch disabled={ticketsLoading || ticketFeedbackLoading} />
                    </Col>
                    <Col span={24}>
                        {SearchInput}
                    </Col>
                    <Col span={24}>
                        <TicketQualityControlChart data={[localData, translations]} loading={ticketFeedbackLoading} />
                    </Col>
                    <Col span={24}>
                        <Table
                            columns={columns}
                            loading={ticketsLoading}
                            dataSource={tickets}
                            totalRows={ticketsCount}
                            pageSize={MODAL_TABLE_PAGE_SIZE}
                        />
                    </Col>
                </Row>
            </Modal>
        </>
    )
}

export const Dashboard: React.FC<{ organizationId: string }> = ({ organizationId }) => {
    const [overview, setOverview] = useState<OverviewData>(null)
    const { dateRange, SearchInput: DateRangeSearch } = useDateRangeFilter()
    const { values: propertyIds, SearchInput: OrganizationPropertySearch } = usePropertyFilter({ organizationId })

    const { breakpoints: { TABLET_LARGE } } = useLayoutContext()
    const { width } = useWindowSize()

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
                    dateTo: dateRange[1].toISOString(),
                    propertyIds,
                },
                groupBy: {
                    aggregatePeriod: 'day',
                },
            },
        } })
    }, [organizationId, loadDashboardData, dateRange, propertyIds])

    const newTickets = get(overview, 'ticketByDay.tickets', [])
    const propertyTickets = get(overview, 'ticketByProperty.tickets', [])
    const categoryTickets = get(overview, 'ticketByCategory.tickets', [])
    const executorTickets = get(overview, 'ticketByExecutor.tickets', [])
    const ticketQualityControlValue = get(overview, 'ticketQualityControlValue.tickets', [])
    const ticketQualityControlValueTranslations = get(overview, 'ticketQualityControlValue.translations', [])
    const propertyData = get(overview, 'property.sum', 0)
    const paymentsData = get(overview, 'payment.payments', [])
    const paymentSum = get(overview, 'payment.sum', null)
    const receiptsData = get(overview, 'receipt.receipts', [])
    const residentsData = get(overview, 'resident.residents', [])
    const incidentsCount = get(overview, 'incident.count', 0)
    const chargedToPaidData = paymentsData.length > 0 && receiptsData.length > 0 ? [paymentsData, receiptsData] : []

    return (
        <Row gutter={DASHBOARD_ROW_GUTTER}>
            <Col span={24}>
                <TableFiltersContainer>
                    <Row gutter={[24, 24]} align='middle' justify='start' wrap>
                        <Col span={TABLET_LARGE ? 10 : 24}>
                            <DateRangeSearch disabled={loading} />
                        </Col>
                        <Col span={TABLET_LARGE ? 14 : 24}>
                            {OrganizationPropertySearch}
                        </Col>
                    </Row>
                </TableFiltersContainer>
            </Col>
            <Col xl={width > DASHBOARD_WIDTH_BREAKPOINT ? 12 : 24} lg={24}>
                <PerformanceCard
                    organizationId={organizationId}
                    paymentSum={paymentSum}
                    residentsData={residentsData}
                    propertyIds={propertyIds}
                    propertyData={propertyData}
                    loading={loading}
                    dateRange={dateRange}
                />
            </Col>
            <Col xl={6} lg={12} xs={24}>
                <IncidentDashboard
                    count={incidentsCount}
                    loading={loading}
                />
            </Col>
            <Col xl={6} lg={12} xs={24}>
                <TicketQualityControlDashboard
                    data={ticketQualityControlValue}
                    translations={ticketQualityControlValueTranslations}
                    loading={loading}
                    organizationId={organizationId}
                />
            </Col>
            {overview === null ? (
                <Skeleton paragraph={{ rows: 62 }} loading active />
            ) : (
                <Col span={24}>
                    <Row gutter={DASHBOARD_ROW_GUTTER}>
                        <Col lg={12} md={24} xs={24}>
                            <AllTicketsChart
                                data={newTickets}
                            />
                        </Col>
                        <Col lg={12} md={24} xs={24}>
                            <TicketByCategoryChart
                                data={categoryTickets}
                                organizationId={organizationId}
                            />
                        </Col>
                        <Col lg={12} md={24} xs={24}>
                            <PaymentTotalChart
                                data={paymentsData}
                            />
                        </Col>
                        <Col lg={12} md={24} xs={24}>
                            <PaymentReceiptChart
                                data={chargedToPaidData}
                            />
                        </Col>
                        <Col lg={12} md={24} xs={24}>
                            <PaymentByPropertyChart
                                data={paymentsData}
                                organizationId={organizationId}
                            />
                        </Col>
                        <Col lg={12} md={24} xs={24}>
                            <ResidentByPropertyChart
                                data={residentsData}
                                organizationId={organizationId}
                            />
                        </Col>
                        <Col lg={12} md={24} xs={24}>
                            <TicketByExecutorChart
                                data={executorTickets}
                                organizationId={organizationId}
                            />
                        </Col>
                        <Col lg={12} md={24} xs={24}>
                            <TicketByPropertyChart
                                data={propertyTickets}
                                organizationId={organizationId}
                            />
                        </Col>
                    </Row>
                </Col>
            )}
        </Row>
    )
}
