import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import { useIntl } from '@core/next/intl'
import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import {
    Col,
    Radio,
    Row,
    Space,
    Table,
    Typography,
    Tabs,
    Skeleton,
    Divider,
    Select,
    TableColumnsType,
    Tooltip,
} from 'antd'
import { useOrganization } from '@core/next/organization'
import get from 'lodash/get'
import ReactECharts from 'echarts-for-react'
import { colors } from '@condo/domains/common/constants/style'
import { GET_TICKET_ANALYTICS_REPORT_DATA } from '@condo/domains/ticket/gql'
import { useLazyQuery } from '@core/next/apollo'

import moment from 'moment'
import { BarChartIcon, LinearChartIcon } from '@condo/domains/common/components/icons/ChartIcons'
import { Button } from '@condo/domains/common/components/Button'
import { EditFilled, FilePdfFilled, PlusCircleFilled } from '@ant-design/icons'
import ActionBar from '@condo/domains/common/components/ActionBar'
import RadioGroupWithIcon from '@condo/domains/common/components/RadioGroupWithIcon'

interface IPageWithHeaderAction extends React.FC {
    headerAction?: JSX.Element
}
type viewModeTypes = 'bar' | 'line' | 'pie'
interface ITicketAnalyticsPageWidgetProps {
    data: null | any;
    viewMode: viewModeTypes;
    loading?: boolean;
}
type groupTicketsByTypes = 'status' | 'property' | 'category' | 'user' | 'responsible'
type ticketSelectTypes = 'default' | 'paid' | 'emergency'
const DATE_DISPLAY_FORMAT = 'DD.MM.YYYY'
// TODO: get selectedPeriod from filter component
const SELECTED_PERIOD = [moment().subtract(1, 'week'), moment()]
// TODO: get addressList from filter component
const ADDRESS_LIST = []
const COLOR_SET = [colors.blue[5], colors.green[5], colors.red[4], colors.gold[5], colors.green[7], colors.sberGrey[7], colors.blue[4]]

