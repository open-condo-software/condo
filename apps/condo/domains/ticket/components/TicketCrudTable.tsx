// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { useIntl } from '@core/next/intl'
import Link from 'next/link'
import { GraphQlSearchInput } from '@condo/domains/common/components/GraphQlSearchInput'
import { searchProperty, searchTicketClassifier, searchTicketSources } from '../../../utils/clientSchema/Ticket/search'
import { Input, Space } from 'antd'
import { RenderActionsColumn, toGQLSortBy, useTable, ViewOrEditTableBlock } from '../../../containers/FormTableBlocks'
import { useOrganization } from '@core/next/organization'
import { Ticket } from '@condo/domains/ticket/utils/clientSchema'
import React, { useEffect, useMemo } from 'react'
import { runMutation } from '../../../utils/mutations.utils'
const OPEN_STATUS = '6ef3abc4-022f-481b-90fb-8430345ebfc2'

function normalizeRelation (value) {
    return (value && typeof value === 'object') ? value.id : value
}

function useTicketColumns () {
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
            editableInput: () => <GraphQlSearchInput search={searchTicketSources}/>,
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
            editableInput: () => <GraphQlSearchInput search={searchProperty}/>,
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
            editableInput: () => <GraphQlSearchInput search={searchTicketClassifier}/>,
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

    const { loading, objs, count, refetch } = Ticket.useObjects({
        sortBy: toGQLSortBy(table.state.sorter) || 'createdAt_DESC',
    })
    const create = Ticket.useCreate({ organization: organization.id, status: OPEN_STATUS }, () => refetch())
    const update = Ticket.useUpdate({}, () => refetch())

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
    }, [loading])

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