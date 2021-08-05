/** @jsx jsx */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
    Table,
    Typography,
    Tabs,
    Skeleton,
    Divider,
    Select,
    TableColumnsType,
    Tooltip, Form, notification,
} from 'antd'
import { useOrganization } from '@core/next/organization'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import ReactECharts from 'echarts-for-react'
import { colors } from '@condo/domains/common/constants/style'
import { TICKET_ANALYTICS_REPORT_MUTATION } from '@condo/domains/ticket/gql'
import { useLazyQuery } from '@core/next/apollo'

import moment, { Moment } from 'moment'
import { BarChartIcon, LinearChartIcon } from '@condo/domains/common/components/icons/ChartIcons'
import { Button } from '@condo/domains/common/components/Button'
import { EditFilled, FilePdfFilled, PlusCircleFilled } from '@ant-design/icons'
import ActionBar from '@condo/domains/common/components/ActionBar'
import RadioGroupWithIcon, { radioButtonBorderlessCss } from '@condo/domains/common/components/RadioGroupWithIcon'
import { useRouter } from 'next/router'
import qs from 'qs'
import DateRangePicker from '@condo/domains/common/components/DateRangePicker'
import TicketChart, {
    viewModeTypes,
    AnalyticsDataType,
    ticketSelectTypes,
} from '@condo/domains/ticket/components/TicketChart'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { filterToQuery, specificationTypes, ticketAnalyticsPageFilters } from '@condo/domains/ticket/utils/helpers'
import { GraphQlSearchInput } from '@condo/domains/common/components/GraphQlSearchInput'
import { searchProperty } from '@condo/domains/ticket/utils/clientSchema/search'
import { ReturnBackHeaderAction } from '@condo/domains/common/components/HeaderActions'

interface ITicketAnalyticsPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}
interface ITicketAnalyticsPageWidgetProps {
    data: null | AnalyticsDataType
    viewMode: viewModeTypes
    loading?: boolean
}
interface ITicketAnalyticsPageChartProps extends ITicketAnalyticsPageWidgetProps {
    onChartReady?: () => void
    chartConfig: {
        animationEnabled: boolean
        chartOptions?: ReactECharts['props']['opts']
    }
}

