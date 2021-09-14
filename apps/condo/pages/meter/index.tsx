/** @jsx jsx */
import { jsx } from '@emotion/core'
import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { MeterReading } from '@condo/domains/meter/utils/clientSchema'
import { DatabaseFilled } from '@ant-design/icons'
import { useIntl } from '@core/next/intl'
import { useLazyQuery } from '@core/next/apollo'
import { notification, Col, Row, Typography } from 'antd'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { get } from 'lodash'
import React, { useCallback, useEffect, useState } from 'react'
import { EmptyListView } from '@condo/domains/common/components/EmptyListView'
import { Button } from '@condo/domains/common/components/Button'
import { useOrganization } from '@core/next/organization'
import { MeterReadingWhereInput, SortMeterReadingsBy } from '../../schema'
import {
    getDayGteFilter, getDayLteFilter,
    getFilter,
    getPageIndexFromOffset,
    getStringContainsFilter,
    parseQuery,
    QueryMeta,
} from '../../domains/common/utils/tables.utils'
import { useTableColumns } from '../../domains/meter/hooks/useTableColumns'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { useQueryMappers } from '../../domains/common/hooks/useQueryMappers'
import qs from 'qs'
import DateRangePicker from '@condo/domains/common/components/Pickers/DateRangePicker'
import { Dayjs } from 'dayjs'
import { EXPORT_METER_READINGS } from '@condo/domains/meter/gql'


interface ITicketIndexPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

export const MetersPageContent = ({
    searchMeterReadingsQuery,
    tableColumns,
    sortBy,
}) => {
    const intl = useIntl()
    const PageTitleMessage = intl.formatMessage({ id: 'pages.condo.meter.index.PageTitle' })
    const ExportAsExcel = intl.formatMessage({ id: 'ExportAsExcel' })
    const EmptyListLabel = intl.formatMessage({ id: 'ticket.EmptyList.header' })
    const EmptyListMessage = intl.formatMessage({ id: 'ticket.EmptyList.title' })
    const CreateTicket = intl.formatMessage({ id: 'CreateTicket' })
    const DownloadExcelLabel = intl.formatMessage({ id: 'pages.condo.ticket.id.DownloadExcelLabel' })
    const timeZone = intl.formatters.getDateTimeFormat().resolvedOptions().timeZone

    const router = useRouter()
    const { filters, offset } = parseQuery(router.query)
    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)

    const {
        loading,
        count: total,
        objs: meterReadings,
    } = MeterReading.useObjects({
        sortBy,
        where: searchMeterReadingsQuery,
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
    }, {
        fetchPolicy: 'network-only',
    })

    const [downloadLink, setDownloadLink] = useState(null)

    const [
        exportToExcel,
        { loading: isXlsLoading },
    ] = useLazyQuery(
        EXPORT_METER_READINGS,
        {
            onError: error => {
                notification.error(error)
            },
            onCompleted: data => {
                setDownloadLink(data.result.linkToFile)
            },
        },
    )

    const handleRowAction = useCallback((record) => {
        return {
            onClick: () => {
                router.push(`/meter/${record.id}/`)
            },
        }
    }, [])

    const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>()

    const updateUrlDateRangeFilters = useCallback(() => {
        if (!dateRange) return

        const [startDate, endDate] = dateRange
        const newFilters = {
            ...filters,
            createdAt_gte: startDate.toISOString(),
            createdAt_lte: endDate.toISOString(),
        }
        const query = {
            ...router.query,
            filters: JSON.stringify(newFilters),
        }

        const newQuery = qs.stringify({ ...query }, { arrayFormat: 'comma', skipNulls: true, addQueryPrefix: true })
        router.push(router.route + newQuery)
    }, [dateRange])

    useEffect(() => {
        updateUrlDateRangeFilters()
    }, [dateRange])

    return (
        <>
            <Head>
                <title>{PageTitleMessage}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={<Typography.Title style={{ margin: 0 }}>{PageTitleMessage}</Typography.Title>}/>
                <PageContent>
                    {
                        !meterReadings.length && !filters
                            ? <EmptyListView
                                label={EmptyListLabel}
                                message={EmptyListMessage}
                                createRoute='/ticket/create'
                                createLabel={CreateTicket} />
                            : <Row gutter={[0, 40]} align={'middle'}>
                                <Col span={6}>
                                    <DateRangePicker
                                        value={dateRange}
                                        onChange={(range) => {
                                            setDateRange(range)
                                        }}
                                    />
                                </Col>
                                <Col span={6} push={1}>
                                    {
                                        downloadLink
                                            ?
                                            <Button
                                                type={'inlineLink'}
                                                icon={<DatabaseFilled />}
                                                loading={isXlsLoading}
                                                target='_blank'
                                                href={downloadLink}
                                                rel='noreferrer'>{DownloadExcelLabel}
                                            </Button>
                                            :
                                            <Button
                                                type={'inlineLink'}
                                                icon={<DatabaseFilled />}
                                                loading={isXlsLoading}
                                                onClick={
                                                    () => exportToExcel({ variables: { data: { where: searchMeterReadingsQuery, sortBy: sortBy, timeZone } } })
                                                }>{ExportAsExcel}
                                            </Button>
                                    }
                                </Col>
                                {/*<Col span={24}>*/}
                                {/*    <Row>*/}
                                {/*        <Col span={4}>*/}
                                {/*            <Checkbox*/}
                                {/*                onChange={handleEmergencyChange}*/}
                                {/*                checked={emergency}*/}
                                {/*                style={{ paddingLeft: '0px', fontSize: '16px' }}*/}
                                {/*            >Звонок жителя</Checkbox>*/}
                                {/*        </Col>*/}
                                {/*        <Col span={6}>*/}
                                {/*            <Checkbox*/}
                                {/*                onChange={handleEmergencyChange}*/}
                                {/*                checked={emergency}*/}
                                {/*                style={{ paddingLeft: '0px', fontSize: '16px' }}*/}
                                {/*            >Приложение жителя</Checkbox>*/}
                                {/*        </Col>*/}
                                {/*    </Row>*/}
                                {/*</Col>*/}
                                <Col span={24}>
                                    <Table
                                        totalRows={total}
                                        loading={loading}
                                        dataSource={meterReadings}
                                        columns={tableColumns}
                                        onRow={handleRowAction}
                                    />
                                </Col>
                            </Row>
                    }
                </PageContent>
            </PageWrapper>
        </>
    )
}

