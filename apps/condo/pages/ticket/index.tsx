/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { Ticket } from '@condo/domains/ticket/utils/clientSchema'
import { GET_ALL_TICKET_FOR_XLS_EXPORT } from '@condo/domains/ticket/gql'
import { DatabaseFilled } from '@ant-design/icons'
import { format } from 'date-fns'
import {
    filtersToQuery,
    getPageIndexFromQuery,
    getSortStringFromQuery,
    sorterToQuery, queryToSorter, getPageSizeFromQuery,
} from '@condo/domains/ticket/utils/helpers'
import { getFiltersFromQuery } from '@condo/domains/common/utils/helpers'
import { IFilters } from '@condo/domains/ticket/utils/helpers'
import { useIntl } from '@core/next/intl'
import { useLazyQuery } from '@core/next/apollo'
import { Col, Input, Row, Space, Table, Typography, Checkbox } from 'antd'
import Head from 'next/head'
import { useRouter } from 'next/router'
import qs from 'qs'
import { pickBy, get, debounce } from 'lodash'
import React, { useCallback } from 'react'
import { EmptyListView } from '@condo/domains/common/components/EmptyListView'
import { useTableColumns } from '@condo/domains/ticket/hooks/useTableColumns'
import { useEmergencySearch } from '@condo/domains/ticket/hooks/useEmergencySearch'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { Button } from '@condo/domains/common/components/Button'
import XLSX from 'xlsx'
import { useOrganization } from '@core/next/organization'
import { SortTicketsBy } from '../../schema'

interface IPageWithHeaderAction extends React.FC {
    headerAction?: JSX.Element
}

const verticalAlign = css`
    & tbody.ant-table-tbody {
        vertical-align: baseline;
    }
`

const TicketsPage: IPageWithHeaderAction = () => {
    const intl = useIntl()
    const PageTitleMessage = intl.formatMessage({ id: 'pages.condo.ticket.index.PageTitle' })
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const ExportAsExcel = intl.formatMessage({ id: 'ExportAsExcel' })
    const EmptyListLabel = intl.formatMessage({ id: 'ticket.EmptyList.header' })
    const EmptyListMessage = intl.formatMessage({ id: 'ticket.EmptyList.title' })
    const CreateTicket = intl.formatMessage({ id: 'CreateTicket' })
    const EmergencyLabel = intl.formatMessage({ id: 'Emergency' })

    const router = useRouter()
    const sortFromQuery = sorterToQuery(queryToSorter(getSortStringFromQuery(router.query)))
    const offsetFromQuery = getPageIndexFromQuery(router.query)
    const filtersFromQuery = getFiltersFromQuery<IFilters>(router.query)
    const pagesizeFromQuey: number = getPageSizeFromQuery(router.query)

    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])

    const sortBy = sortFromQuery.length > 0  ? sortFromQuery : 'createdAt_DESC' //TODO(Dimitreee):Find cleanest solution
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

    const [
        loadXlsTickets,
        { loading: isXlsLoading },
    ] = useLazyQuery(
        GET_ALL_TICKET_FOR_XLS_EXPORT,
        {
            onError: error => {
                throw new Error(error)
            },
            onCompleted: data => {
                return new Promise<void>((resolve, reject) => {
                    try {
                        const cols = [
                            'number',
                            'status',
                            'details',
                            'property',
                            'assignee',
                            'executor',
                            'createdAt',
                            'clientName',
                        ]
                        const wb = XLSX.utils.book_new()
                        const ws = XLSX.utils.json_to_sheet(
                            data.tickets.map((ticket) => Ticket.extractAttributes(ticket, cols)), { header: cols }
                        )
                        XLSX.utils.book_append_sheet(wb, ws, 'table')
                        XLSX.writeFile(wb, `export_${format(new Date(), 'dd.mm.yyyy') }.xlsx`)
                    } catch (e) {
                        console.error('Error while fetching tickets for Xls ', e)
                        reject(e)
                    } finally {
                        resolve()
                    }
                })
            },
        },
    )

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

    const [search, handleSearchChange] = useSearch<IFilters>(loading)
    const [emergency, handleEmergencyChange] = useEmergencySearch<IFilters>(loading)

    return (
        <>
            <Head>
                <title>{PageTitleMessage}</title>
            </Head>
            <PageWrapper>
                <OrganizationRequired>
                    <PageHeader title={<Typography.Title style={{ margin: 0 }}>{PageTitleMessage}</Typography.Title>}/>
                    <PageContent>
                        {
                            !tickets.length && !filtersFromQuery
                                ? <EmptyListView
                                    label={EmptyListLabel}
                                    message={EmptyListMessage}
                                    createRoute='/ticket/create'
                                    createLabel={CreateTicket} />
                                : <Row gutter={[0, 40]} align={'middle'}>
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
                                            style={{ paddingLeft: '0px', fontSize: '16px' }}
                                        >{EmergencyLabel}</Checkbox>
                                    </Col>
                                    <Col span={6} push={1}>
                                        <Button
                                            type={'inlineLink'}
                                            icon={<DatabaseFilled />}
                                            loading={isXlsLoading}
                                            onClick={
                                                () => loadXlsTickets({ variables: { sortBy: sortBy, where: where } })
                                            }
                                        >{ExportAsExcel}</Button>
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
                                            rowKey={record => record.id}
                                            pagination={{
                                                showSizeChanger: false,
                                                total,
                                                current: offsetFromQuery,
                                                pageSize: pagesizeFromQuey,
                                                position: ['bottomLeft'],
                                            }}
                                        />
                                    </Col>
                                </Row>
                        }
                    </PageContent>
                </OrganizationRequired>
            </PageWrapper>
        </>
    )
}

const HeaderAction = () => {
    const intl = useIntl()

    return (
        <Space>
            <Typography.Text style={{ fontSize: '12px' }}>
                {intl.formatMessage({ id: 'menu.ControlRoom' })}
            </Typography.Text>
        </Space>
    )
}

TicketsPage.headerAction = <HeaderAction/>

export default TicketsPage
