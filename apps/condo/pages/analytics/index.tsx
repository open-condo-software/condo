/** @jsx jsx */
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { jsx } from '@emotion/core'
import { getQueryParams } from '@condo/domains/common/utils/url.utils'
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
    Tooltip, Form,
} from 'antd'
import { useOrganization } from '@core/next/organization'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import ReactECharts from 'echarts-for-react'
import { colors } from '@condo/domains/common/constants/style'
import { GET_TICKET_ANALYTICS_REPORT_DATA } from '@condo/domains/ticket/gql'
import { useLazyQuery } from '@core/next/apollo'

import moment, { Moment } from 'moment'
import { BarChartIcon, LinearChartIcon } from '@condo/domains/common/components/icons/ChartIcons'
import { Button } from '@condo/domains/common/components/Button'
import { EditFilled, FilePdfFilled, PlusCircleFilled } from '@ant-design/icons'
import ActionBar from '@condo/domains/common/components/ActionBar'
import RadioGroupWithIcon, { radioButtonBorderlessCss } from '@condo/domains/common/components/RadioGroupWithIcon'
import { TicketReportAnalyticsOutput } from '../../schema'
import { useRouter } from 'next/router'
import qs from 'qs'
import DateRangePicker from '@condo/domains/common/components/DateRangePicker'
import { PropertyAddressSearchInput } from '@condo/domains/property/components/PropertyAddressSearchInput'

interface IPageWithHeaderAction extends React.FC {
    headerAction?: JSX.Element
}
type viewModeTypes = 'bar' | 'line' | 'pie'
type specificationTypes = 'days' | 'weeks'
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
type ITicketAnalyticsPageFilters = {
    range: [Moment, Moment];
    specification: specificationTypes;
}
interface ITicketAnalyticsPageFilterProps {
    onChange?: ({ range, specification }: ITicketAnalyticsPageFilters) => void
}
const FORM_ITEM_STYLE = {
    labelCol: {
        span: 24,
    },
    wrapperCol: {
        span: 24,
    },
}
const DATE_RANGE_PRESETS = {
    week: [moment().subtract(1, 'week'), moment()],
    month: [moment().subtract(1, 'month'), moment()],
    quarter: [moment().subtract(1, 'quarter'), moment()],
    year: [moment().subtract(1, 'year'), moment()],
}
type groupTicketsByTypes = 'status' | 'property' | 'category' | 'user' | 'responsible'
type ticketSelectTypes = 'default' | 'paid' | 'emergency'
const DATE_DISPLAY_FORMAT = 'DD.MM.YYYY'
// TODO (sitozzz): get selectedPeriod from filter component
const SELECTED_PERIOD = [moment().subtract(1, 'week'), moment()]
// TODO (sitozzz): get addressList from filter component
const ADDRESS_LIST = []
const COLOR_SET = [colors.blue[5], colors.green[5], colors.red[4], colors.gold[5], colors.volcano[5], colors.purple[5],
    colors.lime[7], colors.sberGrey[7], colors.magenta[5], colors.blue[4], colors.gold[6], colors.cyan[6],
    colors.blue[7], colors.volcano[6], colors.green[5], colors.geekblue[7], colors.sberGrey[7], colors.gold[7],
    colors.magenta[7], colors.yellow[5], colors.lime[7], colors.blue[8], colors.cyan[5], colors.yellow[6],
    colors.purple[7], colors.lime[8], colors.red[6] ]
