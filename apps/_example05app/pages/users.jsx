import Head from 'next/head'
import { Space } from 'antd'
import gql from 'graphql-tag'
import React, { useEffect, useMemo } from 'react'
import { useOrganization } from '@core/next/organization'
import { useMutation, useQuery } from '@core/next/apollo'
import { useIntl } from '@core/next/intl'

import { PageContent, PageHeader, PageWrapper } from '../containers/BaseLayout'
import { OrganizationRequired } from '../containers/OrganizationRequired'
import { runMutation } from '../utils/mutations.utils'
import { emailValidator, nameValidator, phoneValidator } from '../utils/excel.utils'
import {
    NewOrExportTableBlock,
    RenderActionsColumn,
    toGQLSortBy,
    toGQLWhere, useTable,
    ViewOrEditTableBlock,
} from '../containers/FormTableBlocks'

const MODEL = 'OrganizationToUserLink'
const MODELs = 'OrganizationToUserLinks'
const MODEL_FIELDS = '{ id organization { id name description avatar { publicUrl } } user { id name } name email phone role isRejected isAccepted }'

const DELETE_ORGANIZATION_LINK_BY_ID_MUTATION = gql`
    mutation delete${MODEL}ById($id:ID!) {
    obj: delete${MODEL}(id: $id) ${MODEL_FIELDS}
    }
`

const INVITE_NEW_USER_TO_ORGANIZATION_MUTATION = gql`
    mutation inviteNewUserToOrganization($data: InviteNewUserToOrganizationInput!) {
        obj: inviteNewUserToOrganization(data: $data) ${MODEL_FIELDS}
    }
`

const GET_ALL_ORGANIZATION_LINKS_WITH_COUNT_QUERY = gql`
    query getAll${MODELs}WithMeta($where: ${MODEL}WhereInput, $first: Int, $skip: Int, $sortBy: [Sort${MODELs}By!]) {
    meta: _all${MODELs}Meta(where: $where, sortBy: id_DESC) { count }
    objs: all${MODELs}(where: $where, first: $first, skip: $skip, sortBy: $sortBy) ${MODEL_FIELDS}
    }
`

const UPDATE_ORGANIZATION_LINK_BY_ID_MUTATION = gql`
    mutation update${MODEL}ById($id:ID!, $data: ${MODEL}UpdateInput!) {
    obj: update${MODEL}(id: $id, data: $data) ${MODEL_FIELDS}
    }
`

function _useUserColumns () {
    const intl = useIntl()
    const NameMsg = intl.formatMessage({ id: 'Name' })
    const EmailMsg = intl.formatMessage({ id: 'Email' })
    const StatusMsg = intl.formatMessage({ id: 'Status' })
    const PhoneMsg = intl.formatMessage({ id: 'Phone' })
    const FieldIsRequiredMsg = intl.formatMessage({ id: 'FieldIsRequired' })
    const EmailIsNotValidMsg = intl.formatMessage({ id: 'pages.auth.EmailIsNotValid' })
    const PhoneIsNotValidMsg = intl.formatMessage({ id: 'pages.auth.PhoneIsNotValid' })
    const StatusAcceptedMsg = intl.formatMessage({ id: 'pages.users.status.Accepted' })
    const StatusRejectedMsg = intl.formatMessage({ id: 'pages.users.status.Rejected' })
    const StatusWaitAcceptOrRejectMsg = intl.formatMessage({ id: 'pages.users.status.WaitAcceptOrReject' })
    const StatusNotActiveMsg = intl.formatMessage({ id: 'pages.users.status.NotActive' })

    return [
        {
            title: NameMsg,
            dataIndex: 'name',
            editable: true,
            create: true,
            importFromFile: true,
            importValidator: nameValidator,
            filters: [
                {
                    text: 'Joe',
                    value: '{ "name_contains": "Joe" }',
                },
                {
                    text: 'Bad',
                    value: '{ "name_contains": "Bad" }',
                },
                {
                    text: 'Submenu',
                    value: 'Submenu',
                    children: [
                        {
                            text: 'Pahaz',
                            value: '{ "name_contains": "Pahaz" }',
                        },
                        {
                            text: 'Black',
                            value: '{ "name_contains": "Black" }',
                        },
                    ],
                },
            ],
        },
        {
            title: EmailMsg,
            dataIndex: 'email',
            editable: true,
            create: true,
            importFromFile: true,
            importValidator: emailValidator,
            rules: [
                { type: 'email', message: EmailIsNotValidMsg },
                { required: true, message: FieldIsRequiredMsg },
            ],
            sorter: true,
        },
        {
            title: PhoneMsg,
            dataIndex: 'phone',
            editable: true,
            create: true,
            importFromFile: true,
            importValidator: phoneValidator,
            rules: [
                { pattern: /^[+]?[0-9-. ()]{7,}[0-9]$/gi, message: PhoneIsNotValidMsg },
                { required: true, message: FieldIsRequiredMsg },
            ],
            filterMultiple: false,
            filters: [
                {
                    text: '7 xxx',
                    value: '{ "phone_starts_with": "7" }',
                },
                {
                    text: '8 xxx',
                    value: '{ "phone_starts_with": "8" }',
                },
            ],
        },
        {
            title: StatusMsg,
            dataIndex: 'status',
            create: false,
            sorter: true,
            render: (_, item) => {
                const { isRejected, isAccepted } = item
                if (item.user) {
                    if (isRejected) return StatusRejectedMsg
                    if (isAccepted) return StatusAcceptedMsg
                    return StatusWaitAcceptOrRejectMsg
                }
                return StatusNotActiveMsg
            },
        },
        {
            title: '',
            dataIndex: 'actions',
            create: true,
            render: RenderActionsColumn,
        },
    ]
}