interface ITicketAnalyticsPageListViewProps extends ITicketAnalyticsPageWidgetProps {
    filters: null | ticketAnalyticsPageFilters
}
interface ITicketAnalyticsPageFilterProps {
    onChange?: ({ range, specification, addressList }: ticketAnalyticsPageFilters) => void
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

const DATE_DISPLAY_FORMAT = 'DD.MM.YYYY'
const COLOR_SET = [colors.blue[5], colors.green[5], colors.red[4], colors.gold[5], colors.volcano[5], colors.purple[5],
    colors.lime[7], colors.sberGrey[7], colors.magenta[5], colors.blue[4], colors.gold[6], colors.cyan[6],
    colors.blue[7], colors.volcano[6], colors.green[5], colors.geekblue[7], colors.sberGrey[7], colors.gold[7],
    colors.magenta[7], colors.yellow[5], colors.lime[7], colors.blue[8], colors.cyan[5], colors.yellow[6],
    colors.purple[7], colors.lime[8], colors.red[6] ]
const SPECIFICATIONS = ['day', 'week']

const ticketChartDataMapper = new TicketChart({
    line: {
        chart: (viewMode, data) => {
            const axisLabels = Array.from(new Set(Object.values(data).flatMap(e => Object.keys(e))))
            const legend = Object.keys(data)
            const series = []
            Object.entries(data).map(([groupBy, dataObj]) => {
                series.push({
                    name: groupBy,
                    type: viewMode,
                    symbol: 'none',
                    stack: groupBy,
                    data: Object.values(dataObj),
                    emphasis: {
                        focus: 'none',
                        blurScope: 'none',
                    },
                })
            })
            const axisData = { yAxis: { type: 'value', data: null }, xAxis: { type: 'category', data: axisLabels } }
            const tooltip = { trigger: 'axis', axisPointer: { type: 'line' } }
            return { series, legend, axisData, tooltip }
        },
        table: (viewMode, data, restOptions) => {
            const dataSource = []
            const { translations, filters } = restOptions
            const tableColumns: TableColumnsType = [
                { title: translations['address'], dataIndex: 'address', key: 'address', sorter: (a, b) => a['address'] - b['address'] },
                {
                    title: translations['date'],
                    dataIndex: 'date',
                    key: 'date',
                    defaultSortOrder: 'descend',
                    sorter: (a, b) => moment(a['date'], DATE_DISPLAY_FORMAT).unix() - moment(b['date'], DATE_DISPLAY_FORMAT).unix(),
                },
                ...Object.entries(data).map(([key]) => ({ title: key, dataIndex: key, key, sorter: (a, b) =>a[key] - b[key] })),
            ]
            const uniqueDates = Array.from(new Set(Object.values(data).flatMap(e => Object.keys(e))))
            uniqueDates.forEach((date, key) => {
                const restTableColumns = {}
                Object.keys(data).forEach(ticketType => (restTableColumns[ticketType] = data[ticketType][date]))
                let address = translations['allAddresses']
                const addressList = get(filters, 'addresses')
                if (addressList && addressList.length) {
                    address = addressList.join(', ')
                }
                dataSource.push({ key, address, date, ...restTableColumns })
            })
            return { dataSource, tableColumns }
        },
    },
    bar: {
        chart: (viewMode, data) => {
            const series = []
            const axisLabels = Array.from(new Set(Object.values(data).flatMap(e => Object.keys(e))))
            const legend = Object.keys(data)
            Object.entries(data).map(([groupBy, dataObj]) => {
                series.push({
                    name: groupBy,
                    type: viewMode,
                    symbol: 'none',
                    stack: 'total',
                    data: Object.values(dataObj),
                    emphasis: {
                        focus: 'self',
                        blurScope: 'self',
                    },
                })
            })
            const axisData = { yAxis: { type: 'category', data: axisLabels }, xAxis: { type: 'value', data: null } }
            const tooltip = { trigger: 'item', axisPointer: { type: 'line' } }
            return { series, legend, axisData, tooltip }
        },
        table: (viewMode, data, restOptions) => {
            const { translations, filters } = restOptions
            const dataSource = []
            const tableColumns: TableColumnsType = [
                { title: translations['address'], dataIndex: 'address', key: 'address', sorter: (a, b) => a['address'] - b['address'] },
                ...Object.entries(data).map(([key]) => ({ title: key, dataIndex: key, key, sorter: (a, b) => a[key] - b[key] })),
            ]
            const restTableColumns = {}
            const addressList = get(filters, 'addresses')
            const aggregateSummary = addressList !== undefined && addressList.length === 0
            if (aggregateSummary) {
                Object.entries(data).forEach((rowEntry) => {
                    const [ticketType, dataObj] = rowEntry
                    const counts = Object.values(dataObj) as number[]
                    restTableColumns[ticketType] = counts.reduce((a, b) => a + b, 0)
                })
                dataSource.push({
                    key: 0,
                    address: translations['allAddresses'],
                    ...restTableColumns,
                })
            } else {
                addressList.forEach((address, key) => {
                    const tableRow = { key, address }
                    Object.entries(data).forEach(rowEntry => {
                        const [ticketType, dataObj] = rowEntry
                        const counts = Object.entries(dataObj)
                            .filter(obj => obj[0] === address).map(e => e[1]) as number[]
                        tableRow[ticketType] = counts.reduce((a, b) => a + b, 0)
                    })
                    dataSource.push(tableRow)
                })
            }
            return { dataSource, tableColumns }
        },

    },
})

// TODO(sitozzz): move to separate component & make more abstract
const TicketAnalyticsPageChartView: React.FC<ITicketAnalyticsPageChartProps> = ({
    children,
    data,
    viewMode,
    loading = false,
    onChartReady,
    chartConfig,
}) => {
    const intl = useIntl()
    const NoData = intl.formatMessage({ id: 'NoData' })
    if (data === null) {
        return <Skeleton loading={loading} active paragraph={{ rows: 6 }} />
    }
    const { animationEnabled, chartOptions } = chartConfig
    const { series, legend, axisData, tooltip } = ticketChartDataMapper.getChartConfig(viewMode, data)
    const option = {
        animation: animationEnabled,
        color: COLOR_SET,
        tooltip,
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

    const isEmptyDataSet = Object.values(data).every(ticketStatus => {
        if (viewMode === 'line') {
            return isEmpty(ticketStatus)
        }
        return Object.values(ticketStatus).every(count => count === 0)
    }) && !loading
    const chartHeight = get(chartOptions, 'height', 'auto')
    return <Typography.Paragraph style={{ position: 'relative' }}>
        {isEmptyDataSet ? (
            <Typography.Paragraph>
                <BasicEmptyListView>
                    <Typography.Text>{NoData}</Typography.Text>
                </BasicEmptyListView>
                {children}
            </Typography.Paragraph>
        ) : (
            <>
                <ReactECharts
                    opts={{ ...chartOptions, renderer: 'svg', height: chartHeight }}
                    onChartReady={onChartReady}
                    notMerge
                    showLoading={loading}
                    style={{ height: chartHeight !== 'auto' ? 'unset' : 300 }}
                    option={option}/>
                {children}
            </>
        )}

    </Typography.Paragraph>
}

const TicketAnalyticsPageListView: React.FC<ITicketAnalyticsPageListViewProps> = ({
    loading = false,
    data,
    viewMode,
    filters }) => {
    const intl = useIntl()
    const DateTitle = intl.formatMessage({ id: 'Date' })
    const AddressTitle = intl.formatMessage({ id: 'field.Address' })
    const AllAddressTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.tableColumns.AllAddresses' })
    if (data === null || filters === null) {
        return <Skeleton loading={loading} active paragraph={{ rows: 10 }} />
    }
    const restOptions = {
        translations: {
            date: DateTitle,
            address: AddressTitle,
            allAddresses: AllAddressTitle,
        },
        filters: {
            addresses: filters.addressList.map(({ value }) => value),
        },
    }
    const { tableColumns, dataSource } = ticketChartDataMapper.getTableConfig(viewMode, data, restOptions)
    return (
        <Table
            bordered
            tableLayout={'fixed'}
            scroll={{ scrollToFirstRowOnChange: false }}
            loading={loading}
            dataSource={dataSource}
            columns={tableColumns as TableColumnsType}
            pagination={false}
        />
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

    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])
    const [dateRange, setDateRange] = useState<[Moment, Moment]>([moment().subtract(1, 'week'), moment()])
    const [dateRangePreset, setDateRangePreset] = useState<null | string>(null)
    const [addressList, setAddressList] = useState([])
    const addressListRef = useRef([])
    const [specification, setSpecification] = useState<specificationTypes>(SPECIFICATIONS[0] as specificationTypes)

    const updateUrlFilters = useCallback(() => {
        const [startDate, endDate] = dateRange
        router.push(`${router.route}?` + qs.stringify({
            createdAt_lte: startDate.toISOString(),
            createdAt_gte: endDate.toISOString(),
            specification,
            addressList: JSON.stringify(addressListRef.current),
        }))
    }, [dateRange, specification, addressList])

    useEffect(() => {
        const queryParams = getQueryParams()
        const addressList = JSON.parse(get(queryParams, 'addressList', '[]'))
        const startDate = get(queryParams, 'createdAt_lte', moment().subtract(1, 'week').toISOString())
        const endDate = get(queryParams, 'createdAt_gte', moment().toISOString())
        const range = [moment(startDate), moment(endDate)] as [Moment, Moment]
        const specificationUrl = get(queryParams, 'specification')
        if (startDate && endDate && specificationUrl && addressList) {
            addressListRef.current = addressList
            setAddressList(addressList.length ? addressList.map(e => e.value) : [])
            setDateRange(range)
            setSpecification(specificationUrl)
        }
        isEmpty(queryParams) && updateUrlFilters()
        onChange({ range, specification, addressList })
    }, [])

    useEffect(() => {
        dateRangePreset !== null && setDateRange(DATE_RANGE_PRESETS[dateRangePreset])
    }, [dateRangePreset])

    const applyFilters = useCallback(() => {
        updateUrlFilters()
        onChange({ range: dateRange, specification, addressList: addressListRef.current })
    }, [dateRange, specification, addressList])

    const searchAddress = useCallback(
        (client, query) => {
            const where = {
                address_contains_i: query,
                organization: { id: userOrganizationId },
            }

            return searchProperty(client, where, 'unitsCount_DESC')
        },
        [userOrganizationId],
    )

    const onAddressChange = useCallback((labelsList, searchObjectsList) => {
        setAddressList(labelsList as string[])
        addressListRef.current = [...searchObjectsList.map(({ key: id, title: value }) => ({ id, value }))]
    }, [addressList])

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
                            <Select.Option value={'day'}>{SpecificationDays}</Select.Option>
                            <Select.Option value={'week'}>{SpecificationWeeks}</Select.Option>
                        </Select>
                    </Form.Item>
                </Col>
                <Col span={10}>
                    <Form.Item label={AddressTitle} {...FORM_ITEM_STYLE}>
                        <GraphQlSearchInput
                            allowClear
                            search={searchAddress}
                            mode={'multiple'}
                            value={addressList}
                            onChange={onAddressChange}
                            maxTagCount='responsive'
                            placeholder={AllAddressesPlaceholder}
                        />
                    </Form.Item>
                </Col>
                <Col span={24}>
                    <Button onClick={applyFilters} type={'sberPrimary'}>{ApplyButtonTitle}</Button>
                </Col>
            </Row>
        </Form>
    )
}

