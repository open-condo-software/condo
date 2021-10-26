/** @jsx jsx */
import React, { useCallback, useState } from 'react'
import { notification, Col, Input, Row, Table, Typography, Checkbox } from 'antd'
import { TablePaginationConfig } from 'antd/lib/table/interface'
import { Gutter } from 'antd/lib/grid/row'
import Head from 'next/head'
import { useRouter } from 'next/router'
import qs from 'qs'
import { pickBy, get, debounce } from 'lodash'

import { css, jsx } from '@emotion/core'
import { SortTicketsBy } from '@app/condo/schema'
import { DatabaseFilled } from '@ant-design/icons'
import { useIntl } from '@core/next/intl'
import { useOrganization } from '@core/next/organization'
import { useLazyQuery } from '@core/next/apollo'

import { getFiltersFromQuery, getId } from '@condo/domains/common/utils/helpers'
import { Ticket } from '@condo/domains/ticket/utils/clientSchema'
import { EXPORT_TICKETS_TO_EXCEL } from '@condo/domains/ticket/gql'
import {
    filtersToQuery,
    getPageIndexFromQuery,
    getSortStringFromQuery,
    sorterToQuery, queryToSorter, getPageSizeFromQuery,
    IFilters,
} from '@condo/domains/ticket/utils/helpers'

import { useTableColumns } from '@condo/domains/ticket/hooks/useTableColumns'
import { useEmergencySearch } from '@condo/domains/ticket/hooks/useEmergencySearch'
import { useSearch } from '@condo/domains/common/hooks/useSearch'

import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { EmptyListView } from '@condo/domains/common/components/EmptyListView'
import { Button } from '@condo/domains/common/components/Button'
import { TitleHeaderAction } from '@condo/domains/common/components/HeaderActions'

import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'

import { fontSizes } from '@condo/domains/common/constants/style'

interface ITicketIndexPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

const verticalAlign = css`
    & tbody.ant-table-tbody {
        vertical-align: baseline;
    }
`

const EXPORT_ICON = (<DatabaseFilled />)
const EMERGENCY_CHECKBOX_STYLES = { paddingLeft: '0px', fontSize: fontSizes.content }
const PAGE_HEADER_TITLE_STYLES = { margin: 0 }
const ROW_GUTTER: [Gutter, Gutter] = [0, 40]

