// @ts-nocheck
import { Avatar, Button, Form, Input, notification, Radio, Tag } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'
import Head from 'next/head'
import Router from 'next/router'
import { useAuth } from '@core/next/auth'
import { useIntl } from '@core/next/intl'
import { useMutation, useQuery } from '@core/next/apollo'
import { useOrganization } from '@core/next/organization'

import { getQueryParams } from '../utils/url.utils'
import { AuthRequired } from '../containers/AuthRequired'
import FormList, {
    BaseModalForm,
    CreateFormListItemButton,
    ExpandableDescription,
    ExtraDropdownActionsMenu,
    useCreateAndEditModalForm,
} from '../containers/FormList'
import { PageContent, PageHeader, PageWrapper } from '../containers/BaseLayout'
import {
    ACCEPT_OR_REJECT_ORGANIZATION_INVITE_BY_ID_MUTATION,
    GET_ALL_EMPLOYEE_ORGANIZATIONS_QUERY,
    REGISTER_NEW_ORGANIZATION_MUTATION,
    UPDATE_ORGANIZATION_BY_ID_MUTATION,
} from '../schema/Organization.gql'
import { convertGQLItemToUIState, convertUIStateToGQLItem } from '../utils/clientSchema/Organization'

const DEFAULT_ORGANIZATION_AVATAR_URL = 'https://www.pngitem.com/pimgs/m/226-2261747_company-name-icon-png-transparent-png.png'

function CreateAndEditOrganizationModalForm ({ visible, editableItem, cancelModal, onFinish }) {
    const intl = useIntl()
    const ValueIsTooShortMsg = intl.formatMessage({ id: 'ValueIsTooShort' })
    const CreateOrganizationModalTitleMsg = intl.formatMessage({ id: 'pages.organizations.CreateOrganizationModalTitle' })
    const EditOrganizationModalTitleMsg = intl.formatMessage({ id: 'pages.organizations.EditOrganizationModalTitle' })
    const FieldIsRequiredMsg = intl.formatMessage({ id: 'FieldIsRequired' })
    const NameMsg = intl.formatMessage({ id: 'Name' })
    const DescriptionMsg = intl.formatMessage({ id: 'Description' })

    const formInitialValues = { ...(editableItem) ? convertGQLItemToUIState(editableItem) : {} }
    const mutationExtraData = {
        country: 'ru',
        meta: { v: 1, inn: 'fake!' },
    }
    const ErrorToFormFieldMsgMapping = {
        '[name.is.too.short]': {
            name: 'name',
            errors: [ValueIsTooShortMsg],
        },
    }

    return <BaseModalForm
        /* NOTE: we need to recreate form if editableItem changed because the form initialValues are cached */
        key={editableItem}
        mutation={(editableItem) ? UPDATE_ORGANIZATION_BY_ID_MUTATION : REGISTER_NEW_ORGANIZATION_MUTATION}
        mutationExtraVariables={(editableItem) ? { id: editableItem.id } : {}}
        mutationExtraData={mutationExtraData}
        formValuesToMutationDataPreprocessor={convertUIStateToGQLItem}
        formValuesToMutationDataPreprocessorContext={editableItem}
        formInitialValues={formInitialValues}
        visible={visible}
        cancelModal={cancelModal}
        onMutationCompleted={onFinish}
        ModalTitleMsg={(editableItem) ? EditOrganizationModalTitleMsg : CreateOrganizationModalTitleMsg}
        ErrorToFormFieldMsgMapping={ErrorToFormFieldMsgMapping}
    >
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
    </BaseModalForm>
}

function OrganizationCRUDListBlock () {
    const { user } = useAuth()
    const { selectLink } = useOrganization()

    const { loading, data, refetch } = useQuery(GET_ALL_EMPLOYEE_ORGANIZATIONS_QUERY, {
        variables: { where: user ? { user: { id: user.id } } : {} },
    })
    const [acceptOrReject] = useMutation(ACCEPT_OR_REJECT_ORGANIZATION_INVITE_BY_ID_MUTATION)

    const intl = useIntl()
    const DoneMsg = intl.formatMessage({ id: 'Done' })
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })
    const AcceptMsg = intl.formatMessage({ id: 'Accept' })
    const RejectMsg = intl.formatMessage({ id: 'Reject' })
    const EditMsg = intl.formatMessage({ id: 'Edit' })
    const LeaveMsg = intl.formatMessage({ id: 'Leave' })
    const SelectMsg = intl.formatMessage({ id: 'Select' })
    const OwnerMsg = intl.formatMessage({ id: 'Owner' })
    const AreYouSureMsg = intl.formatMessage({ id: 'AreYouSure' })
    const CreateOrganizationButtonLabelMsg = intl.formatMessage({ id: 'pages.organizations.CreateOrganizationButtonLabel' })

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

    const { visible, editableItem, cancelModal, openCreateModal, openEditModal } = useCreateAndEditModalForm()

    return (<>
        <CreateFormListItemButton onClick={openCreateModal} label={CreateOrganizationButtonLabelMsg}/>
        <CreateAndEditOrganizationModalForm
            visible={visible}
            editableItem={editableItem}
            cancelModal={cancelModal}
            onFinish={refetch}
        />
        <FormList
            loading={loading}
            // loadMore={loadMore}
            // TODO(pahaz): add this feature ^^
            dataSource={data && data.objs || []}
            renderItem={(item) => {
                const { organization = {}, role, avatar, isRejected, isAccepted } = item
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
                                (role === 'owner') ?
                                    {
                                        label: EditMsg,
                                        action: () => openEditModal(item.organization),
                                    } :
                                    null,
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
            }}
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
            <PageContent>
                <AuthRequired>
                    <OrganizationCRUDListBlock/>
                </AuthRequired>
            </PageContent>
        </PageWrapper>
    </>
}

export default OrganizationsPage