const TicketAnalyticsPage: ITicketAnalyticsPage = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.PageTitle' })
    const HeaderButtonTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.HeaderButtonTitle' })
    const ViewModeTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.ViewModeTitle' })
    const StatusFilterLabel = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.groupByFilter.Status' })
    const PropertyFilterLabel = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.groupByFilter.Property' })
    const CategoryFilterLabel = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.groupByFilter.Category' })
    const UserFilterLabel = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.groupByFilter.User' })
    const ResponsibleFilterLabel = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.groupByFilter.Responsible' })
    const TicketTypeAll = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.ticketType.AllTypes' })
    const TicketTypeDefault = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.ticketType.Default' })
    const TicketTypePaid = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.ticketType.Paid' })
    const TicketTypeEmergency = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.ticketType.Emergency' })
    const AllAddresses = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.AllAddresses' })
    const ManyAddresses = intl.formatMessage({ id:'pages.condo.analytics.TicketAnalyticsPage.ManyAddresses' })
    const SingleAddress = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.SingleAddress' })
    const AllCategories = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.AllCategories' })
    const TableTitle = intl.formatMessage({ id: 'Table' })
    const NotImplementedYetMessage = intl.formatMessage({ id: 'NotImplementedYet' })
    const PrintTitle = intl.formatMessage({ id: 'Print' })
    const ExcelTitle = intl.formatMessage({ id: 'Excel' })

    const router = useRouter()
    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])

    const filtersRef = useRef(null)
    const [groupTicketsBy, setGroupTicketsBy] = useState<groupTicketsByTypes>('status')
    const [viewMode, setViewMode] = useState<viewModeTypes>('line')
    const [analyticsData, setAnalyticsData] = useState(null)
    const [loading, setLoading] = useState<boolean>(false)

    const [ticketType, setTicketType] = useState<ticketSelectTypes>('all')
    const [dateFrom, dateTo] = filtersRef.current !== null ? filtersRef.current.range : []
    const selectedPeriod = filtersRef.current !== null ? filtersRef.current.range.map(e => e.format(DATE_DISPLAY_FORMAT)).join(' - ') : ''
    const selectedAddresses = filtersRef.current !== null ? filtersRef.current.addressList : []

    const [loadTicketAnalytics] = useLazyQuery(TICKET_ANALYTICS_REPORT_MUTATION, {
        onError: error => {
            console.log(error)
            notification.error(error)
            setLoading(false)
        },
        fetchPolicy: 'network-only',
        onCompleted: response => {
            const { result: { result } } = response
            setAnalyticsData(result)
            setLoading(false)
        },
    })
    const getAnalyticsData = () => {
        if (filtersRef.current !== null) {
            setLoading(true)
            const { AND, groupBy } = filterToQuery(filtersRef.current, viewMode, ticketType)
            const where = { organization: { id: userOrganizationId }, AND }
            loadTicketAnalytics({ variables: { data: { groupBy, where } } })
        }
    }

    useEffect(() => {
        getAnalyticsData()
    }, [groupTicketsBy, userOrganizationId, ticketType, viewMode])

    const printPdf = useCallback(
        () => {
            router.push(router.route + '/pdf?' + qs.stringify({
                dateFrom: dateFrom.toISOString(),
                dateTo: dateTo.toISOString(),
                groupBy: groupTicketsBy,
                ticketType,
                viewMode,
                addressList: JSON.stringify(filtersRef.current.addressList),
                specification: filtersRef.current.specification,
            }))
        },
        [ticketType, viewMode, dateFrom, dateTo, groupTicketsBy, userOrganizationId],
    )

    const onFilterChange: ITicketAnalyticsPageFilterProps['onChange'] = useCallback((filters) => {
        filtersRef.current = filters
        getAnalyticsData()
    }, [viewMode, ticketType, userOrganizationId])

    let addressFilterTitle = selectedAddresses.length === 0 ? AllAddresses : `${SingleAddress} «${selectedAddresses[0].value}»`
    if (selectedAddresses.length > 1) {
        addressFilterTitle = ManyAddresses
    }
    return <>
        <Head>
            <title>{PageTitle}</title>
        </Head>
        <PageWrapper>
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
                        <TicketAnalyticsPageFilter onChange={onFilterChange} />
                        <Divider />
                    </Col>
                    <Col span={16}>
                        <Typography.Title level={3}>
                            {ViewModeTitle} {selectedPeriod} {addressFilterTitle} {AllCategories}
                        </Typography.Title>
                    </Col>
                    <Col span={4} style={{ textAlign: 'right', flexWrap: 'nowrap' }}>
                        <RadioGroupWithIcon
                            value={viewMode}
                            size='small'
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
                        {useMemo(() => (
                            <TicketAnalyticsPageChartView
                                data={analyticsData}
                                loading={loading}
                                viewMode={viewMode}
                                chartConfig={{ animationEnabled: true, chartOptions: { renderer: 'svg' } }}
                            >
                                <Select
                                    value={ticketType}
                                    onChange={(e) => setTicketType(e)}
                                    style={{ position: 'absolute', top: 0, right: 0, minWidth: '132px' }}
                                    disabled={loading}
                                >
                                    <Select.Option value='all'>{TicketTypeAll}</Select.Option>
                                    <Select.Option value='default'>{TicketTypeDefault}</Select.Option>
                                    <Select.Option value='paid'>{TicketTypePaid}</Select.Option>
                                    <Select.Option value='emergency'>{TicketTypeEmergency}</Select.Option>
                                </Select>
                            </TicketAnalyticsPageChartView>
                        ), [analyticsData, loading, viewMode, ticketType])}
                    </Col>
                    <Col span={24}>
                        <Typography.Title level={4} style={{ marginBottom: 20 }}>{TableTitle}</Typography.Title>
                        {useMemo(() => (
                            <TicketAnalyticsPageListView
                                data={analyticsData}
                                loading={loading}
                                viewMode={viewMode}
                                filters={filtersRef.current}
                            />
                        ), [analyticsData, loading, viewMode])}
                    </Col>
                    <ActionBar fullscreen>
                        <Tooltip title={NotImplementedYetMessage}>
                            <Button icon={<FilePdfFilled />} type='sberPrimary' secondary>
                                {PrintTitle}
                            </Button>
                        </Tooltip>
                        <Tooltip title={NotImplementedYetMessage}>
                            <Button icon={<EditFilled />} type='sberPrimary' secondary>{ExcelTitle}</Button>
                        </Tooltip>
                    </ActionBar>
                </Row>
            </PageContent>
        </PageWrapper>
    </>
}

TicketAnalyticsPage.headerAction = <ReturnBackHeaderAction
    descriptor={{ id: 'pages.condo.analytics.TicketAnalyticsPage.PageTitle' }}
    path={'/analytics/'} />
TicketAnalyticsPage.requiredAccess = OrganizationRequired
TicketAnalyticsPage.whyDidYouRender = false


export default TicketAnalyticsPage
export { TicketAnalyticsPageChartView, TicketAnalyticsPageListView }
