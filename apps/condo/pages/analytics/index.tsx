import React, { useCallback, useEffect, useState } from 'react'
import Head from 'next/head'
import { useIntl } from '@core/next/intl'
import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { Col, Radio, Row, Space, Table, Typography, Tabs, Skeleton, Divider, Select, TableColumnsType } from 'antd'
import { useRouter } from 'next/router'
import { useOrganization } from '@core/next/organization'
import get from 'lodash/get'
import { getFiltersFromQuery } from '@condo/domains/common/utils/helpers'
import { useTableColumns } from '@condo/domains/ticket/hooks/useTableColumns'
import debounce from 'lodash/debounce'
import qs from 'qs'
import pickBy from 'lodash/pickBy'
import ReactECharts from 'echarts-for-react'
import { colors } from '@condo/domains/common/constants/style'
import { GET_TICKET_ANALYTICS_REPORT_DATA } from '@condo/domains/ticket/gql'
import { useLazyQuery } from '@core/next/apollo'

import { EmptyListView } from '@condo/domains/common/components/EmptyListView'
import { getPageSizeFromQuery, queryToSorter, filtersToQuery, getSortStringFromQuery, sorterToQuery, getPageIndexFromQuery, IFilters } from '@condo/domains/ticket/utils/helpers'
import { Ticket } from '@condo/domains/ticket/utils/clientSchema'
import { SortTicketsBy } from '../../schema'
import moment from 'moment'
import { BarChartIcon, LinearChartIcon } from '@condo/domains/common/components/icons/ChartIcons'
import { Loader } from '@condo/domains/common/components/Loader'

interface IPageWithHeaderAction extends React.FC {
    headerAction?: JSX.Element
}
type viewModeTypes = 'bar' | 'line' | 'pie'
interface ITicketAnalyticsPageChartViewProps {
    data: null | any;
    viewMode: viewModeTypes;
    loading?: boolean;
}
interface ITicketAnalyticsPageListViewProps {
    data: null | any;
    loading?: boolean;
    viewMode: viewModeTypes;
}
type groupTicketsByTypes = 'status' | 'property' | 'category' | 'user' | 'responsible'
type ticketSelectTypes = 'default' | 'paid' | 'emergency'
// TODO: grab selectedPeriod from filter component
const SELECTED_PERIOD = [moment().subtract(25, 'days'), moment().add(1, 'day')]
const COLOR_SET = [colors.blue[5], colors.green[5], colors.red[4], colors.gold[5], colors.green[7], colors.sberGrey[7], colors.blue[4]]

const TicketAnalyticsPageChartView: React.FC<ITicketAnalyticsPageChartViewProps> = ({ children, data, viewMode, loading = false }) => {
    if (data === null) {
        return <Loader />
    }
    const series = []
    const isLineChart = viewMode === 'line'
    const { result, axisLabels, labels } = data
    const legend = Object.values(labels)
    Object.entries(result).map(([ticketType, dataObj]) => {
        series.push({
            name: labels[ticketType],
            type: viewMode,
            symbol: 'none',
            stack: isLineChart ? ticketType : 'total',
            data: Object.values(dataObj),
        })
    })
    const axisData = {
        yAxis: {
            type: isLineChart ? 'value' : 'category',
            data: isLineChart ? null : axisLabels,
        },
        xAxis: {
            type: isLineChart ? 'category' : 'value',
            data: isLineChart ? axisLabels : null,
        },
    }

    const option = {
        color: COLOR_SET,
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'line',
            },
        },
        legend: {
            data: legend,
            x: 'left',
            top: 10,
            padding: 1,
            icon: 'circle',
            itemWidth: 7,
            itemHeight: 7,
            textStyle: {
                fontSize: '16px',
            },
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true,
            borderWidth: 1,
        },
        ...axisData,
        series,
    }

    return <div style={{ position: 'relative' }}>
        <ReactECharts showLoading={loading} option={option} />
        {children}
    </div>
}

const TicketAnalyticsPageListView: React.FC<ITicketAnalyticsPageListViewProps> = ({ loading = false, data, viewMode }) => {
    const intl = useIntl()
    const tableTitle = intl.formatMessage({ id: 'Table' })
    const dateTitle = intl.formatMessage({ id: 'Date' })
    const addressTitle = intl.formatMessage({ id: 'field.Address' })
    if (data === null) {
        return <Loader size='large' />
    }
    const { labels, tableData } = data
    const tableColumns = [
        { title: dateTitle, dataIndex: 'date', key: 'date' },
        { title: addressTitle, dataIndex: 'address', key: 'address' },
        ...Object.entries(labels).map(([key, value]) => ({ title: value, dataIndex: value, key })),
    ]

    return (
        <>
            <Typography.Title level={4} style={{ marginBottom: 20 }}>{tableTitle}</Typography.Title>
            <Table
                bordered
                tableLayout={'fixed'}
                scroll={{ scrollToFirstRowOnChange: false }}
                loading={loading}
                dataSource={tableData}
                columns={tableColumns as TableColumnsType}
                pagination={false}
            />
        </>
    )
}


