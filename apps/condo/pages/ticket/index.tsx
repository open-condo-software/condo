// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { PlusOutlined } from '@ant-design/icons'
import { useIntl } from '@core/next/intl'
import Head from 'next/head'
import Link from 'next/link'
import React, { useCallback, useEffect, useMemo } from 'react'
import { Button, Table, Typography, Space } from 'antd'
import get from 'lodash/get'
import qs from 'qs'

import { PageContent, PageHeader, PageWrapper } from '../../containers/BaseLayout'
import { OrganizationRequired } from '../../containers/OrganizationRequired'

import { Ticket } from '../../utils/clientSchema/Ticket'
import { useRouter } from 'next/router'
import { format } from 'date-fns'

// TODO:(Dimitreee) move to packages
import RU from 'date-fns/locale/ru'
import EN from 'date-fns/locale/en-US'

const PAGINATION_PAGE_SIZE = 10

const setOrder = (sortedInfo, key) => {
    return sortedInfo && sortedInfo.columnKey === key && sortedInfo.order
}

const getTableColumns = (sortedInfo, intl) => {
    const locales = {
        ru: RU,
        en: EN,
    }

    return [
        {
            title: intl.formatMessage({ id: 'ticketsTable.NumberAndDate' }),
            dataIndex: 'number',
            key: 'number',
            sorter: true,
            sortOrder: setOrder(sortedInfo, 'number'),
            render: (number, ticket) => {
                const formattedDate = format(
                    new Date(ticket.createdAt),
                    'dd MMMM (HH:mm)',
                    { locale: locales[intl.locale] }
                )

                return (
                    <Space direction={'vertical'} size={'small'}>
                        <Typography.Text>№ {number}</Typography.Text>
                        <Typography.Text type={'secondary'}>{formattedDate}</Typography.Text>
                    </Space>
                )
            },
            width: '20%',
        },
        {
            title: intl.formatMessage({ id: 'Status' }),
            dataIndex: 'status',
            key: 'status',
            sorter: true,
            sortOrder: setOrder(sortedInfo, 'status'),
            render: (status) => {
                return (<Typography.Text strong>{status.name}</Typography.Text>)
            },
        },
        {
            title: intl.formatMessage({ id: 'pages.condo.ticket.id.PageTitle' }),
            dataIndex: 'details',
            key: 'details',
        },
        {
            title: intl.formatMessage({ id: 'field.Address' }),
            dataIndex: 'property',
            key: 'property',
            sorter: true,
            sortOrder: setOrder(sortedInfo, 'property'),
            render: (property) => {
                const fullAddress = `${get(property, 'address')} ${get(property, 'name')}`

                return (<Typography.Text ellipsis>{fullAddress}</Typography.Text>)
            },
        },
        {
            title: intl.formatMessage({ id: 'ticketsTable.ResidentName' }),
            dataIndex: 'clientName',
            key: 'clientName',
            sorter: true,
            sortOrder: setOrder(sortedInfo, 'clientName'),
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
    }

    const sorter = queryToSorter(router.query.sort)

    return {
        pagination,
        sorter,
    }
}

const TicketsPage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'pages.condo.ticket.index.PageTitle' })

    const router = useRouter()

    const { objs: tickets, fetchMore, refetch, loading, count } = Ticket.useObjects({
        sortBy: router.query.sort,
        offset: Number(router.query.offset),
        limit: PAGINATION_PAGE_SIZE,
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
    }, [])

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
                <PageHeader title={PageTitleMsg}/>
                <PageContent>
                    <OrganizationRequired>
                        <Table
                            loading={loading}
                            dataSource={tickets}
                            columns={tableColumns}
                            onRow={handleRowAction}
                            onChange={handleTableChange}
                            rowKey={record => record.id}
                            pagination={{ ...pagination, total: count }}
                        />
                    </OrganizationRequired>
                </PageContent>
            </PageWrapper>
        </>
    )
}

export default TicketsPage
