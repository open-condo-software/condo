import { useIntl } from '@core/next/intl'
import styled from '@emotion/styled'
import { Empty, Space, Table, Tag, Typography } from 'antd'
import { TablePaginationConfig } from 'antd/es/table'
import { format } from 'date-fns'
import EN from 'date-fns/locale/en-US'

// TODO:(Dimitreee) move to packages
import RU from 'date-fns/locale/ru'
import get from 'lodash/get'
import Head from 'next/head'
import { useRouter } from 'next/router'
import qs from 'qs'
import React, { useCallback, useEffect } from 'react'
import { Button } from '../../components/Button'
import { EmptyIcon } from '../../components/EmptyIcon'
import { STATUS_SELECT_COLORS } from '../../constants/style'

import { PageContent, PageHeader, PageWrapper } from '../../containers/BaseLayout'
import { OrganizationRequired } from '../../containers/OrganizationRequired'

import { Ticket } from '@condo/domains/ticket/utils/clientSchema'

// TODO:(Dimitreee) move to packages
import RU from 'date-fns/locale/ru'
import EN from 'date-fns/locale/en-US'

const LOCALES = {
    ru: RU,
    en: EN,
}

const useTableColumns = (sort) => {
    const sorter = createSorterMap(sort)
    const intl = useIntl()

    return [
        {
            title: intl.formatMessage({ id: 'ticketsTable.Number' }),
            sortOrder: get(sorter, 'number'),
            dataIndex: 'number',
            key: 'number',
            sorter: {
                multiple: 1,
            },
            width: '10%',
        },
        {
            title: intl.formatMessage({ id: 'Date' }),
            sortOrder: get(sorter, 'createdAt'),
            render: (createdAt) => (
                format(
                    new Date(createdAt),
                    'dd MMM',
                    { locale: LOCALES[intl.locale] }
                )
            ),
            dataIndex: 'createdAt',
            key: 'createdAt',
            sorter: {
                multiple: 1,
            },
            width: '10%',
        },
        {
            title: intl.formatMessage({ id: 'Status' }),
            sortOrder: get(sorter, 'status'),
            render: (status) => {
                const { color, backgroundColor } = STATUS_SELECT_COLORS[status.type]

                return (
                    <Tag color={backgroundColor} style={{ color }}>
                        <Typography.Text strong>{status.name}</Typography.Text>
                    </Tag>
                )
            },
            dataIndex: 'status',
            key: 'status',
            sorter: {
                multiple: 1,
            },
            width: '10%',
        },
        {
            title: intl.formatMessage({ id: 'Description' }),
            ellipsis: true,
            dataIndex: 'details',
            key: 'details',
            width: '22%',
        },
        {
            title: intl.formatMessage({ id: 'field.Address' }),
            sortOrder: get(sorter, 'property'),
            render: (property) => (`${get(property, 'address')} ${get(property, 'name')}`),
            ellipsis: true,
            dataIndex: 'property',
            key: 'property',
            sorter: {
                multiple: 1,
            },
            width: '12%',
        },
        {
            title: intl.formatMessage({ id: 'Client' }),
            sortOrder: get(sorter, 'clientName'),
            ellipsis: true,
            dataIndex: 'clientName',
            key: 'clientName',
            sorter: {
                multiple: 1,
            },
            width: '12%',
        },
        {
            title: intl.formatMessage({ id: 'field.Executor' }),
            sortOrder: get(sorter, 'executor'),
            render: (executor) => (get(executor, ['name'])),
            ellipsis: true,
            dataIndex: 'executor',
            key: 'executor',
            sorter: {
                multiple: 1,
            },
            width: '12%',
        },
        {
            title: intl.formatMessage({ id: 'field.Responsible' }),
            sortOrder: get(sorter, 'assignee'),
            render: (assignee) => (get(assignee, ['name'])),
            ellipsis: true,
            dataIndex: 'assignee',
            key: 'assignee',
            sorter: {
                multiple: 1,
            },
            width: '12%',
        },
    ]
}

const EmptyListViewContainer = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
`

const EmptyListView = () => {
    const intl = useIntl()
    const router = useRouter()

    return (
        <EmptyListViewContainer>
            <Empty
                image={<EmptyIcon/>}
                imageStyle={{ height: '120px' }}
                description={
                    <Space direction={'vertical'} size={0}>
                        <Typography.Title level={3}>
                            {intl.formatMessage({ id: 'ticket.EmptyList.header' })}
                        </Typography.Title>
                        <Typography.Text style={{ fontSize: '16px' }}>
                            {intl.formatMessage({ id: 'ticket.EmptyList.title' })}
                        </Typography.Text>
                        <Button
                            type='sberPrimary'
                            style={{ marginTop: '16px' }}
                            onClick={() => router.push('/ticket/create')}
                        >
                            {intl.formatMessage({ id: 'CreateTicket' })}
                        </Button>
                    </Space>
                }
            />
        </EmptyListViewContainer>
    )
}

const TicketsPage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'pages.condo.ticket.index.PageTitle' })

    const router = useRouter()
    const sortFromQuery = getSortStringFromQuery(router.query)
    const paginationFromQuery = getPaginationFromQuery(router.query)

    const {
        fetchMore,
        refetch,
        loading,
        count: total,
        objs: tickets,
    } = Ticket.useObjects({
        sortBy: sortFromQuery,
        offset: paginationFromQuery,
        limit: PAGINATION_PAGE_SIZE,
    }, { 
        fetchPolicy: 'network-only',
    })

    const pagination: TablePaginationConfig = {
        total,
        current: paginationFromQuery,
        pageSize: PAGINATION_PAGE_SIZE,
        position: ['bottomLeft'],
    }
    const tableColumns = useTableColumns(sortFromQuery)
    const handleRowAction = useCallback((record) => {
        return {
            onClick: () => {
                router.push(`/ticket/${record.id}/`)
            },
        }
    }, [])

    const handleTableChange = useCallback((...tableChangeArguments) => {
        const [nextPagination,, nextSorter] = tableChangeArguments

        const { current, pageSize } = nextPagination
        const offset = current * pageSize - pageSize
        const sort = sorterToQuery(nextSorter)

        if (!loading) {
            const query = qs.stringify(
                { ...router.query, sort, offset },
                { arrayFormat: 'comma', skipNulls: true },
            )

            fetchMore({
                sortBy: sort,
                offset,
                first: PAGINATION_PAGE_SIZE,
                limit: PAGINATION_PAGE_SIZE,
            }).then(() => {
                router.push(router.route + '?' + query)
            })
        }
    }, [loading])


    useEffect(() => {
        refetch()
    }, [])

    return (
        <>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <PageHeader
                    title={
                        <Typography.Title style={{ margin: 0 }}>
                            {PageTitleMsg}
                        </Typography.Title>
                    }
                />
                <PageContent>
                    <OrganizationRequired>
                        {
                            tickets.length
                                ? <Table
                                    bordered
                                    tableLayout={'fixed'}
                                    loading={loading}
                                    dataSource={tickets}
                                    columns={tableColumns}
                                    onRow={handleRowAction}
                                    onChange={handleTableChange}
                                    rowKey={record => record.id}
                                    pagination={pagination}
                                />
                                : <EmptyListView/>
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