const MetersPage: ITicketIndexPage = () => {
    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])

    const addressFilter = getStringContainsFilter(['property', 'address'])
    const placeFilter = getStringContainsFilter(['meter', 'place'])
    const numberFilter = getStringContainsFilter(['meter', 'number'])
    const clientNameFilter = getStringContainsFilter('clientName')
    const readingDateGteFilter = getDayGteFilter('date')
    const readingDateLteFilter = getDayLteFilter('date')
    const sourceFilter = getFilter(['source', 'id'], 'array', 'string', 'in')
    const resourceFilter = getFilter(['meter', 'resource', 'id'], 'array', 'string', 'in')

    const queryMetas: Array<QueryMeta<MeterReadingWhereInput>> = [
        { keyword: 'address', filters: [addressFilter] },
        { keyword: 'place', filters: [placeFilter] },
        { keyword: 'number', filters: [numberFilter] },
        { keyword: 'clientName', filters: [clientNameFilter] },
        { keyword: 'date', filters: [readingDateGteFilter, readingDateLteFilter] },
        { keyword: 'createdAt_gte', filters: [readingDateGteFilter] },
        { keyword: 'createdAt_lte', filters: [readingDateLteFilter] },
        { keyword: 'source', filters: [sourceFilter] },
        { keyword: 'resource', filters: [resourceFilter] },
    ]

    const sortableProperties = ['date', 'address', 'resource', 'number', 'place', 'value1', 'clientName', 'source']

    const { filtersToWhere, sortersToSortBy } = useQueryMappers(queryMetas, sortableProperties)

    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)

    const tableColumns = useTableColumns()
    const searchMeterReadingsQuery = { ...filtersToWhere(filters), organization: { id: userOrganizationId } }

    return (
        <MetersPageContent
            tableColumns={tableColumns}
            searchMeterReadingsQuery={searchMeterReadingsQuery}
            sortBy={sortersToSortBy(sorters) as SortMeterReadingsBy[]}
        />
    )
}

// MetersPage.headerAction = <TitleHeaderAction descriptor={{ id: 'menu.ControlRoom' }}/>
MetersPage.requiredAccess = OrganizationRequired

export default MetersPage
