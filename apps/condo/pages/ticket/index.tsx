// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { PlusOutlined } from '@ant-design/icons'
import { useIntl } from '@core/next/intl'
import Head from 'next/head'
import Link from 'next/link'
import React, { useEffect, useMemo } from 'react'
import { Button, Input, Space, Table } from 'antd'

import { useOrganization } from '@core/next/organization'
import { CREATE_TICKET } from '../../constants/routes'

import { PageContent, PageHeader, PageWrapper } from '../../containers/BaseLayout'
import { OrganizationRequired } from '../../containers/OrganizationRequired'
import { RenderActionsColumn, toGQLSortBy, useTable, ViewOrEditTableBlock, } from '../../containers/FormTableBlocks'
import { SearchInput } from '../../components/SearchInput'
import { runMutation } from '../../utils/mutations.utils'

import { useCreate, useObjects, useUpdate } from '../../utils/clientSchema/Ticket'
import { searchProperty, searchTicketClassifier, searchTicketSources } from '../../utils/clientSchema/search'

const OPEN_STATUS = '6ef3abc4-022f-481b-90fb-8430345ebfc2'

function normalizeRelation (value) {
    return (value && typeof value === 'object') ? value.id : value
}

export function useTicketColumns () {
    const intl = useIntl()
    const NumberMsg = intl.formatMessage({ id: 'pages.condo.ticket.field.Number' })
    const SourceMsg = intl.formatMessage({ id: 'pages.condo.ticket.field.Source' })
    const PropertyMsg = intl.formatMessage({ id: 'pages.condo.ticket.field.Property' })
    const TypeMsg = intl.formatMessage({ id: 'pages.condo.ticket.field.Type' })
    const DetailsMsg = intl.formatMessage({ id: 'pages.condo.ticket.field.Details' })
    const StatusMsg = intl.formatMessage({ id: 'pages.condo.ticket.field.Status' })
    const FieldIsRequiredMsg = intl.formatMessage({ id: 'FieldIsRequired' })

    return [
        {
            title: NumberMsg,
            dataIndex: 'number',
            modal: false,
            create: false,
            editable: false,
            importFromFile: true,
            render: (text, item, index) => {
                return <Link href={`/ticket/${item.id}`}><a>{text}</a></Link>
            },
        },
        {
            title: SourceMsg,
            dataIndex: 'source',
            modal: true,
            create: true,
            editable: true,
            editableInput: () => <SearchInput search={searchTicketSources}/>,
            rules: [{ required: true, message: FieldIsRequiredMsg }],
            normalize: normalizeRelation,
            importFromFile: true,
            render: (text, item, index) => {
                return item.source && item.source.name
            },
        },
        {
            title: PropertyMsg,
            dataIndex: 'property',
            modal: true,
            create: true,
            editable: true,
            editableInput: () => <SearchInput search={searchProperty}/>,
            rules: [{ required: true, message: FieldIsRequiredMsg }],
            normalize: normalizeRelation,
            importFromFile: true,
            render: (text, item, index) => {
                return item.property && item.property.name
            },
        },
        {
            title: TypeMsg,
            dataIndex: 'classifier',
            modal: true,
            create: true,
            editable: true,
            editableInput: () => <SearchInput search={searchTicketClassifier}/>,
            rules: [{ required: true, message: FieldIsRequiredMsg }],
            normalize: normalizeRelation,
            importFromFile: true,
            render: (text, item, index) => {
                return item.classifier && item.classifier.name
            },
        },
        {
            title: StatusMsg,
            dataIndex: 'status',
            modal: false,
            create: false,
            editable: false,
            normalize: normalizeRelation,
            importFromFile: true,
            sorter: true,
            render: (text, item, index) => {
                return item.status && item.status.name
            },
        },
        {
            title: DetailsMsg,
            dataIndex: 'details',
            modal: true,
            create: true,
            editable: true,
            editableInput: () => <Input.TextArea/>,
            rules: [{ required: true, message: FieldIsRequiredMsg }],
            importFromFile: true,
        },
        {
            title: '',
            dataIndex: 'actions',
            create: true,
            render: RenderActionsColumn,
        },
    ]
}

/* eslint-disable-next-line no-unused-vars */
function TicketCRUDTableBlock () {
    const { organization } = useOrganization()
    const table = useTable()
    const columns = useTicketColumns()

    const intl = useIntl()
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })
    const ErrorToFormFieldMsgMapping = {}

    const { objs, count, refetch } = useObjects({
        sortBy: toGQLSortBy(table.state.sorter) || 'createdAt_DESC',
    })
    const create = useCreate({ organization: organization.id, status: OPEN_STATUS }, () => refetch())
    const update = useUpdate({}, () => refetch())

    useEffect(() => {
        if (objs) {
            table.setData(objs)
            table.updateFilterPaginationSort({ total: count })
            const actions = {
                CreateOrUpdate: handleCreateOrUpdate,
                Delete: handleDelete,
            }
            table.updateActions(actions)
        }
    }, [objs])

    function handleCreateOrUpdate ({ values, item, form }) {
        if (values.email) values.email = values.email.toLowerCase()
        const action = (item && item.isUnsavedNew) ? create : update
        return runMutation(
            {
                action: () => action(values, (item.isUnsavedNew) ? null : item),
                onError: (e) => {
                    console.log(e.friendlyDescription, form)
                    const msg = e.friendlyDescription || ServerErrorMsg
                    if (msg) {
                        form.setFields([{ name: 'email', errors: [msg] }])
                    }
                    throw e
                },
                intl,
                form,
                ErrorToFormFieldMsgMapping,
            },
        )
    }

    function handleDelete ({ item, form }) {
        const deletedAt = (new Date(Date.now())).toISOString()
        return handleCreateOrUpdate({ values: { deletedAt }, item, form })
    }

    const editColumns = useMemo(() => columns, [])

    return (
        <Space direction="vertical">
            <ViewOrEditTableBlock columns={editColumns} table={table}/>
        </Space>
    )
}

const CreateTicketButton = ({ message }) => {
    return (
        <Link href={CREATE_TICKET}>
            <Button type='primary'>
                <PlusOutlined/>{message}
            </Button>
        </Link>
    )
}

const TABLE_COLUMNS = [
    {
        title: 'Имя',
        dataIndex: 'clientName',
        key: 'clientName',
    },
    {
        title: 'Детали',
        dataIndex: 'details',
        key: 'details',
    },
    {
        title: '',
        dataIndex: 'id',
        key: 'watch',
        render: id => (
            <>
                <div>
                    <Link href={`/ticket/${id}`}>Посмотреть</Link>
                </div>
                <div>
                    <Link href={`/ticket/${id}/update`}>Редактировать</Link>
                </div>
            </>
        ),
    },
]

export default () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'pages.condo.ticket.index.PageTitle' })
    const CreateTicketButtonLabel = intl.formatMessage({ id: 'pages.condo.ticket.index.CreateTicketButtonLabel' })

    // Rewrite later
    const { objs, refetch } = useObjects({
        sortBy: 'createdAt_DESC',
    })

    useEffect(() => {
        refetch()
    }, [])

    return (
        <>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={PageTitleMsg} extra={<CreateTicketButton message={CreateTicketButtonLabel}/>}>
                </PageHeader>
                <PageContent>
                    <OrganizationRequired>
                        <Table dataSource={objs} columns={TABLE_COLUMNS}/>
                    </OrganizationRequired>
                </PageContent>
            </PageWrapper>
        </>
    )
}