const TicketAnalyticsPageFilter: React.FC = () => (
    <Skeleton loading={true} />
)


const TicketAnalyticsPage: IPageWithHeaderAction = () => {
    const intl = useIntl()
    const [dateFrom, dateTo] = SELECTED_PERIOD
    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])

    const [groupTicketsBy, setGroupTicketsBy] = useState<groupTicketsByTypes>('status')
    const [viewMode, setViewMode] = useState<viewModeTypes>('line')
    const [analyticsData, setAnalyticsData] = useState(null)
    const [loading, setLoading] = useState<boolean>(false)
    const [ticketType, setTicketType] = useState<ticketSelectTypes>('default')

    const pageTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.PageTitle' })
    const viewModeTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.ViewModeTitle' })
    const statusFilterLabel = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.groupByFilter.Status' })
    const propertyFilterLabel = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.groupByFilter.Property' })
    const categoryFilterLabel = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.groupByFilter.Category' })
    const userFilterLabel = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.groupByFilter.User' })
    const responsibleFilterLabel = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.groupByFilter.Responsible' })
    const ticketTypeDefault = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.ticketType.Default' })
    const ticketTypePaid = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.ticketType.Paid' })
    const ticketTypeEmergency = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.ticketType.Emergency' })
    const selectedPeriod = SELECTED_PERIOD.map(e => e.format('DD.MM.YYYY')).join(' - ')


    const [loadTicketAnalyticsData] = useLazyQuery(GET_TICKET_ANALYTICS_REPORT_DATA, {
        onError: error => {
            console.log(error)
            setLoading(false)
        },
        fetchPolicy: 'network-only',
        onCompleted: response => {
            const { result: { data } } = response
            console.log(data)
            setAnalyticsData(data)
            setLoading(false)
        },
    })

    useEffect(() => {
        setLoading(true)
        loadTicketAnalyticsData({ variables: {
            data: {
                dateFrom: dateFrom.toISOString(),
                dateTo: dateTo.toISOString(),
                groupBy: groupTicketsBy,
                userOrganizationId,
                ticketType,
                viewMode,
            } } } )
    }, [groupTicketsBy, userOrganizationId, ticketType, viewMode])

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
                            <Tabs
                                defaultActiveKey='status'
                                activeKey={groupTicketsBy}
                                onChange={(key) => setGroupTicketsBy(key as groupTicketsByTypes)}
                            >
                                <Tabs.TabPane key='status' tab={statusFilterLabel} />
                                <Tabs.TabPane disabled key='property' tab={propertyFilterLabel} />
                                <Tabs.TabPane disabled key='category' tab={categoryFilterLabel} />
                                <Tabs.TabPane disabled key='user' tab={userFilterLabel} />
                                <Tabs.TabPane disabled key='responsible' tab={responsibleFilterLabel} />
                            </Tabs>
                        </Col>
                        <Col span={24}>
                            <TicketAnalyticsPageFilter />
                            <Divider />
                        </Col>
                        <Col span={14}>
                            <Typography.Title level={3}>{viewModeTitle} {selectedPeriod}</Typography.Title>
                        </Col>
                        <Col span={4} style={{ textAlign: 'right', flexWrap: 'nowrap' }}>
                            <Radio.Group
                                className={'sberRadioGroup sberRadioGroupIcon'}
                                value={viewMode}
                                size={'small'}
                                buttonStyle='outline'
                                onChange={(e) => setViewMode(e.target.value)}>
                                <Radio.Button value='line'>
                                    <LinearChartIcon height={32} width={24} />
                                </Radio.Button>
                                <Radio.Button value='bar'>
                                    <BarChartIcon height={32} width={24} />
                                </Radio.Button>
                            </Radio.Group>
                        </Col>
                        <Col span={24}>
                            <TicketAnalyticsPageChartView data={analyticsData} loading={loading} viewMode={viewMode}>
                                <Select
                                    value={ticketType}
                                    onChange={(e) => setTicketType(e)}
                                    style={{ position: 'absolute', top: 0, right: 0, minWidth: '132px' }}
                                >
                                    <Select.Option value='default'>{ticketTypeDefault}</Select.Option>
                                    <Select.Option value='paid'>{ticketTypePaid}</Select.Option>
                                    <Select.Option value='emergency'>{ticketTypeEmergency}</Select.Option>
                                </Select>
                            </TicketAnalyticsPageChartView>
                        </Col>
                        <Col span={24}>
                            <TicketAnalyticsPageListView data={analyticsData} loading={loading} viewMode={viewMode} />
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
