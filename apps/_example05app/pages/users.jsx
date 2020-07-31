import Head from 'next/head'
import { Button, Form, Input } from 'antd'
import gql from 'graphql-tag'
import React, { useContext, useEffect, useState } from 'react'
import { QuestionCircleOutlined, SaveOutlined } from '@ant-design/icons'
import { useOrganization } from '@core/next/organization'
import { useMutation, useQuery } from '@core/next/apollo'
import { useAuth } from '@core/next/auth'
import { useIntl } from '@core/next/intl'

import { PageContent, PageHeader, PageWrapper } from '../containers/BaseLayout'
import { OrganizationRequired } from '../containers/OrganizationRequired'
import FormTable from '../containers/FormTable'
import { CreateFormListItemButton, ExtraDropdownActionsMenu } from '../containers/FormList'
import { runMutation } from '../utils/mutations.utils'

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
    query getAll${MODELs}WithMeta($where: ${MODEL}WhereInput, $first: Int, $skip: Int) {
    meta: _all${MODELs}Meta(where: $where, first: $first, skip: $skip) { count }
    objs: all${MODELs}(where: $where, first: $first, skip: $skip) ${MODEL_FIELDS}
    }
`

const UPDATE_ORGANIZATION_LINK_BY_ID_MUTATION = gql`
    mutation update${MODEL}ById($id:ID!, $data: ${MODEL}UpdateInput!) {
    obj: update${MODEL}(id: $id, data: $data) ${MODEL_FIELDS}
    }
