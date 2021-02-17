// @ts-nocheck
import gql from 'graphql-tag'
import { useIntl } from '@core/next/intl'
import Head from 'next/head'
import Link from 'next/link'
import React, { useEffect, useMemo } from 'react'
import { Form, Input, Space } from 'antd'

import { useOrganization } from '@core/next/organization'

import { PageContent, PageHeader, PageWrapper } from '../../containers/BaseLayout'
import { OrganizationRequired } from '../../containers/OrganizationRequired'
import {
    RenderActionsColumn,
    toGQLSortBy,
    useTable,
    ViewOrEditTableBlock,
} from '../../containers/FormTableBlocks'
import {
    BaseModalForm,
    CreateFormListItemButton,
    useCreateAndEditModalForm,
} from '../../containers/FormList'
import { SearchInput } from '../../containers/FormBlocks'
import { runMutation } from '../../utils/mutations.utils'

import { useCreate, useObjects, useUpdate } from '../../schema/Application.uistate'

const OPEN_STATUS = '6ef3abc4-022f-481b-90fb-8430345ebfc2'

// TODO(pahaz): add organization filter
const GET_ALL_SOURCES_QUERY = gql`
    query selectSource ($value: String) {
        objs: allApplicationSources(where: {name_contains: $value, organization_is_null: true}) {
            id
            name
        }
    }
`

// TODO(pahaz): add organization filter
const GET_ALL_CLASSIFIERS_QUERY = gql`
    query selectSource ($value: String) {
        objs: allApplicationClassifiers(where: {name_contains: $value, organization_is_null: true, parent_is_null: true}) {
            id
            name
        }
    }
`

// TODO(pahaz): add organization filter
const GET_ALL_PROPERTIES_QUERY = gql`
    query selectProperty ($value: String) {
        objs: allProperties(where: {name_contains: $value}) {
            id
            name
        }
    }
`

async function _search (client, query, variables) {
    return await client.query({
        query: query,
        variables: variables,
    })
}

function normalizeRelation (value) {
    return (value && typeof value === 'object') ? value.id : value
}

async function searchProperty (client, value) {
    const { data, error } = await _search(client, GET_ALL_PROPERTIES_QUERY, { value })
    if (error) console.warn(error)
    if (data) return data.objs.map(x => ({ text: x.name, value: x.id }))
    return []
}

async function searchApplicationSources (client, value) {
    const { data, error } = await _search(client, GET_ALL_SOURCES_QUERY, { value })
    if (error) console.warn(error)
    if (data) return data.objs.map(x => ({ text: x.name, value: x.id }))
    return []
}

async function searchApplicationClassifier (client, value) {
    const { data, error } = await _search(client, GET_ALL_CLASSIFIERS_QUERY, { value })
    if (error) console.warn(error)
    if (data) return data.objs.map(x => ({ text: x.name, value: x.id }))
    return []
}

function _useApplicationColumns () {
    const intl = useIntl()
    const NumberMsg = intl.formatMessage({ id: 'pages.condo.application.field.Number' })
    const SourceMsg = intl.formatMessage({ id: 'pages.condo.application.field.Source' })
    const PropertyMsg = intl.formatMessage({ id: 'pages.condo.application.field.Property' })
    const ClassifierMsg = intl.formatMessage({ id: 'pages.condo.application.field.Classifier' })
    const DetailsMsg = intl.formatMessage({ id: 'pages.condo.application.field.Details' })
    const StatusMsg = intl.formatMessage({ id: 'pages.condo.application.field.Status' })
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
                return <Link href={`/application/${item.id}`}><a>{text}</a></Link>
            },
        },
        {
            title: SourceMsg,
            dataIndex: 'source',
            modal: true,
            create: true,
            editable: true,
            editableInput: () => <SearchInput search={searchApplicationSources}/>,
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
            title: ClassifierMsg,
            dataIndex: 'classifier',
            modal: true,
            create: true,
            editable: true,
            editableInput: () => <SearchInput search={searchApplicationClassifier}/>,
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

function CreateAndEditApplicationModalForm ({ columns, action, visible, editableItem, cancelModal }) {
    const intl = useIntl()
    const CreateApplicationModalTitleMsg = intl.formatMessage({ id: 'pages.condo.application.index.CreateApplicationModalTitle' })
    const EditApplicationModalTitleMsg = intl.formatMessage({ id: 'pages.condo.application.index.EditApplicationModalTitle' })
    const ValueIsTooShortMsg = intl.formatMessage({ id: 'ValueIsTooShort' })
    const ErrorToFormFieldMsgMapping = {
        '[name.is.too.short]': {
            name: 'name',
            errors: [ValueIsTooShortMsg],
        },
    }

    return <BaseModalForm
        /* NOTE: we need to recreate form if editableItem changed because the form initialValues are cached */
        key={editableItem}
        action={action}
        visible={visible}
        cancelModal={cancelModal}
        ModalTitleMsg={(editableItem) ? EditApplicationModalTitleMsg : CreateApplicationModalTitleMsg}
        ErrorToFormFieldMsgMapping={ErrorToFormFieldMsgMapping}
    >
        {columns.filter(x => x.modal).filter(x => (editableItem) ? x.editable : x.create).map(x => {
            return <Form.Item key={x.dataIndex} name={x.dataIndex} label={x.title} rules={x.rules}
                normalize={x.normalize}>
                {(x.editableInput) ? x.editableInput() : <Input/>}
            </Form.Item>
        })}
    </BaseModalForm>
}

function CreateApplicationModalBlock ({ columns, modal, create }) {
    const { visible, editableItem, cancelModal, openCreateModal } = modal

    const intl = useIntl()
    const CreateEVotingButtonLabelMsg = intl.formatMessage({ id: 'pages.condo.application.index.CreateApplicationButtonLabel' })

    return <>
        <CreateFormListItemButton onClick={openCreateModal} label={CreateEVotingButtonLabelMsg}/>
        <CreateAndEditApplicationModalForm
            columns={columns}
            action={create}
            visible={visible}
            editableItem={editableItem}
            cancelModal={cancelModal}
        />
    </>
}

function ApplicationCRUDTableBlock () {
    const { organization } = useOrganization()
    const modal = useCreateAndEditModalForm()
    const table = useTable()
    const columns = _useApplicationColumns()

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
            <CreateApplicationModalBlock columns={editColumns} modal={modal} create={create}/>
            <ViewOrEditTableBlock columns={editColumns} table={table}/>
        </Space>
    )
}

export default () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'pages.condo.application.index.PageTitle' })

    return <>
        <Head>
            <title>{PageTitleMsg}</title>
        </Head>
        <PageWrapper>
            <PageHeader title={PageTitleMsg}/>
            <PageContent>
                <OrganizationRequired>
                    <ApplicationCRUDTableBlock/>
                </OrganizationRequired>
            </PageContent>
        </PageWrapper>
    </>
}