export const TicketsPageContent = ({
    searchTicketsQuery,
    tableColumns,
    sortBy,
    filtersApplied,
    setFiltersApplied,
    filtersToQuery,
}) => {
    const intl = useIntl()
    const PageTitleMessage = intl.formatMessage({ id: 'pages.condo.ticket.index.PageTitle' })
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const ExportAsExcel = intl.formatMessage({ id: 'ExportAsExcel' })
    const EmptyListLabel = intl.formatMessage({ id: 'ticket.EmptyList.header' })
    const EmptyListMessage = intl.formatMessage({ id: 'ticket.EmptyList.title' })
    const CreateTicket = intl.formatMessage({ id: 'CreateTicket' })
    const EmergencyLabel = intl.formatMessage({ id: 'Emergency' })
    const DownloadExcelLabel = intl.formatMessage({ id: 'pages.condo.ticket.id.DownloadExcelLabel' })
    const timeZone = intl.formatters.getDateTimeFormat().resolvedOptions().timeZone

    const router = useRouter()
    const filtersFromQuery = getFiltersFromQuery<IFilters>(router.query)
    const offsetFromQuery = getPageIndexFromQuery(router.query)
    const pagesizeFromQuery: number = getPageSizeFromQuery(router.query)

    const {
        fetchMore,
        loading,
        count: total,
        objs: tickets,
    } = Ticket.useObjects({
        sortBy: sortBy as SortTicketsBy[],
        where: searchTicketsQuery,
        skip: (offsetFromQuery * pagesizeFromQuery) - pagesizeFromQuery,
        first: pagesizeFromQuery,
    }, {
        fetchPolicy: 'network-only',
    })

    const [downloadLink, setDownloadLink] = useState(null)

    const [exportToExcel, { loading: isXlsLoading }] = useLazyQuery(
        EXPORT_TICKETS_TO_EXCEL,
        {
            onError: error => {
                notification.error(error)
            },
            onCompleted: data => {
                setDownloadLink(data.result.linkToFile)
            },
        },
    )

    const handleRowAction = useCallback((record) => ({
        onClick: () => {
            router.push(`/ticket/${record.id}/`)
        },
    }), [])

    const handleTableChange = useCallback(debounce((...tableChangeArguments) => {
        const [nextPagination, nextFilters, nextSorter] = tableChangeArguments
        const { current, pageSize } = nextPagination
        const offset = filtersApplied ? 0 : current * pageSize - pageSize
        const sort = sorterToQuery(nextSorter)
        const filters = filtersToQuery(nextFilters)

        setFiltersApplied(false)

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
                setDownloadLink(null)
                router.push(router.route + query)
            })
        }
    }, 400), [loading])

    const [search, handleSearchChange] = useSearch<IFilters>(loading)
    const [emergency, handleEmergencyChange] = useEmergencySearch<IFilters>(loading)

    const handleExport = React.useCallback(() => {
        return exportToExcel({
            variables: {
                data: {
                    where: searchTicketsQuery,
                    sortBy: sortBy,
                    timeZone,
                },
            },
        })
    }, [searchTicketsQuery, sortBy, timeZone])

    const paginationParams = React.useMemo<TablePaginationConfig>(() =>
        ({
            showSizeChanger: false,
            total,
            current: offsetFromQuery,
            pageSize: pagesizeFromQuery,
            position: ['bottomLeft'],
        }),
    [total, offsetFromQuery, pagesizeFromQuery]
    )

    const handleSearchInputChange = React.useCallback((e) => { handleSearchChange(e.target.value) }, [])

    return (
        <>
            <Head>
                <title>{PageTitleMessage}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={<Typography.Title style={PAGE_HEADER_TITLE_STYLES}>{PageTitleMessage}</Typography.Title>}/>
                <PageContent>
                    {
                        !tickets.length && !filtersFromQuery
                            ? <EmptyListView
                                label={EmptyListLabel}
                                message={EmptyListMessage}
                                createRoute='/ticket/create'
                                createLabel={CreateTicket} />
                            : <Row gutter={ROW_GUTTER} align={'middle'}>
                                <Col span={6}>
                                    <Input
                                        placeholder={SearchPlaceholder}
                                        onChange={handleSearchInputChange}
                                        value={search}
                                    />
                                </Col>
                                <Col span={4} offset={1}>
                                    <Checkbox
                                        onChange={handleEmergencyChange}
                                        checked={emergency}
                                        style={EMERGENCY_CHECKBOX_STYLES}
                                    >
                                        {EmergencyLabel}
                                    </Checkbox>
                                </Col>
                                <Col span={6} push={1}>
                                    {
                                        downloadLink
                                            ?
                                            <Button
                                                type={'inlineLink'}
                                                icon={EXPORT_ICON}
                                                loading={isXlsLoading}
                                                target='_blank'
                                                href={downloadLink}
                                                rel='noreferrer'
                                            >
                                                {DownloadExcelLabel}
                                            </Button>
                                            :
                                            <Button
                                                type={'inlineLink'}
                                                icon={EXPORT_ICON}
                                                loading={isXlsLoading}
                                                onClick={handleExport}
                                            >
                                                {ExportAsExcel}
                                            </Button>
                                    }
                                </Col>
                                <Col span={24}>
                                    <Table
                                        bordered
                                        css={verticalAlign}
                                        tableLayout={'fixed'}
                                        loading={loading}
                                        dataSource={tickets}
                                        columns={tableColumns}
                                        onRow={handleRowAction}
                                        onChange={handleTableChange}
                                        rowKey={getId}
                                        pagination={paginationParams}
                                    />
                                </Col>
                            </Row>
                    }
                </PageContent>
            </PageWrapper>
        </>
    )
}

const TicketsPage: ITicketIndexPage = () => {
    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])

    const router = useRouter()
    const sortFromQuery = sorterToQuery(queryToSorter(getSortStringFromQuery(router.query)))
    const filtersFromQuery = getFiltersFromQuery<IFilters>(router.query)
    const sortBy = sortFromQuery.length > 0  ? sortFromQuery : 'createdAt_DESC' //TODO(Dimitreee):Find cleanest solution
    const [filtersApplied, setFiltersApplied] = useState(false)

    const tableColumns = useTableColumns(sortFromQuery, filtersFromQuery, setFiltersApplied)
    const searchTicketsQuery = React.useMemo(() => (
        { ...filtersToQuery(filtersFromQuery), organization: { id: userOrganizationId } }
    ), [filtersFromQuery, userOrganizationId])

    return (
        <TicketsPageContent
            tableColumns={tableColumns}
            filtersToQuery={filtersToQuery}
            filtersApplied={filtersApplied}
            setFiltersApplied={setFiltersApplied}
            searchTicketsQuery={searchTicketsQuery}
            sortBy={sortBy}
        />
    )
}

const PAGE_HEADER_ACTION_DESCRIPTOR = { id: 'menu.ControlRoom' }

TicketsPage.headerAction = <TitleHeaderAction descriptor={PAGE_HEADER_ACTION_DESCRIPTOR}/>
TicketsPage.requiredAccess = OrganizationRequired

export default TicketsPage
