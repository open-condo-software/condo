import React, { useCallback, useEffect, useState } from 'react'
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
import { TicketReportAnalyticsOutput } from '../../schema'
import { useRouter } from 'next/router'
import qs from 'qs'

interface IPageWithHeaderAction extends React.FC {
    headerAction?: JSX.Element
}
type viewModeTypes = 'bar' | 'line' | 'pie'
interface ITicketAnalyticsPageWidgetProps {
    data: null | TicketReportAnalyticsOutput['data'];
    viewMode: viewModeTypes;
    loading?: boolean;
}

interface ITicketAnalyticsPageChartProps extends ITicketAnalyticsPageWidgetProps {
    onChartReady?: () => void;
    animationEnabled?: boolean;
    chartHeight?: number;
}
type groupTicketsByTypes = 'status' | 'property' | 'category' | 'user' | 'responsible'
type ticketSelectTypes = 'default' | 'paid' | 'emergency'
const DATE_DISPLAY_FORMAT = 'DD.MM.YYYY'
// TODO(sitozzz): get selectedPeriod from filter component
const SELECTED_PERIOD = [moment().subtract(1, 'week'), moment()]
// TODO(sitozzz): get addressList from filter component
const ADDRESS_LIST = []
const COLOR_SET = [colors.blue[5], colors.green[5], colors.red[4], colors.gold[5], colors.volcano[5], colors.purple[5],
    colors.lime[7], colors.sberGrey[7], colors.magenta[5], colors.blue[4], colors.gold[6], colors.cyan[6],
    colors.blue[7], colors.volcano[6], colors.green[5], colors.geekblue[7], colors.sberGrey[7], colors.gold[7],
    colors.magenta[7], colors.yellow[5], colors.lime[7], colors.blue[8], colors.cyan[5], colors.yellow[6],
    colors.purple[7], colors.lime[8], colors.red[6] ]

const TicketAnalyticsPageChartView: React.FC<ITicketAnalyticsPageChartProps> = ({
    children,
    data,
    viewMode,
    loading = false,
    onChartReady,
    animationEnabled = false,
    chartHeight }) => {
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
        animation: animationEnabled,
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

    return <Typography.Paragraph style={{ position: 'relative' }}>
        <ReactECharts
            opts={{ renderer: 'svg', height: chartHeight ? chartHeight : 'auto' }}
            onChartReady={onChartReady}
            notMerge
            showLoading={loading}
            style={{ height: chartHeight ? 'unset' : 300 }}
            option={option}/>
        {children}
    </Typography.Paragraph>
}

const TicketAnalyticsPageListView: React.FC<ITicketAnalyticsPageWidgetProps> = ({ loading = false, data, viewMode }) => {
    const intl = useIntl()
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
            <Table
                bordered
                tableLayout={'fixed'}
                scroll={{ scrollToFirstRowOnChange: false }}
                loading={loading}
                dataSource={tableData.map(({ address, ...rest }, key) => (
                    { key, address: address === null ? AllAddressTitle : address, ...rest }
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
    const AllAddresses = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.AllAddresses' })
    const AllCategories = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.AllCategories' })
    const TableTitle = intl.formatMessage({ id: 'Table' })
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

    const router = useRouter()
    const printPdf = useCallback(
        () => {
            router.push('/analytics/pdf?' + qs.stringify({
                dateFrom: dateFrom.toISOString(),
                dateTo: dateTo.toISOString(),
                groupBy: groupTicketsBy,
                ticketType,
                viewMode,
                addressList: JSON.stringify(ADDRESS_LIST),
            }))
        },
        [ticketType, viewMode, ADDRESS_LIST, dateFrom, dateTo, groupTicketsBy],
    )


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
                            <Typography.Title level={3}>
                                {ViewModeTitle} {selectedPeriod} {AllAddresses} {AllCategories}
                            </Typography.Title>
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
                            <TicketAnalyticsPageChartView
                                data={analyticsData}
                                loading={loading}
                                viewMode={viewMode}
                                animationEnabled
                            >
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
                            <Typography.Title level={4} style={{ marginBottom: 20 }}>{TableTitle}</Typography.Title>
                            <TicketAnalyticsPageListView data={analyticsData} loading={loading} viewMode={viewMode} />
                        </Col>
                        <ActionBar fullscreen>
                            <Button onClick={printPdf} icon={<FilePdfFilled />} type='sberPrimary' secondary>
                                {PrintTitle}
                            </Button>
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
export { TicketAnalyticsPageChartView, TicketAnalyticsPageListView }
