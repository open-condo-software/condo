// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { useIntl } from '@core/next/intl'
import Head from 'next/head'
import React, { useCallback, useEffect, useMemo } from 'react'
import { Table, Typography, Space, Empty, Tag } from 'antd'
import get from 'lodash/get'
import qs from 'qs'
import { useRouter } from 'next/router'
import { format } from 'date-fns'
import styled from '@emotion/styled'
import { STATUS_SELECT_COLORS } from '../../constants/style'
import { Button } from '../../components/Button'
import { EmptyIcon } from '../../components/EmptyIcon'

import { PageContent, PageHeader, PageWrapper } from '../../containers/BaseLayout'
import { OrganizationRequired } from '../../containers/OrganizationRequired'

import { Ticket } from '@condo/domains/ticket/utils/clientSchema'

// TODO:(Dimitreee) move to packages
import RU from 'date-fns/locale/ru'
import EN from 'date-fns/locale/en-US'

const PAGINATION_PAGE_SIZE = 10

const setOrder = (sortedInfo, key) => {
    return sortedInfo && sortedInfo.columnKey === key && sortedInfo.order
}

const getTableColumns = (sortedInfo, intl) => {
    const LOCALES = {
        ru: RU,
        en: EN,
    }

    return [
        {
            title: intl.formatMessage({ id: 'ticketsTable.Number' }),
            sortOrder: setOrder(sortedInfo, 'number'),
            dataIndex: 'number',
            key: 'number',
            sorter: true,
            width: '10%',
        },
        {
            title: intl.formatMessage({ id: 'CreatedDate' }),
            sortOrder: setOrder(sortedInfo, 'createdAt'),
            render: (createdAt) => (
                format(
                    new Date(createdAt),
                    'dd MMM',
                    { locale: LOCALES[intl.locale] }
                )
            ),
            dataIndex: 'createdAt',
            key: 'createdAt',
            sorter: true,
            width: '10%',
        },
        {
            title: intl.formatMessage({ id: 'Status' }),
            sortOrder: setOrder(sortedInfo, 'status'),
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
            sorter: true,
            width: '10%',
        },
        {
            title: intl.formatMessage({ id: 'pages.condo.ticket.id.PageTitle' }),
            ellipsis: true,
            dataIndex: 'details',
            key: 'details',
            width: '22%',
        },
        {
            title: intl.formatMessage({ id: 'field.Address' }),
            sortOrder: setOrder(sortedInfo, 'property'),
            render: (property) => (`${get(property, 'address')} ${get(property, 'name')}`),
            ellipsis: true,
            dataIndex: 'property',
            key: 'property',
            sorter: true,
            width: '12%',
        },
        {
            title: intl.formatMessage({ id: 'ticketsTable.ResidentName' }),
            sortOrder: setOrder(sortedInfo, 'clientName'),
            ellipsis: true,
            dataIndex: 'clientName',
            key: 'clientName',
            sorter: true,
            width: '12%',
        },
        {
            title: intl.formatMessage({ id: 'field.Executor' }),
            sortOrder: setOrder(sortedInfo, 'executor'),
            render: (executor) => (get(executor, ['name'])),
            ellipsis: true,
            dataIndex: 'executor',
            key: 'executor',
            sorter: true,
            width: '12%',
        },
        {
            title: intl.formatMessage({ id: 'field.Responsible' }),
            sortOrder: setOrder(sortedInfo, 'assignee'),
            render: (assignee) => (get(assignee, ['name'])),
            ellipsis: true,
            dataIndex: 'assignee',
            key: 'assignee',
            sorter: true,
            width: '12%',
        },
    ]
}

const sorterToQuery = (sorter) => {
    const { columnKey, order } = sorter

    const sortKeys = {
        'ascend': 'ASC',
        'descend': 'DESC',
    }

    const sortKey = sortKeys[order]

    if (!sortKey) {
        return
    }

    return `${columnKey}_${sortKeys[order]}`
}

const queryToSorter = (query) => {
    if (!query) {
        return
    }

    const sortKeys = {
        'ASC': 'ascend',
        'DESC': 'descend',
    }

    const columns = [
        'number',
        'status',
        'details',
        'property',
        'assignee',
        'executor',
        'createdAt',
        'clientName',
    ]

    const [columnKey, key] = query.split('_')

    const order = sortKeys[key]

    if (!order || !columns.includes(columnKey)) {
        return
    }

    return { columnKey,  order: sortKeys[key] }
}

const tableStateFromQuery = (router) => {
    const pagination = {
        current: ((router.query.offset / PAGINATION_PAGE_SIZE) || 0) + 1,
        pageSize: PAGINATION_PAGE_SIZE,
        position: ['bottom', 'left'],
    }

    const sorter = queryToSorter(router.query.sort)

    return {
        pagination,
        sorter,
    }
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

    const { objs: tickets, fetchMore, refetch, loading, count } = Ticket.useObjects({
        sortBy: router.query.sort,
        offset: Number(router.query.offset),
        limit: PAGINATION_PAGE_SIZE,
    }, { 
        fetchPolicy: 'network-only',
    })

    const { pagination, sorter } = tableStateFromQuery(router)

    const handleRowAction = useCallback((record) => {
        return {
            onClick: () => {
                router.push(`/ticket/${record.id}/`)
            },
        }
    }, [])

    const handleTableChange = useCallback((...tableChangeArguments) => {
        const [nextPagination,, nextSorter] = tableChangeArguments

        const sort = sorterToQuery(nextSorter)
        const { current, pageSize } = nextPagination
        const offset = current * pageSize - pageSize
        const variables = {
            sortBy: sort,
            offset,
            first: PAGINATION_PAGE_SIZE,
            limit: PAGINATION_PAGE_SIZE,
        }

        if (!loading) {
            fetchMore({ variables }).then(() => {
                router.push(router.route + '?' + qs.stringify({ ...router.query, sort, offset }))
            })
        }
    }, [loading])

    const tableColumns = useMemo(() => getTableColumns(sorter, intl), [sorter])

    // TODO(Dimitreee): fix ticket list refetch problems during page's navigation
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
                                    pagination={{ ...pagination, total: count }}
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