const SPECIFICATIONS = ['days', 'weeks']

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
    const tableColumns: TableColumnsType = [
        { title: AddressTitle, dataIndex: 'address', key: 'address', sorter: (a, b) => a['address'] - b['address'] },
        ...Object.entries(fetchedTableColumns).map(([key, value]: [string, number]) => (
            { title: value, dataIndex: value, key, sorter: (a, b) => a[value] - b[value] }
        )),
    ]
    if (viewMode === 'line') {
        tableColumns.unshift({
            title: DateTitle,
            dataIndex: 'date',
            key: 'date',
            defaultSortOrder: 'descend',
            sorter: (a, b) => moment(a['date'], DATE_DISPLAY_FORMAT).unix() - moment(b['date'], DATE_DISPLAY_FORMAT).unix(),
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


const TicketAnalyticsPageFilter: React.FC<ITicketAnalyticsPageFilterProps> = ({ onChange }) => {
    const router = useRouter()
    const intl = useIntl()
    const PeriodTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.Filter.PeriodTitle' })
    const SpecificationTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.Filter.SpecificationTitle' })
    const SpecificationDays = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.Filter.Specification.Days' })
    const SpecificationWeeks = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.Filter.Specification.Weeks' })
    const AllAddressesPlaceholder = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.Filter.AllAddressesPlaceholder' })
    const AddressTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.Filter.AddressTitle' })
    const ApplyButtonTitle = intl.formatMessage({ id: 'Show' })
    const PresetWeek = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.Filter.PeriodPreset.Week' })
    const PresetMonth = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.Filter.PeriodPreset.Month' })
    const PresetQuarter = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.Filter.PeriodPreset.Quarter' })
    const PresetYear = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.Filter.PeriodPreset.Year' })

    const [dateRange, setDateRange] = useState<[Moment, Moment]>([moment().subtract(1, 'week'), moment()])
    const [dateRangePreset, setDateRangePreset] = useState<null | string>(null)
    const [specification, setSpecification] = useState<specificationTypes>(SPECIFICATIONS[0] as specificationTypes)

    const updateUrlFilters = useCallback(() => {
        const [startDate, endDate] = dateRange
        router.push('/analytics?' + qs.stringify({
            createdAt_lte: startDate.toISOString(),
            createdAt_gte: endDate.toISOString(),
            specification,
        }))
    }, [dateRange, specification])

    useEffect(() => {
        const queryParams = getQueryParams()
        const startDate = get(queryParams, 'createdAt_lte')
        const endDate = get(queryParams, 'createdAt_gte')
        const specificationUrl = get(queryParams, 'specification')
        if (startDate && endDate && specification) {
            setDateRange([moment(startDate), moment(endDate)])
            setSpecification(specificationUrl)
        }
        isEmpty(queryParams) && updateUrlFilters()
        onChange({ range: dateRange, specification })
    }, [])

    useEffect(() => {
        dateRangePreset !== null && setDateRange(DATE_RANGE_PRESETS[dateRangePreset])
    }, [dateRangePreset])

    const applyFilters = () => {
        updateUrlFilters()
        onChange({ range: dateRange, specification })
    }

    return (
        <Form>
            <Row gutter={[40, 25]} wrap>
                <Col flex={0}>
                    <Form.Item label={PeriodTitle} {...FORM_ITEM_STYLE}>
                        <DateRangePicker
                            value={dateRange}
                            onChange={(range) => setDateRange(range)}
                        />
                        <Typography.Paragraph>
                            <Radio.Group
                                css={radioButtonBorderlessCss}
                                size={'small'}
                                onChange={preset => setDateRangePreset(preset.target.value)}
                            >
                                <Radio.Button value={'week'}>{PresetWeek}</Radio.Button>
                                <Radio.Button value={'month'}>{PresetMonth}</Radio.Button>
                                <Radio.Button value={'quarter'}>{PresetQuarter}</Radio.Button>
                                <Radio.Button value={'year'}>{PresetYear}</Radio.Button>
                            </Radio.Group>
                        </Typography.Paragraph>
                    </Form.Item>
                </Col>
                <Col flex={0}>
                    <Form.Item label={SpecificationTitle} {...FORM_ITEM_STYLE} >
                        <Select value={specification} onChange={(e) => setSpecification(e)} >
                            <Select.Option value={'days'}>{SpecificationDays}</Select.Option>
                            <Select.Option value={'weeks'}>{SpecificationWeeks}</Select.Option>
                        </Select>
                    </Form.Item>
                </Col>
                <Col flex={1}>
                    <Form.Item label={AddressTitle} {...FORM_ITEM_STYLE}>
                        {/* TODO (sitozzz): add value state & change to multiple mode */}
                        <PropertyAddressSearchInput placeholder={AllAddressesPlaceholder} />
                    </Form.Item>
                </Col>
                <Col span={24}>
                    <Button onClick={applyFilters} type={'sberPrimary'}>{ApplyButtonTitle}</Button>
                </Col>
            </Row>
        </Form>
    )
}


const TicketAnalyticsPage: IPageWithHeaderAction = () => {
    const intl = useIntl()
    const [dateFrom, dateTo] = SELECTED_PERIOD
    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])
    const filtersRef = useRef(null)

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
        // TODO (sitozzz): pass filters data from filtersRef.current
        console.log(filtersRef.current)
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
                    <Row gutter={[0, 20]} align={'top'} justify={'space-between'}>
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
                            <TicketAnalyticsPageFilter
                                onChange={(filters) => {
                                    filtersRef.current = filters
                                    // TODO (sitozzz): call loadTicketAnalyticsData with this filters
                                }}
                            />
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
