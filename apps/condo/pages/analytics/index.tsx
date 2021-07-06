import React, { useCallback, useEffect, useState } from 'react'
import Head from 'next/head'
import { useIntl } from '@core/next/intl'
import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { Col, Radio, Row, Space, Table, Typography, Tabs, Skeleton } from 'antd'
import { BarChartOutlined, PieChartOutlined, LineChartOutlined } from '@ant-design/icons'
import { useRouter } from 'next/router'
import { useOrganization } from '@core/next/organization'
import get from 'lodash/get'
import { getFiltersFromQuery } from '@condo/domains/common/utils/helpers'
import { useTableColumns } from '@condo/domains/ticket/hooks/useTableColumns'
import debounce from 'lodash/debounce'
import qs from 'qs'
import pickBy from 'lodash/pickBy'
import ReactECharts from 'echarts-for-react'

import { EmptyListView } from '@condo/domains/common/components/EmptyListView'
import { getPageSizeFromQuery, queryToSorter, filtersToQuery, getSortStringFromQuery, sorterToQuery, getPageIndexFromQuery, IFilters } from '@condo/domains/ticket/utils/helpers'
import { Ticket } from '@condo/domains/ticket/utils/clientSchema'
import { SortTicketsBy } from '../../schema'
import moment from 'moment'

interface IPageWithHeaderAction extends React.FC {
    headerAction?: JSX.Element
}
type viewModeTypes = 'chart' | 'list'
type chartModeTypes = 'stacked-bar' | 'pie' | 'linear'
// TODO: grab selectedPeriod from filter component
const SELECTED_PERIOD = [moment().subtract(7, 'days'), moment()]

const TicketAnalyticsPageChartView: React.FC = () => {
    const series = [
        {
            name: 'Direct',
            type: 'bar',
            stack: 'total',
            label: {
                show: true,
            },
            emphasis: {
                focus: 'series',
            },
            data: [320, 302, 301, 334, 390, 330, 320],
        },
    ]
    const [chartType, setChartType] = useState<chartModeTypes>('stacked-bar')
    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])

    const [startDate, endDate] = SELECTED_PERIOD
    const where = {
        organization: { id: userOrganizationId },
        createdAt_gte: startDate.toISOString(), createdAt_lte: endDate.toISOString(),
    }


    const {
        loading,
        count: total,
        objs: tickets,
    } = Ticket.useObjects({
        where,
    }, {
        fetchPolicy: 'network-only',
    })

    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {            // Use axis to trigger tooltip
                type: 'shadow',        // 'shadow' as default; can also be 'line' or 'shadow'
            },
        },
        legend: {
            data: ['Direct', 'Mail Ad', 'Affiliate Ad', 'Video Ad', 'Search Engine'],
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true,
        },
        xAxis: {
            type: 'value',
        },
        yAxis: {
            type: 'category',
            data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        },
        series,
    }

    return <>
        <Tabs
            defaultActiveKey='stacked-bar'
            activeKey={chartType}
            onChange={(key) => setChartType(key as chartModeTypes)}
        >
            <Tabs.TabPane key='stacked-bar' tab={<span><BarChartOutlined />График 1</span>} />
            <Tabs.TabPane key='pie' tab={<span><PieChartOutlined />График 2</span>} />
            <Tabs.TabPane key='linear' tab={<span><LineChartOutlined />График 3</span>} />
        </Tabs>
        <ReactECharts showLoading={loading} option={option} style={{ height: '500px' }} />
    </>
}

