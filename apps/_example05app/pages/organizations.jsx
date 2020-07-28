import { Avatar, Button, Form, Input, Menu, Modal, notification, Typography, Popconfirm, Radio, Tag } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'
import gql from 'graphql-tag'
import { useState } from 'react'
import Head from 'next/head'
import Router from 'next/router'
import { useAuth } from '@core/next/auth'
import { useIntl } from '@core/next/intl'
import { useMutation, useQuery } from '@core/next/apollo'
import { useOrganization } from '@core/next/organization'

import { getQueryParams } from '../utils/url.utils'
import { AuthRequired } from '../containers/AuthRequired'
import FormList, {
    CreateFormListItemButton,
    ExpandableDescription,
    ExtraDropdownActionsMenu,
} from '../containers/FormList'
import { runMutation } from '../utils/mutations.utils'
import { PageContent, PageHeader, PageWrapper } from '../containers/BaseLayout'

const DEFAULT_ORGANIZATION_AVATAR_URL = 'https://www.pngitem.com/pimgs/m/226-2261747_company-name-icon-png-transparent-png.png'

const ORGANIZATION_FIELDS = '{ id name description avatar { publicUrl } }'
const REGISTER_NEW_ORGANIZATION_MUTATION = gql`
    mutation registerNewOrganization($data: RegisterNewOrganizationInput!) {
        obj: registerNewOrganization(data: $data) ${ORGANIZATION_FIELDS}
    }
`
const ORGANIZATION_TO_USER_LINK_FIELDS = `{ id organization ${ORGANIZATION_FIELDS} user { id name } name email phone role isRejected isAccepted }`
const GET_ALL_ORGANIZATION_TO_USER_LINKS_WITH_META_QUERY = gql`
    query getAllOrganizationToUserLinksWithMeta($where: OrganizationToUserLinkWhereInput) {
        meta: _allOrganizationToUserLinksMeta { count }
        objs: allOrganizationToUserLinks (where: $where) ${ORGANIZATION_TO_USER_LINK_FIELDS}
    }
`
const ACCEPT_OR_REJECT_ORGANIZATION_INVITE_BY_ID_MUTATION = gql`
    mutation acceptOrRejectOrganizationToUserLink($id: ID!, $data: AcceptOrRejectOrganizationInviteInput!){
        obj: acceptOrRejectOrganizationInviteById(id: $id, data: $data) {
            id
        }
    }
`

// TODO(pahaz): refactor to use CreateModalForm
const CreateOrganizationForm = ({ onFinish }) => {
    const [isVisible, setIsVisible] = useState(false)
    const [form] = Form.useForm()
    const [isLoading, setIsLoading] = useState(false)
    const [create] = useMutation(REGISTER_NEW_ORGANIZATION_MUTATION)

    const intl = useIntl()
    const CancelMsg = intl.formatMessage({ id: 'Cancel' })
    const SaveMsg = intl.formatMessage({ id: 'Save' })
    const NameMsg = intl.formatMessage({ id: 'Name' })
    const DescriptionMsg = intl.formatMessage({ id: 'Description' })
    const FieldIsRequiredMsg = intl.formatMessage({ id: 'FieldIsRequired' })
    const CreateOrganizationButtonLabelMsg = intl.formatMessage({ id: 'pages.organizations.CreateOrganizationButtonLabel' })
    const CreateOrganizationPopupLabelMsg = intl.formatMessage({ id: 'pages.organizations.CreateOrganizationPopupLabel' })
    const ErrorToFormFieldMsgMapping = {}

    function handleCancel () {
        setIsVisible(false)
    }

    function handleOpen () {
        setIsVisible(!isVisible)
    }

    function handleFinish (values) {
        setIsLoading(true)
        return runMutation({
            mutation: create,
            variables: { data: values },
            onCompleted: () => onFinish(),
            onFinally: () => {
                setIsLoading(false)
                handleCancel()
            },
            intl,
            form,
            ErrorToFormFieldMsgMapping,
        })
    }

    function handleSave () {
        form.submit()
    }

    return (<>
        <CreateFormListItemButton onClick={handleOpen} label={CreateOrganizationButtonLabelMsg}/>
        <Modal title={CreateOrganizationPopupLabelMsg} visible={isVisible} onCancel={handleCancel} footer={[
            <Button key="back" onClick={handleCancel}>{CancelMsg}</Button>,
            <Button key="submit" type="primary" onClick={handleSave} loading={isLoading}>{SaveMsg}</Button>,
        ]}
        >
            <Form form={form} layout="vertical" name="create-organization-form" onFinish={handleFinish}>
                <Form.Item
                    name="name"
                    label={NameMsg}
                    rules={[{ required: true, message: FieldIsRequiredMsg }]}
                >
                    <Input/>
                </Form.Item>
                <Form.Item
                    name="description"
                    label={DescriptionMsg}
                    rules={[{ required: true, message: FieldIsRequiredMsg }]}
                >
                    <Input.TextArea/>
                </Form.Item>
            </Form>
        </Modal>
    </>)
}