`

function createNewGQLItem () {
    return {
        id: Math.random(),
        isNotSaved: true,
    }
}

function ResidentsBlock () {
    const { organization } = useOrganization()
    const { user } = useAuth()

    const intl = useIntl()
    const AreYouSureMsg = intl.formatMessage({ id: 'AreYouSure' })
    const DeleteMsg = intl.formatMessage({ id: 'Delete' })
    const EditMsg = intl.formatMessage({ id: 'Edit' })
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
    const UserIsAlreadyInListMsg = intl.formatMessage({ id: 'pages.users.UserIsAlreadyInList' })
    const InviteNewUserButtonLabelMsg = intl.formatMessage({ id: 'pages.users.InviteNewUserButtonLabel' })
    const ErrorToFormFieldMsgMapping = {
        '[error.already.exists]': {
            name: 'email',
            errors: [UserIsAlreadyInListMsg],
        },
    }

    const [pagination, setPagination] = useState({ current: 1, pageSize: 2 })
    const [newData, setNewData] = useState([])
    const [create] = useMutation(INVITE_NEW_USER_TO_ORGANIZATION_MUTATION)
    const [update] = useMutation(UPDATE_ORGANIZATION_LINK_BY_ID_MUTATION)
    const [del] = useMutation(DELETE_ORGANIZATION_LINK_BY_ID_MUTATION)
    const { loading, data, refetch, error } = useQuery(GET_ALL_ORGANIZATION_LINKS_WITH_COUNT_QUERY, {
        variables: {
            first: pagination.pageSize,
            skip: (pagination.current - 1) * pagination.pageSize,
            where: { organization: { id: organization.id } },
        },
    })

    const columns = [
        {
            title: NameMsg,
            dataIndex: 'name',
            editable: true,
            create: true,
        },
        {
            title: EmailMsg,
            dataIndex: 'email',
            editable: true,
            create: true,
            rules: [
                { type: 'email', message: EmailIsNotValidMsg },
                { required: true, message: FieldIsRequiredMsg },
            ],
        },
        {
            title: PhoneMsg,
            dataIndex: 'phone',
            editable: true,
            create: true,
            rules: [
                { pattern: /^[+]?[0-9-. ()]{7,}[0-9]$/gi, message: PhoneIsNotValidMsg },
                { required: true, message: FieldIsRequiredMsg },
            ],
        },
        {
            title: StatusMsg,
            dataIndex: 'status',
            create: false,
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
            render: (_, item) => {
                const { isNotSaved } = item
                const form = useContext(FormTable.RowFormContext)
                const { editing, setRowContext, ...props } = useContext(FormTable.RowContext)

                function handleSave () {
                    form.validateFields()
                        .then((values) => handleCreateOrUpdate(values, item))
                        .then(() => setRowContext({ ...props, editing: false }))
                }

                return <>
                    {(isNotSaved || editing) ?
                        <Button size="small" type={'primary'} onClick={handleSave}>
                            <SaveOutlined/>
                        </Button>
                        : null}
                    {(isNotSaved) ?
                        null :
                        <ExtraDropdownActionsMenu actions={[
                            (item.user && item.user.id === user.id) ? null : {
                                confirm: {
                                    title: AreYouSureMsg,
                                    icon: <QuestionCircleOutlined style={{ color: 'red' }}/>,
                                },
                                label: DeleteMsg,
                                action: () => handleDelete(item),
                            },
                            {
                                label: EditMsg,
                                action: () => {
                                    setRowContext({ ...props, editing: true })
                                },
                            },
                        ]}/>
                    }
                </>
            },
        },
    ]

    function handleCreateOrUpdate (values, item) {
        if (values.email) values.email = values.email.toLowerCase()
        const mutation = (item && item.isNotSaved) ? create : update
        const variables = (item && item.isNotSaved) ?
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
                    const exitingData = newData.findIndex((x) => x.id === item.id)
                    if (exitingData !== -1) {
                        newData.splice(exitingData, 1)
                        setNewData([...newData])
                    }
                    if (refetch) refetch({})
                },
                intl,
                ErrorToFormFieldMsgMapping,
            },
        )
    }

    function handleDelete (values) {
        return runMutation(
            {
                mutation: del,
                variables: {
                    id: values.id,
                },
                onFinally: () => {
                    if (refetch) refetch({})
                },
                intl,
            },
        )
    }

    function handleAdd () {
        console.log('handleAdd')
        setNewData([...newData, createNewGQLItem()])
    }

    function handleTableChange (pagination, filters, sorter) {
        setPagination(pagination)
        console.log({
            sortField: sorter.field,
            sortOrder: sorter.order,
            pagination,
            ...filters,
        })
    }

    function renderItem (item) {
        return { ...item }
    }

    function renderCellFormWrapper ({ column, record, form, children }) {
        const { editable, dataIndex, rules, normalize } = column
        const { editing, setRowContext, ...props } = useContext(FormTable.RowContext)

        function handleSave () {
            form.validateFields()
                .then((values) => handleCreateOrUpdate(values, record))
                .then(() => setRowContext({ ...props, editing: false }))
        }

        useEffect(() => {
            form.setFieldsValue({
                // GET
                [dataIndex]: record[dataIndex],
            })
        }, [])

        if (!editable) return children
        if (!editing) return children

        return <Form.Item
            style={{ margin: 0 }}
            name={dataIndex}
            normalize={normalize}
            rules={rules || [
                {
                    required: true,
                    message: FieldIsRequiredMsg,
                },
            ]}
        >
            <Input onPressEnter={handleSave}/>
        </Form.Item>
    }

    return <>
        <CreateFormListItemButton
            onClick={handleAdd} label={InviteNewUserButtonLabelMsg}
            style={{ marginBottom: '16px', width: '100%' }}/>
        {(newData.length) ?
            <FormTable
                style={{ marginBottom: '16px' }}
                pagination={false}
                dataSource={newData}
                columns={columns.filter((x => x.create))}
                renderItem={renderItem}
                renderCellWrapper={renderCellFormWrapper}
                rowContextInitialState={{ editing: true }}
                tableLayout={'fixed'}
            />
            : null}
        <FormTable
            dataSource={data && data.objs}
            columns={columns}
            renderItem={renderItem}
            renderCellWrapper={renderCellFormWrapper}
            rowContextInitialState={{ editing: false }}
            tableLayout={'fixed'}
            onChange={handleTableChange}
            pagination={{
                total: (data && data.meta) ? data.meta.count : undefined,
                ...pagination,
            }}
        />
    </>
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
                    <ResidentsBlock/>
                </OrganizationRequired>
            </PageContent>
        </PageWrapper>
    </>
}

export default ResidentsPage