function UserBlock () {
    const { organization } = useOrganization()

    const newDataTable = useTable()
    const table = useTable()
    const columns = _useUserColumns()

    const intl = useIntl()
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })
    const UserIsAlreadyInListMsg = intl.formatMessage({ id: 'pages.users.UserIsAlreadyInList' })
    const ErrorToFormFieldMsgMapping = {
        '[error.already.exists]': {
            name: 'email',
            errors: [UserIsAlreadyInListMsg],
        },
    }

    const [create] = useMutation(INVITE_NEW_USER_TO_ORGANIZATION_MUTATION)
    const [update] = useMutation(UPDATE_ORGANIZATION_LINK_BY_ID_MUTATION)
    const [del] = useMutation(DELETE_ORGANIZATION_LINK_BY_ID_MUTATION)
    const { data, refetch, error } = useQuery(GET_ALL_ORGANIZATION_LINKS_WITH_COUNT_QUERY, {
        variables: {
            first: table.state.pagination.pageSize,
            skip: (table.state.pagination.current - 1) * table.state.pagination.pageSize,
            sortBy: toGQLSortBy(table.state.sorter),
            where: { ...toGQLWhere(table.state.filters), organization: { id: organization.id } },
        },
    })

    function handleCreateOrUpdate ({ values, item, form }) {
        if (values.email) values.email = values.email.toLowerCase()
        const mutation = (item && item.isUnsavedNew) ? create : update
        const variables = (item && item.isUnsavedNew) ?
            {
                data: {
                    ...values,
                    organization: { id: organization.id },
                },
            } :
            {
                id: item.id,
                data: {
                    ...values,
                },
            }
        return runMutation(
            {
                mutation,
                variables,
                onCompleted: () => {
                    if (refetch) refetch()
                },
                onError: (e) => {
                    console.log(e.friendlyDescription, form)
                    const msg = e.friendlyDescription || ServerErrorMsg
                    if (msg) {
                        form.setFields([{ name: 'email', errors: [msg] }])
                    }
                    throw e
                },
                intl,
                ErrorToFormFieldMsgMapping,
            },
        )
    }

    function handleDelete ({ values, item, form }) {
        return runMutation(
            {
                mutation: del,
                variables: {
                    id: values.id,
                },
                onFinally: () => {
                    if (refetch) refetch()
                },
                intl,
            },
        )
    }

    // function fakeJob () {
    //     return new Promise(res => {
    //         setTimeout(() => res(1), 1200)
    //     })
    // }
    //
    // async function handleSaveAll ({ values }) {
    //     await fakeJob()
    //     values.forEach((item) => {
    //
    //     })
    //     // for (let index in values) {
    //     //     const ref = saveButtonRefs[index]
    //     //     console.log(ref)
    //     //     if (ref && ref.current) {
    //     //         ref.current.focus()
    //     //         ref.current.click()
    //     //     }
    //     //     await fakeJob()
    //     // }
    // }

    useEffect(() => {
        if (data) {
            table.setData(data.objs)
            table.updateFilterPaginationSort({
                total: (data && data.meta) ? data.meta.count : undefined,
            })
            const actions = {
                CreateOrUpdate: handleCreateOrUpdate,
                Delete: handleDelete,
                // SaveAll: handleSaveAll,
            }
            newDataTable.updateActions(actions)
            table.updateActions(actions)
        }
    }, [data])

    const createColumns = useMemo(() => {return columns}, [])
    const editColumns = useMemo(() => {return columns}, [])

    if (error) {
        return <Space direction="vertical">
            {error}
        </Space>
    }

    return <Space direction="vertical">
        <NewOrExportTableBlock columns={createColumns} table={newDataTable}/>
        <ViewOrEditTableBlock columns={editColumns} table={table}/>
    </Space>
}

const ResidentsPage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'pages.users.PageTitle' })

    return <>
        <Head>
            <title>{PageTitleMsg}</title>
        </Head>
        <PageWrapper>
            <PageHeader title={PageTitleMsg}/>
            <PageContent>
                <OrganizationRequired>
                    <UserBlock/>
                </OrganizationRequired>
            </PageContent>
        </PageWrapper>
    </>
}

export default ResidentsPage