const OrganizationListForm = () => {
    const { user } = useAuth()
    const { selectLink } = useOrganization()
    const { loading, data, refetch } = useQuery(GET_ALL_ORGANIZATION_TO_USER_LINKS_WITH_META_QUERY, {
        variables: { where: user ? { user: { id: user.id } } : {} },
    })
    const [acceptOrReject] = useMutation(ACCEPT_OR_REJECT_ORGANIZATION_INVITE_BY_ID_MUTATION)

    const intl = useIntl()
    const DoneMsg = intl.formatMessage({ id: 'Done' })
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })
    const AcceptMsg = intl.formatMessage({ id: 'Accept' })
    const RejectMsg = intl.formatMessage({ id: 'Reject' })
    const LeaveMsg = intl.formatMessage({ id: 'Leave' })
    const SelectMsg = intl.formatMessage({ id: 'Select' })
    const OwnerMsg = intl.formatMessage({ id: 'Owner' })
    const AreYouSureMsg = intl.formatMessage({ id: 'AreYouSure' })

    function handleAcceptOrReject (item, action) {
        console.log(item, action)
        let data = {}
        if (action === 'accept') {
            data = { isAccepted: true, isRejected: false }
        } else if (action === 'reject') {
            data = { isAccepted: false, isRejected: true }
        } else if (action === 'leave') {
            data = { isRejected: true }
        }
        acceptOrReject({ variables: { id: item.id, data } })
            .then(
                () => {
                    notification.success({ message: DoneMsg })
                },
                (e) => {
                    console.error(e)
                    notification.error({
                        message: ServerErrorMsg,
                        description: e.message,
                    })
                })
            .finally(() => refetch())
    }

    function handleSelect (item) {
        selectLink(item).then(() => {
            const query = getQueryParams()
            if (query.next) Router.push(query.next)
            else Router.push('/')
        })
    }

    function renderItem (item) {
        let { organization = {}, role, avatar, isRejected, isAccepted } = item
        return {
            itemMeta: { style: (isRejected) ? { display: 'none' } : undefined },
            avatar: <Avatar src={avatar && avatar.publicUrl || DEFAULT_ORGANIZATION_AVATAR_URL}/>,
            title: <>
                {organization.name}
                {'  '}
                {role === 'owner' ? <Tag color="error">{OwnerMsg}</Tag> : null}
            </>,
            description: <ExpandableDescription>{organization.description}</ExpandableDescription>,
            actions: [
                (!isAccepted && !isRejected) ?
                    [<Radio.Group size="small" onChange={(e) => handleAcceptOrReject(item, e.target.value)}>
                        <Radio.Button value="accept">{AcceptMsg}</Radio.Button>
                        <Radio.Button value="reject">{RejectMsg}</Radio.Button>
                    </Radio.Group>]
                    : null,
                (isAccepted) ?
                    [<Button size="small" type={'primary'}
                             onClick={() => handleSelect(item)}>{SelectMsg}</Button>]
                    : null,
                (isAccepted) ?
                    [<ExtraDropdownActionsMenu actions={[
                        {
                            confirm: {
                                title: AreYouSureMsg,
                                icon: <QuestionCircleOutlined style={{ color: 'red' }}/>,
                            },
                            label: LeaveMsg,
                            action: () => handleAcceptOrReject(item, 'leave'),
                        },
                    ]}/>]
                    : null,
            ],
        }
    }

    return (<>
        <CreateOrganizationForm onFinish={refetch}/>
        <FormList
            loading={loading}
            // loadMore={loadMore}
            // TODO(pahaz): add this feature ^^
            dataSource={data && data.objs || []}
            renderItem={renderItem}
        />
    </>)
}

const OrganizationsPage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'pages.organizations.PageTitle' })

    return <>
        <Head>
            <title>{PageTitleMsg}</title>
        </Head>
        <PageWrapper>
            <PageHeader title={PageTitleMsg}/>
            <AuthRequired>
                <PageContent>
                    <OrganizationListForm/>
                </PageContent>
            </AuthRequired>
        </PageWrapper>
    </>
}

export default OrganizationsPage
