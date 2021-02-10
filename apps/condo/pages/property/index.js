import { useIntl } from '@core/next/intl'
import Head from 'next/head'
import Link from 'next/link'
import React, { useEffect } from 'react'
import { Avatar, Button, Form, Input, Select } from 'antd'

import { useAuth } from '@core/next/auth'
import { useOrganization } from '@core/next/organization'

import { PageContent, PageHeader, PageWrapper } from '../../containers/BaseLayout'
import { OrganizationRequired } from '../../containers/OrganizationRequired'
import FormList, {
    BaseModalForm,
    CreateFormListItemButton,
    ExpandableDescription,
    useCreateAndEditModalForm,
} from '../../containers/FormList'
import { useTable } from '../../containers/FormTableBlocks'
import { SearchInput } from '../../containers/FormBlocks'

import { useCreate, useObjects } from '../../schema/Property.uistate'

async function searchDadataAddress (client, value) {
    // https://dadata.ru/api/suggest/address/
    const token = '257f4bd2c057e727f4e48438d121ffa7a665fce7'
    const loadSuggestionsUrl = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address'
    const response = await fetch(loadSuggestionsUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ query: value }),
    })
    const data = await response.json()
    if (!data.suggestions) throw new Error('no suggestions')
    const suggestions = data.suggestions.map(x => {
        const notNull = Object.fromEntries(Object.keys(x.data).filter((k) => !!x.data[k]).map((k) => [k, x.data[k]]))
        return {
            text: x.value,
            value: JSON.stringify({ ...notNull, address: x.value }),
        }
    })
    console.log(suggestions)
    return suggestions
}

function CreateAndEditPropertyModalForm ({ action, visible, editableItem, cancelModal }) {
    const intl = useIntl()
    const AddressMsg = intl.formatMessage({ id: 'pages.condo.property.field.Address' })
    const NameMsg = intl.formatMessage({ id: 'pages.condo.property.field.Name' })
    const TypeMsg = intl.formatMessage({ id: 'pages.condo.property.field.Type' })
    const BuildingMsg = intl.formatMessage({ id: 'pages.condo.property.type.building' })
    const VillageMsg = intl.formatMessage({ id: 'pages.condo.property.type.village' })
    const CreatePropertyModalTitleMsg = intl.formatMessage({ id: 'pages.condo.property.index.CreatePropertyModalTitle' })
    const EditPropertyModalTitleMsg = intl.formatMessage({ id: 'pages.condo.property.index.EditPropertyModalTitle' })
    const ValueIsTooShortMsg = intl.formatMessage({ id: 'ValueIsTooShort' })
    const FieldIsRequiredMsg = intl.formatMessage({ id: 'FieldIsRequired' })
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
        formValuesToMutationDataPreprocessor={(x) => {
            const addressMeta = JSON.parse(x['address'])
            return { ...x, addressMeta, address: addressMeta['address'] }
        }}
        visible={visible}
        cancelModal={cancelModal}
        ModalTitleMsg={(editableItem) ? EditPropertyModalTitleMsg : CreatePropertyModalTitleMsg}
        ErrorToFormFieldMsgMapping={ErrorToFormFieldMsgMapping}
    >
        <Form.Item
            name="address"
            label={AddressMsg}
            rules={[{ required: true, message: FieldIsRequiredMsg }]}
        >
            <SearchInput search={searchDadataAddress}/>
        </Form.Item>
        <Form.Item
            name="name"
            label={NameMsg}
            rules={[{ required: true, message: FieldIsRequiredMsg }]}
        >
            <Input/>
        </Form.Item>
        <Form.Item
            name="type"
            label={TypeMsg}
            rules={[{ required: true, message: FieldIsRequiredMsg }]}
            initialValue={'building'}
        >
            <Select>
                <Select.Option value="building">{BuildingMsg}</Select.Option>
                <Select.Option value="village">{VillageMsg}</Select.Option>
            </Select>
        </Form.Item>
    </BaseModalForm>
}

function CreatePropertyModalBlock ({ modal, create }) {
    const { visible, editableItem, cancelModal, openCreateModal } = modal

    const intl = useIntl()
    const CreatePropertyButtonLabelMsg = intl.formatMessage({ id: 'pages.condo.property.index.CreatePropertyButtonLabel' })

    return <>
        <CreateFormListItemButton onClick={openCreateModal} label={CreatePropertyButtonLabelMsg}/>
        <CreateAndEditPropertyModalForm
            action={create}
            visible={visible}
            editableItem={editableItem}
            cancelModal={cancelModal}
        />
    </>
}

function ViewOrEditPropertyListBlock ({ loading, objs }) {
    const intl = useIntl()
    const DoneMsg = intl.formatMessage({ id: 'Done' })
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })
    const AcceptMsg = intl.formatMessage({ id: 'Accept' })
    const SelectMsg = intl.formatMessage({ id: 'Select' })
    const EditMsg = intl.formatMessage({ id: 'Edit' })
    const DeleteMsg = intl.formatMessage({ id: 'Delete' })
    const AreYouSureMsg = intl.formatMessage({ id: 'AreYouSure' })

    // function handleSelect (item) {
    //     selectLink(item).then(() => {
    //         const query = getQueryParams()
    //         if (query.next) Router.push(query.next)
    //         else Router.push('/')
    //     })
    // }

    return <FormList
        loading={loading}
        // pagination={paginationProps}
        // dataSource={objs || LOADING_LIST}
        dataSource={objs}
        renderItem={(item) => {
            const { name, address, avatar, href } = (item)
            return {
                extraBlockMeta: { style: { width: '150px' } },
                avatar: <Avatar src={avatar} shape="square" size="large"/>,
                title: <Link href={href}><a>{name}</a></Link>,
                description: <ExpandableDescription>{address}</ExpandableDescription>,
                actions: [
                    [<Link href={href}><Button size="small" type={'primary'}>{SelectMsg}</Button></Link>],
                    // [<ExtraDropdownActionsMenu actions={[
                    //     {
                    //         label: EditMsg,
                    //         action: () => openEditModal(item),
                    //     },
                    //     {
                    //         label: DeleteMsg,
                    //         confirm: {
                    //             title: AreYouSureMsg,
                    //             icon: <QuestionCircleOutlined style={{ color: 'red' }}/>,
                    //         },
                    //         action: () => handleDelete(item),
                    //     },
                    // ]}/>],
                ],
            }
        }}
    />

}

function PropertyCRUDListBlock () {
    const { user } = useAuth()
    const { organization } = useOrganization()
    const modal = useCreateAndEditModalForm()
    const table = useTable()

    const { objs, count, refetch, error, loading } = useObjects()
    const create = useCreate({ organization: organization.id }, () => refetch())

    useEffect(() => {
        if (objs) {
            table.setData(objs)
            table.updateFilterPaginationSort({ total: count })
            const actions = {
                // CreateOrUpdate: handleCreateOrUpdate,
                // Delete: handleDelete,
            }
            // table.updateActions(actions)
        }
    }, [objs])

    return <>
        <CreatePropertyModalBlock modal={modal} create={create}/>
        <ViewOrEditPropertyListBlock objs={objs} loading={loading}/>
    </>
}

const PropertyIndexPage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'pages.condo.property.index.PageTitle' })

    return <>
        <Head>
            <title>{PageTitleMsg}</title>
        </Head>
        <PageWrapper>
            <PageHeader title={PageTitleMsg}/>
            <PageContent>
                <OrganizationRequired>
                    <PropertyCRUDListBlock/>
                </OrganizationRequired>
            </PageContent>
        </PageWrapper>
    </>
}

export default PropertyIndexPage