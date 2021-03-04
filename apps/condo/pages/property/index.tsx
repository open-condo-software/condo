// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import Head from 'next/head'
import Link from 'next/link'
import React, { useEffect } from 'react'
import { Avatar, Button, Form, Input, Select } from 'antd'

import { useIntl } from '@core/next/intl'
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
import { AddressSearchInput } from '../../components/AddressSearchInput'
import * as Property from '../../utils/clientSchema/Property'
import { buildingMapJson } from '../../constants/property.example'

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

    return (
        <BaseModalForm
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
                <AddressSearchInput/>
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
    )
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
    const SelectMsg = intl.formatMessage({ id: 'Select' })

    return (
        <FormList
            loading={loading}
            dataSource={objs}
            renderItem={(item) => {
                const { name, address, avatar, href } = item
                return {
                    extraBlockMeta: { style: { width: '150px' } },
                    avatar: <Avatar src={avatar} shape="square" size="large"/>,
                    title: <Link href={href}><a>{name}</a></Link>,
                    description: <ExpandableDescription>{address}</ExpandableDescription>,
                    actions: [
                        [<Link href={href}><Button size="small" type={'primary'}>{SelectMsg}</Button></Link>],
                    ],
                }
            }}
        />
    )
}

function PropertyCRUDListBlock () {
    const { organization } = useOrganization()
    const modal = useCreateAndEditModalForm()
    const table = useTable()

    const { objs, count, refetch, loading } = Property.useObjects()
    const create = Property.useCreate({ organization: organization.id, map: buildingMapJson }, () => refetch())

    useEffect(() => {
        if (objs) {
            table.setData(objs)
            table.updateFilterPaginationSort({ total: count })
        }
    }, [objs])

    return (
        <>
            <CreatePropertyModalBlock modal={modal} create={create}/>
            <ViewOrEditPropertyListBlock objs={objs} loading={loading}/>
        </>
    )
}

const PropertyIndexPage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id: 'pages.condo.property.index.PageTitle' })

    return (
        <>
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
    )
}

export default PropertyIndexPage