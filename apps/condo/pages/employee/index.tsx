// @ts-nocheck
import Head from 'next/head'
import { Space } from 'antd'
import React, { useEffect, useMemo } from 'react'
import { useOrganization } from '@core/next/organization'
import { useIntl } from '@core/next/intl'

import { PageContent, PageHeader, PageWrapper } from '../../containers/BaseLayout'
import { OrganizationRequired } from '../../containers/OrganizationRequired'
import { runMutation } from '../../utils/mutations.utils'
import { emailValidator, nameValidator, phoneValidator } from '../../utils/excel.utils'
import { OrganizationEmployee, useInviteNewOrganizationEmployee } from '../../utils/clientSchema/Organization'

import {
    NewOrExportTableBlock,
    RenderActionsColumn,
    toGQLSortBy,
    toGQLWhere,
    useTable,
    ViewOrEditTableBlock,
} from '../../containers/FormTableBlocks'


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
            create: true,  // include in create form (table-row form / modal form)
            editable: true,  // include in edit form (table-row form / modal form)
            rules: [  // edit form validation rules
                { required: true, message: FieldIsRequiredMsg },
            ],
            importFromFile: true,  // include in import form (table-row import form)
            importValidator: nameValidator,  // import form validation rules

            sorter: true,  // sort by this field!
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
            ],  // filter by this field! Filter menu config | object[]
            filterMultiple: true,  // Whether multiple filters can be selected | boolean
        },
        {
            title: EmailMsg,
            dataIndex: 'email',
            create: true,
            editable: true,
            rules: [
                { type: 'email', message: EmailIsNotValidMsg },
                { required: true, message: FieldIsRequiredMsg },
            ],
            importFromFile: true,
            importValidator: emailValidator,

            sorter: true,
            filters: null,
            filterMultiple: null,
        },
        {
            title: PhoneMsg,
            dataIndex: 'phone',
            create: true,
            editable: true,
            rules: [
                { pattern: /^[+]?[0-9-. ()]{7,}[0-9]$/gi, message: PhoneIsNotValidMsg },
                { required: true, message: FieldIsRequiredMsg },
            ],
            importFromFile: true,
            importValidator: phoneValidator,

            sorter: true,
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
            filterMultiple: false,
        },
        {
            title: StatusMsg,
            dataIndex: 'status',
            create: false,
            editable: false,
            rules: null,
            importFromFile: false,
            importValidator: null,

            sorter: false,
            filters: null,
            filterMultiple: null,
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

function EmployeeCRUDTableBlock () {
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

    // TODO(pahaz): add loading state
    const { loading, refetch, objs, count, error } = OrganizationEmployee.useObjects({
        first: table.state.pagination.pageSize,
        skip: (table.state.pagination.current - 1) * table.state.pagination.pageSize,
        sortBy: toGQLSortBy(table.state.sorter),
        where: { ...toGQLWhere(table.state.filters), organization: { id: organization.id } },
    })
    const invite = useInviteNewOrganizationEmployee({ organization: { id: organization.id } }, refetch)
    const update = OrganizationEmployee.useUpdate({}, refetch)
    const del = OrganizationEmployee.useDelete({}, refetch)

    function handleCreateOrUpdate ({ values, item, form }) {
        // console.log('handleCreateOrUpdate', values, item, form)
        if (values.email) values.email = values.email.toLowerCase()
        const action = (item && item.isUnsavedNew) ? invite : update
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
                ErrorToFormFieldMsgMapping,
            },
        )
    }

    function handleDelete ({ values, item, form }) {
        // console.log('handleDelete', values, item, form)
        return runMutation(
            {
                action: () => del(item),
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

    useEffect(() => {
        if (objs) {
            table.setData(objs)
            table.updateFilterPaginationSort({
                total: (count) ? count : undefined,
            })
            const actions = {
                CreateOrUpdate: handleCreateOrUpdate,
                Delete: handleDelete,
                // SaveAll: handleSaveAll,
            }
            newDataTable.updateActions(actions)
            table.updateActions(actions)
        }
    }, [loading])

    const createColumns = useMemo(() => {return columns}, [])
    const editColumns = useMemo(() => {return columns}, [])

    if (error) {
        return <Space direction="vertical">
            {String(error)}
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
                    <EmployeeCRUDTableBlock/>
                </OrganizationRequired>
            </PageContent>
        </PageWrapper>
    </>
}

export default ResidentsPage