const TicketAnalyticsPageChartView: React.FC<ITicketAnalyticsPageWidgetProps> = ({ children, data, viewMode, loading = false }) => {
    if (data === null) {
        return <Skeleton loading={loading} active paragraph={{ rows: 6 }} />
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
            emphasis: {
                focus: isLineChart ? 'none' : 'series',
                blurScore: isLineChart ? 'none' : 'series',
            },
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
            trigger: isLineChart ? 'axis' : 'item',
            axisPointer: {
                type: 'line',
            },
        },
        legend: {
            data: legend,
            x: 'left',
            top: 10,
            padding: [5, 135, 0, 0],
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
        <ReactECharts notMerge showLoading={loading} option={option} />
        {children}
    </div>
}

const TicketAnalyticsPageListView: React.FC<ITicketAnalyticsPageWidgetProps> = ({ loading = false, data, viewMode }) => {
    const intl = useIntl()
    const TableTitle = intl.formatMessage({ id: 'Table' })
    const DateTitle = intl.formatMessage({ id: 'Date' })
    const AddressTitle = intl.formatMessage({ id: 'field.Address' })
    const AllAddressTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.tableColumns.AllAddresses' })
    if (data === null) {
        return <Skeleton loading={loading} active paragraph={{ rows: 10 }} />
    }
    const { tableColumns: fetchedTableColumns, tableData } = data
    const tableColumns = [
        { title: AddressTitle, dataIndex: 'address', key: 'address', sorter: (a, b) => a.title - b.title },
        ...Object.entries(fetchedTableColumns).map(([key, value]) => (
            // @ts-ignore
            { title: value, dataIndex: value, key, sorter: (a, b) => a[value] - b[value] }
        )),
    ]
    if (viewMode === 'line') {
        tableColumns.unshift({
            title: DateTitle,
            dataIndex: 'date',
            key: 'date',
            // @ts-ignore
            defaultSortOrder: 'descend',
            sorter: (a, b) => moment(a.date, DATE_DISPLAY_FORMAT).unix() - moment(b.date, DATE_DISPLAY_FORMAT).unix(),
        })
    }

    return (
        <>
            <Typography.Title level={4} style={{ marginBottom: 20 }}>{TableTitle}</Typography.Title>
            <Table
                bordered
                tableLayout={'fixed'}
                scroll={{ scrollToFirstRowOnChange: false }}
                loading={loading}
                dataSource={tableData.map(({ address, ...rest }) => (
                    { address: address === null ? AllAddressTitle : address, ...rest }
                ))}
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

    const PageTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.PageTitle' })
    const HeaderButtonTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.HeaderButtonTitle' })
    const ViewModeTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.ViewModeTitle' })
    const StatusFilterLabel = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.groupByFilter.Status' })
    const PropertyFilterLabel = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.groupByFilter.Property' })
    const CategoryFilterLabel = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.groupByFilter.Category' })
    const UserFilterLabel = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.groupByFilter.User' })
    const ResponsibleFilterLabel = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.groupByFilter.Responsible' })
    const TicketTypeDefault = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.ticketType.Default' })
    const TicketTypePaid = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.ticketType.Paid' })
    const TicketTypeEmergency = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.ticketType.Emergency' })
    const NotImplementedYetMessage = intl.formatMessage({ id: 'NotImplementedYet' })
    const PrintTitle = intl.formatMessage({ id: 'Print' })
    const ExcelTitle = intl.formatMessage({ id: 'Excel' })
    const selectedPeriod = SELECTED_PERIOD.map(e => e.format(DATE_DISPLAY_FORMAT)).join(' - ')


    const [loadTicketAnalyticsData] = useLazyQuery(GET_TICKET_ANALYTICS_REPORT_DATA, {
        onError: error => {
            console.log(error)
            setLoading(false)
        },
        fetchPolicy: 'cache-and-network',
        onCompleted: response => {
            const { result: { data } } = response
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
                addressList: ADDRESS_LIST,
            } } } )
    }, [groupTicketsBy, userOrganizationId, ticketType, viewMode])

    return <>
        <Head>
            <title>{PageTitle}</title>
        </Head>
        <PageWrapper>
            <OrganizationRequired>
                <PageContent>
                    <Row gutter={[0, 40]}>
                        <Col span={18}>
                            <PageHeader style={{ width: '100%' }} title={<Typography.Title>{PageTitle}</Typography.Title>} />
                        </Col>
                        <Col span={6} style={{ textAlign: 'right', marginTop: 4 }}>
                            <Tooltip title={NotImplementedYetMessage}>
                                <Button icon={<PlusCircleFilled />} type='sberPrimary' secondary>{HeaderButtonTitle}</Button>
                            </Tooltip>
                        </Col>
                    </Row>
                    <Row gutter={[0, 40]} align={'top'} justify={'space-between'}>
                        <Col span={24}>
                            <Tabs
                                defaultActiveKey='status'
                                activeKey={groupTicketsBy}
                                onChange={(key) => setGroupTicketsBy(key as groupTicketsByTypes)}
                            >
                                <Tabs.TabPane key='status' tab={StatusFilterLabel} />
                                <Tabs.TabPane disabled key='property' tab={PropertyFilterLabel} />
                                <Tabs.TabPane disabled key='category' tab={CategoryFilterLabel} />
                                <Tabs.TabPane disabled key='user' tab={UserFilterLabel} />
                                <Tabs.TabPane disabled key='responsible' tab={ResponsibleFilterLabel} />
                            </Tabs>
                        </Col>
                        <Col span={24}>
                            <TicketAnalyticsPageFilter />
                            <Divider />
                        </Col>
                        <Col span={14}>
                            <Typography.Title level={3}>{ViewModeTitle} {selectedPeriod}</Typography.Title>
                        </Col>
                        <Col span={4} style={{ textAlign: 'right', flexWrap: 'nowrap' }}>
                            <RadioGroupWithIcon
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
                            </RadioGroupWithIcon>
                        </Col>
                        <Col span={24}>
                            <TicketAnalyticsPageChartView data={analyticsData} loading={loading} viewMode={viewMode}>
                                <Select
                                    value={ticketType}
                                    onChange={(e) => setTicketType(e)}
                                    style={{ position: 'absolute', top: 0, right: 0, minWidth: '132px' }}
                                >
                                    <Select.Option value='default'>{TicketTypeDefault}</Select.Option>
                                    <Select.Option value='paid'>{TicketTypePaid}</Select.Option>
                                    <Select.Option value='emergency'>{TicketTypeEmergency}</Select.Option>
                                </Select>
                            </TicketAnalyticsPageChartView>
                        </Col>
                        <Col span={24}>
                            <TicketAnalyticsPageListView data={analyticsData} loading={loading} viewMode={viewMode} />
                        </Col>
                        <ActionBar fullscreen>
                            <Tooltip title={NotImplementedYetMessage}>
                                <Button icon={<FilePdfFilled />} type='sberPrimary' secondary>{PrintTitle}</Button>
                            </Tooltip>
                            <Tooltip title={NotImplementedYetMessage}>
                                <Button icon={<EditFilled />} type='sberPrimary' secondary>{ExcelTitle}</Button>
                            </Tooltip>
                        </ActionBar>
                    </Row>
                </PageContent>
            </OrganizationRequired>
        </PageWrapper>
    </>
}

const HeaderAction = () => {
    const intl = useIntl()
    const TicketAnalytics = intl.formatMessage({ id: 'menu.TicketAnalytics' })

    return (
        <Space>
            <Typography.Text style={{ fontSize: '12px' }}>{TicketAnalytics}</Typography.Text>
        </Space>
    )
}

TicketAnalyticsPage.headerAction = <HeaderAction />
TicketAnalyticsPage.whyDidYouRender = false


export default TicketAnalyticsPage