const TicketAnalyticsPageListView: React.FC = () => {
    const intl = useIntl()
    const EmptyListLabel = intl.formatMessage({ id: 'ticket.EmptyList.header' })
    const EmptyListMessage = intl.formatMessage({ id: 'ticket.EmptyList.title' })
    const CreateTicket = intl.formatMessage({ id: 'CreateTicket' })

    const router = useRouter()
    const sortFromQuery = sorterToQuery(queryToSorter(getSortStringFromQuery(router.query)))
    const offsetFromQuery = getPageIndexFromQuery(router.query)
    const filtersFromQuery = getFiltersFromQuery<IFilters>(router.query)
    const pagesizeFromQuey: number = getPageSizeFromQuery(router.query)

    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])

    const sortBy = sortFromQuery.length > 0  ? sortFromQuery : 'createdAt_DESC'
    const where = { ...filtersToQuery(filtersFromQuery), organization: { id: userOrganizationId } }

    const {
        fetchMore,
        loading,
        count: total,
        objs: tickets,
    } = Ticket.useObjects({
        sortBy: sortBy as SortTicketsBy[],
        where,
        skip: (offsetFromQuery * pagesizeFromQuey) - pagesizeFromQuey,
        first: pagesizeFromQuey,
    }, {
        fetchPolicy: 'network-only',
    })

    const tableColumns = useTableColumns(sortFromQuery, filtersFromQuery)

    const handleRowAction = useCallback((record) => {
        return {
            onClick: () => {
                router.push(`/ticket/${record.id}/`)
            },
        }
    }, [])

    const handleTableChange = useCallback(debounce((...tableChangeArguments) => {
        const [nextPagination, nextFilters, nextSorter] = tableChangeArguments
        const { current, pageSize } = nextPagination
        const offset = current * pageSize - pageSize
        const sort = sorterToQuery(nextSorter)
        const filters = filtersToQuery(nextFilters)
        if (!loading) {
            fetchMore({
                // @ts-ignore
                sortBy: sort,
                where: filters,
                skip: offset,
                first: current * pageSize,
            }).then(() => {
                const query = qs.stringify(
                    {
                        ...router.query,
                        sort,
                        offset,
                        filters: JSON.stringify(pickBy({ ...filtersFromQuery, ...nextFilters })),
                    },
                    { arrayFormat: 'comma', skipNulls: true, addQueryPrefix: true },
                )
                router.push(router.route + query)
            })
        }
    }, 400), [loading])


    return (
        <>
            {
                (!tickets.length && !filtersFromQuery) ?
                    <EmptyListView
                        label={EmptyListLabel}
                        message={EmptyListMessage}
                        createRoute='/ticket/create'
                        createLabel={CreateTicket}/> :
                    <Table
                        bordered
                        tableLayout={'fixed'}
                        scroll={{
                            scrollToFirstRowOnChange: false,

                        }}
                        loading={loading}
                        dataSource={tickets}
                        columns={tableColumns}
                        onRow={handleRowAction}
                        onChange={handleTableChange}
                        rowKey={record => record.id}
                        pagination={{
                            showSizeChanger: false,
                            total,
                            current: offsetFromQuery,
                            pageSize: pagesizeFromQuey,
                            position: ['bottomLeft'],
                        }}
                    />
            }
        </>
    )
}


const TicketAnalyticsPageFilter: React.FC = () => (
    <Skeleton loading={true} />
)


const TicketAnalyticsPage: IPageWithHeaderAction = () => {
    const intl = useIntl()
    const [viewMode, setViewMode] = useState<viewModeTypes>('chart')
    const pageTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.PageTitle' })
    const showChart = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.ShowChart' })
    const showList = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.ShowList' })
    const viewModeTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.ViewModeTitle' })
    const selectedPeriod = SELECTED_PERIOD.map(e => e.format('DD.MM.YYYY')).join(' - ')
    return <>
        <Head>
            <title>{pageTitle}</title>
        </Head>
        <PageWrapper>
            <PageHeader title={<Typography.Title>{pageTitle}</Typography.Title>} />
            <OrganizationRequired>
                <PageContent>
                    <Row gutter={[0, 40]} align={'top'} justify={'space-between'}>
                        <Col span={24}>
                            <TicketAnalyticsPageFilter />
                        </Col>
                        <Col span={14}>
                            <Typography.Title level={3}>{viewModeTitle} {selectedPeriod}</Typography.Title>
                        </Col>
                        <Col span={6} >
                            <Radio.Group
                                className={'sberRadioGroup'}
                                value={viewMode}
                                buttonStyle='outline'
                                onChange={(e) => setViewMode(e.target.value)}>
                                <Radio.Button value='chart'>{showChart}</Radio.Button>
                                <Radio.Button value='list'>{showList}</Radio.Button>
                            </Radio.Group>
                        </Col>
                        <Col span={24}>
                            {viewMode === 'chart' ? <TicketAnalyticsPageChartView /> : <TicketAnalyticsPageListView />}
                        </Col>
                    </Row>
                </PageContent>
            </OrganizationRequired>
        </PageWrapper>
    </>
}

const HeaderAction = () => {
    const intl = useIntl()

    return (
        <Space>
            <Typography.Text style={{ fontSize: '12px' }}>
                {intl.formatMessage({ id: 'menu.TicketAnalytics' })}
            </Typography.Text>
        </Space>
    )
}

TicketAnalyticsPage.headerAction = <HeaderAction />

export default TicketAnalyticsPage
