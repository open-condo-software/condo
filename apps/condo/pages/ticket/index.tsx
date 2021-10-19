/** @jsx jsx */
import { jsx } from '@emotion/core'
import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { Ticket } from '@condo/domains/ticket/utils/clientSchema'
import { CloseOutlined, DatabaseFilled, FilterFilled } from '@ant-design/icons'
import { IFilters } from '@condo/domains/ticket/utils/helpers'
import { useIntl } from '@core/next/intl'
import { useLazyQuery } from '@core/next/apollo'
import { notification, Col, Input, Row, Typography, Checkbox, Form } from 'antd'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { get } from 'lodash'
import React, { useCallback, useState } from 'react'
import { EmptyListView } from '@condo/domains/common/components/EmptyListView'
import { useTableColumns } from '@condo/domains/ticket/hooks/useTableColumns'
import { useEmergencySearch } from '@condo/domains/ticket/hooks/useEmergencySearch'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { Button } from '@condo/domains/common/components/Button'
import { useOrganization } from '@core/next/organization'
import { SortMeterReadingsBy, SortTicketsBy } from '@app/condo/schema'
import { TitleHeaderAction } from '@condo/domains/common/components/HeaderActions'
import { fontSizes } from '@condo/domains/common/constants/style'
import { useTicketTableFilters } from '../../domains/ticket/hooks/useTicketTableFilters'
import { useQueryMappers } from '../../domains/common/hooks/useQueryMappers'
import { getPageIndexFromOffset, parseQuery } from '../../domains/common/utils/tables.utils'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table'
import { useMultipleFiltersModal } from '../../domains/common/hooks/useMultipleFiltersModal'
import { EXPORT_TICKETS_TO_EXCEL } from '@condo/domains/ticket/gql'
import ActionBar from '../../domains/common/components/ActionBar'
import { FocusContainer } from '../../domains/common/components/FocusContainer'
import qs from 'qs'

interface ITicketIndexPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

//TODO(nomerdvadcatpyat): move to common components and also use it in meter readings page
export const ExportToExcelActionBar = ({
    searchTicketsQuery,
    sortBy,
}) => {
    const intl = useIntl()
    const ExportAsExcel = intl.formatMessage({ id: 'ExportAsExcel' })
    const DownloadExcelLabel = intl.formatMessage({ id: 'pages.condo.ticket.id.DownloadExcelLabel' })
    const timeZone = intl.formatters.getDateTimeFormat().resolvedOptions().timeZone

    const [downloadLink, setDownloadLink] = useState(null)

    const [
        exportToExcel,
        { loading: isXlsLoading },
    ] = useLazyQuery(
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

    return (
        <Form.Item noStyle>
            <ActionBar>
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
                            type={'sberPrimary'}
                            secondary
                            icon={<DatabaseFilled />}
                            loading={isXlsLoading}
                            onClick={
                                () => exportToExcel({ variables: { data: { where: searchTicketsQuery, sortBy: sortBy, timeZone } } })
                            }>{ExportAsExcel}
                        </Button>
                }
            </ActionBar>
        </Form.Item>
    )
}

