import { Avatar, Button, Form, Input, notification, Radio, Tag } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'
import gql from 'graphql-tag'
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
    ValidationError,
} from '../containers/FormList'
import { PageContent, PageHeader, PageWrapper } from '../containers/BaseLayout'

const DEFAULT_ORGANIZATION_AVATAR_URL = 'https://www.pngitem.com/pimgs/m/226-2261747_company-name-icon-png-transparent-png.png'

const ORGANIZATION_FIELDS = '{ id name description avatar { publicUrl } }'
const REGISTER_NEW_ORGANIZATION_MUTATION = gql`
    mutation registerNewOrganization($data: RegisterNewOrganizationInput!) {
        obj: registerNewOrganization(data: $data) ${ORGANIZATION_FIELDS}
    }
`
const UPDATE_ORGANIZATION_BY_ID_MUTATION = gql`
    mutation updateOrganizationById($id: ID!, $data: OrganizationUpdateInput!) {
        obj: updateOrganization(id: $id, data: $data) ${ORGANIZATION_FIELDS}
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

function convertGQLItemToUIState (item) {
    // NOTE: DESERIALIZE
    // NOTE: Put here some GQL Item data transformation and validation!
    // NOTE: Add UI only attributes here (for example: `href`)
    if (item && item.__typename !== 'Organization') throw new Error('Wrong list type')
    const { id, name, description, ...othersAttrs } = item
    return { id, name, description, ...othersAttrs }
}

function convertUIStateToGQLItem (state, item = null) {
    // NOTE: SERIALIZE
    // NOTE: Put here some UI State data transformation and validation!
    // NOTE: You can add some extra UI hidden attributes here (for example: senderId)
    const baseItemValues = (item) ? item : {}
    const { id, name, description, ...othersStateAttrs } = state
    if (name.length < 2) {
        throw new ValidationError('[name.is.too.short]')
    }
    return {
        id, name, description,
        ...othersStateAttrs,
    }
}

function CreateAndEditOrganizationModalForm ({ visible, editableItem, cancelModal, onFinish }) {
    const intl = useIntl()
    const ValueIsTooShortMsg = intl.formatMessage({ id: 'ValueIsTooShort' })
    const CreateOrganizationModalTitleMsg = intl.formatMessage({ id: 'pages.organizations.CreateOrganizationModalTitle' })
    const EditOrganizationModalTitleMsg = intl.formatMessage({ id: 'pages.organizations.EditOrganizationModalTitle' })
    const FieldIsRequiredMsg = intl.formatMessage({ id: 'FieldIsRequired' })
    const NameMsg = intl.formatMessage({ id: 'Name' })
    const DescriptionMsg = intl.formatMessage({ id: 'Description' })

    const formInitialValues = { ...(editableItem) ? convertGQLItemToUIState(editableItem) : {} }
    const mutationExtraData = {}
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
    const { loading, data, refetch } = useQuery(GET_ALL_ORGANIZATION_TO_USER_LINKS_WITH_META_QUERY, {
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
