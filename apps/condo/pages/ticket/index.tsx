import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/common/components/containers/OrganizationRequired'
import { Ticket } from '@condo/domains/ticket/utils/clientSchema'
import { DatabaseFilled } from '@ant-design/icons'
import {
    filtersToQuery, getFiltersFromQuery,
    getPaginationFromQuery,
    getSortStringFromQuery,
    PAGINATION_PAGE_SIZE,
    sorterToQuery,
} from '@condo/domains/ticket/utils/helpers'
import { useIntl } from '@core/next/intl'

import { Col, Input, Row, Space, Table, Tooltip, Typography } from 'antd'
import Head from 'next/head'
import { useRouter } from 'next/router'
import qs from 'qs'
import pickBy from 'lodash/pickBy'
import debounce from 'lodash/debounce'
import React, { useCallback, useEffect } from 'react'
import { EmptyListView } from '@condo/domains/common/components/EmptyListView'
import { useTableColumns } from '@condo/domains/ticket/hooks/useTableColumns'
import { Button } from '@condo/domains/common/components/Button'
import XLSX from 'xlsx'

const TicketsPage = () => {
    const intl = useIntl()
    const PageTitleMessage = intl.formatMessage({ id: 'pages.condo.ticket.index.PageTitle' })
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const NotImplementedYedMessage = intl.formatMessage({ id: 'NotImplementedYed' })
    const ExportAsExcel = intl.formatMessage({ id: 'ExportAsExcel' })

    const router = useRouter()
    const sortFromQuery = getSortStringFromQuery(router.query)
    const paginationFromQuery = getPaginationFromQuery(router.query)
    const filtersFromQuery = getFiltersFromQuery(router.query)

    const {
        fetchMore,
        refetch,
        loading,
        count: total,
        objs: tickets,
    } = Ticket.useObjects({
        // @ts-ignore
        sortBy: sortFromQuery,
        where: filtersToQuery(filtersFromQuery),
        offset: paginationFromQuery,
        limit: PAGINATION_PAGE_SIZE,
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
                offset,
                first: PAGINATION_PAGE_SIZE,
                limit: PAGINATION_PAGE_SIZE,
            }).then(() => {
                const query = qs.stringify(
                    { ...router.query, sort, offset, filters: JSON.stringify(pickBy(nextFilters)) },
                    { arrayFormat: 'comma', skipNulls: true, addQueryPrefix: true },
                )

                router.push(router.route + query)
            })
        }
    }, 400), [loading])

    useEffect(() => {
        refetch()
    }, [])

    const generateExcelData = useCallback(() => {
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
                    tickets.map((ticket) => Ticket.extractAttributes(ticket, cols)), { header: cols }
                )

                XLSX.utils.book_append_sheet(wb, ws, 'table')
                XLSX.writeFile(wb, 'export.xlsx')
            } catch (e) {
                reject(e)
            } finally {
                resolve()
            }
        })
    }, [])

    return (
        <>
            <Head>
                <title>{PageTitleMessage}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={<Typography.Title style={{ margin: 0 }}>{PageTitleMessage}</Typography.Title>}/>
                <PageContent>
                    <OrganizationRequired>
                        {
                            !tickets.length && !filtersFromQuery
                                ? <EmptyListView/>
                                : <Row gutter={[0, 40]} align={'middle'}>
                                    <Col span={6}>
                                        <Button type={'inlineLink'} icon={<DatabaseFilled />} onClick={generateExcelData}>{ExportAsExcel}</Button>
                                    </Col>
                                    <Col span={6} push={12}>
                                        <Tooltip title={NotImplementedYedMessage}>
                                            <div>
                                                <Input placeholder={SearchPlaceholder} disabled/>
                                            </div>
                                        </Tooltip>
                                    </Col>
                                    <Col span={24}>
                                        <Table
                                            bordered
                                            tableLayout={'fixed'}
                                            loading={loading}
                                            dataSource={tickets}
                                            columns={tableColumns}
                                            onRow={handleRowAction}
                                            onChange={handleTableChange}
                                            rowKey={record => record.id}
                                            pagination={{
                                                total,
                                                current: paginationFromQuery,
                                                pageSize: PAGINATION_PAGE_SIZE,
                                                position: ['bottomLeft'],
                                            }}
                                        />
                                    </Col>
                                </Row>
                        }
                    </OrganizationRequired>
                </PageContent>
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