export const TicketsPageContent = ({
    tableColumns,
    searchTicketsQuery,
    sortBy,
    filterMetas,
}) => {
    const intl = useIntl()
    const PageTitleMessage = intl.formatMessage({ id: 'pages.condo.ticket.index.PageTitle' })
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const EmptyListLabel = intl.formatMessage({ id: 'ticket.EmptyList.header' })
    const EmptyListMessage = intl.formatMessage({ id: 'ticket.EmptyList.title' })
    const CreateTicket = intl.formatMessage({ id: 'CreateTicket' })
    const EmergencyLabel = intl.formatMessage({ id: 'Emergency' })
    const FiltersButtonLabel = intl.formatMessage({ id: 'FiltersLabel' })
    const ClearAllFiltersMessage = intl.formatMessage({ id: 'ClearAllFilters' })

    const router = useRouter()
    const { filters, offset } = parseQuery(router.query)
    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)
    
    const { MultipleFiltersModal, setIsMultipleFiltersModalVisible } = useMultipleFiltersModal(filterMetas)

    searchTicketsQuery = { ...searchTicketsQuery, ...{ deletedAt: null } }

    const {
        loading,
        count: total,
        objs: tickets,
    } = Ticket.useObjects({
        sortBy: sortBy as SortTicketsBy[],
        where: searchTicketsQuery,
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
    }, {
        fetchPolicy: 'network-only',
    })

    console.log('tickets', tickets)

    const handleRowAction = useCallback((record) => {
        return {
            onClick: () => {
                router.push(`/ticket/${record.id}/`)
            },
        }
    }, [])

    const [search, handleSearchChange] = useSearch<IFilters>(loading)
    const [emergency, handleEmergencyChange] = useEmergencySearch<IFilters>(loading)

    const resetQuery = async () => {
        if ('offset' in router.query) router.query['offset'] = '0'
        const query = qs.stringify(
            { ...router.query, filters: JSON.stringify({}) },
            { arrayFormat: 'comma', skipNulls: true, addQueryPrefix: true },
        )

        await router.push(router.route + query)
    }

    return (
        <>
            <Head>
                <title>{PageTitleMessage}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={<Typography.Title style={{ margin: 0 }}>{PageTitleMessage}</Typography.Title>}/>
                <PageContent>
                    {
                        !tickets.length && !filters
                            ? <EmptyListView
                                label={EmptyListLabel}
                                message={EmptyListMessage}
                                createRoute='/ticket/create'
                                createLabel={CreateTicket} />
                            : (
                                <Row gutter={[0, 40]} align={'middle'} justify={'center'}>
                                    <Col span={23}>
                                        <FocusContainer padding={'16px'}>
                                            <Row justify={'space-between'}>
                                                <Col span={6}>
                                                    <Input
                                                        placeholder={SearchPlaceholder}
                                                        onChange={(e)=>{handleSearchChange(e.target.value)}}
                                                        value={search}
                                                    />
                                                </Col>
                                                <Col span={4} offset={1}>
                                                    <Checkbox
                                                        onChange={handleEmergencyChange}
                                                        checked={emergency}
                                                        style={{ paddingLeft: '0px', fontSize: fontSizes.content }}
                                                    >{EmergencyLabel}</Checkbox>
                                                </Col>
                                                <Col>
                                                    <Button
                                                        type={'text'}
                                                        onClick={resetQuery}
                                                    >
                                                        <Typography.Text strong type={'secondary'}>
                                                            {ClearAllFiltersMessage} <CloseOutlined style={{ fontSize: '12px' }} />
                                                        </Typography.Text>
                                                    </Button>,
                                                </Col>
                                                <Col>
                                                    <Button
                                                        secondary
                                                        type={'sberPrimary'}
                                                        onClick={() => setIsMultipleFiltersModalVisible(true)}
                                                    >
                                                        <FilterFilled/>
                                                        {FiltersButtonLabel}
                                                    </Button>
                                                </Col>
                                            </Row>
                                        </FocusContainer>
                                    </Col>
                                    <Col span={24}>
                                        <Table
                                            totalRows={total}
                                            loading={loading}
                                            dataSource={tickets}
                                            columns={tableColumns}
                                            onRow={handleRowAction}
                                        />
                                    </Col>
                                    <ExportToExcelActionBar
                                        searchTicketsQuery={searchTicketsQuery}
                                        sortBy={sortBy}
                                    />
                                </Row>
                            )
                    }
                    <MultipleFiltersModal/>
                </PageContent>
            </PageWrapper>
        </>
    )
}

const TicketsPage: ITicketIndexPage = () => {
    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])

    const filterMetas = useTicketTableFilters()

    const sortableProperties = ['number', 'status', 'details', 'property', 'assignee', 'executor', 'createdAt', 'clientName']

    const { filtersToWhere, sortersToSortBy } = useQueryMappers(filterMetas, sortableProperties)

    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)

    const tableColumns = useTableColumns(filterMetas)
    const searchTicketsQuery = { ...filtersToWhere(filters), organization: { id: userOrganizationId } }

    //
    // const sortFromQuery = sorterToQuery(queryToSorter(getSortStringFromQuery(router.query)))
    // const filtersFromQuery = getFiltersFromQuery<IFilters>(router.query)
    // const sortBy = sortFromQuery.length > 0  ? sortFromQuery : 'createdAt_DESC' //TODO(Dimitreee):Find cleanest solution
    // const [filtersApplied, setFiltersApplied] = useState(false)
    //
    // const tableColumns = useTableColumns(sortFromQuery, filtersFromQuery, setFiltersApplied)
    // const searchTicketsQuery = { ...filtersToQuery(filtersFromQuery), organization: { id: userOrganizationId } }

    return (
        <TicketsPageContent
            tableColumns={tableColumns}
            searchTicketsQuery={searchTicketsQuery}
            sortBy={sortersToSortBy(sorters) as SortMeterReadingsBy[]}
            filterMetas={filterMetas}
        />
    )
}

TicketsPage.headerAction = <TitleHeaderAction descriptor={{ id: 'menu.ControlRoom' }}/>
TicketsPage.requiredAccess = OrganizationRequired

export default TicketsPage
