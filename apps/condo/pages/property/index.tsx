// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useCallback } from 'react'

import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { Typography, Space, Radio, Row, Col, Tooltip, Input, Table } from 'antd'
import { DatabaseFilled } from '@ant-design/icons'

import Head from 'next/head'
import { EmptyListView } from '@condo/domains/common/components/EmptyListView'
import { Button } from '@condo/domains/common/components/Button'

import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { useIntl } from '@core/next/intl'

import { Property } from '@condo/domains/property/schema/Property'

const PropertyPage = (): React.FC => {
    const intl = useIntl()
    const PageTitleMessage = intl.formatMessage({ id: 'pages.condo.property.index.PageTitle' })
    const ExportAsExcel = intl.formatMessage({ id: 'ExportAsExcel' })
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const NotImplementedYedMessage = intl.formatMessage({ id: 'NotImplementedYed' })
    const filtersFromQuery = false
    const createRoute = '/property/create'
    const CreateLabel = intl.formatMessage({ id: 'pages.condo.property.index.CreatePropertyButtonLabel' })

    const properties = ['1']
    const noProperties = !properties.length && !filtersFromQuery

    
    const handleRowAction = useCallback((record) => {
        return {
            onClick: () => {
                router.push(`/property/${record.id}/`)
            },
        }
    }, [])

    return (
        <>
            <Head>
                <title>{PageTitleMessage}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={[0, 0]} align={'top'}>
                        <Col span={6}>
                            <PageHeader title={<Typography.Title style={{ margin: 0 }}>
                                {PageTitleMessage}
                            </Typography.Title>} />
                        </Col>
                        {
                            !noProperties
                                ? <Col span={6} push={12} align={'right'}>
                                    <Radio.Group defaultValue="list" buttonStyle="solid" style={{ marginTop: 16 }}>
                                        <Radio.Button value="list">Список</Radio.Button>
                                        <Radio.Button value="map" disabled>
                                            На карте
                                        </Radio.Button>
                                    </Radio.Group>
                                </Col> : null
                        }
                    </Row>

                    <OrganizationRequired>
                        {
                            noProperties
                                ? <EmptyListView
                                    title='pages.condo.property.index.EmptyList.header'
                                    text='pages.condo.property.index.EmptyList.text'
                                    createRoute={createRoute}
                                    createLabel='pages.condo.property.index.CreatePropertyButtonLabel' />
                                :
                                <Row align={'middle'}>
                                    <Col span={6}>
                                        <Tooltip title={NotImplementedYedMessage}>
                                            <div>
                                                <Input placeholder={SearchPlaceholder} disabled />
                                            </div>
                                        </Tooltip>
                                    </Col>
                                    <Col span={6} push={1}>
                                        <Button type={'inlineLink'} icon={<DatabaseFilled />}  >{ExportAsExcel}</Button>
                                    </Col>
                                    <Col span={6} push={6} align={'right'}>
                                        <Button
                                            type='sberPrimary'
                                            style={{ marginTop: '16px' }}
                                            onClick={() => router.push(createRoute)}
                                        >
                                            {CreateLabel}
                                        </Button>
                                    </Col>
                                    <Col span={24}>

                                    </Col>
                                </Row>
                        }
                    </OrganizationRequired>
                </PageContent>
            </PageWrapper>
        </>
    )
}

const HeaderAction = () => {
    const intl = useIntl()

    return (
        <Space>
            <Typography.Text style={{ fontSize: '12px' }}>
                {intl.formatMessage({ id: 'menu.Property' })}
            </Typography.Text>
        </Space>
    )
}

PropertyPage.headerAction = <HeaderAction />

export default PropertyPage


/*
import Head from 'next/head'
import Link from 'next/link'
import React, { useEffect } from 'react'
import { Avatar, Button, Form, Input, Select } from 'antd'

import { useIntl } from '@core/next/intl'
import { useOrganization } from '@core/next/organization'

import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import FormList, {
    BaseModalForm,
    CreateFormListItemButton,
    ExpandableDescription,
    useCreateAndEditModalForm,
} from '@condo/domains/common/components/containers/FormList'
import { useTable } from '@condo/domains/common/components/containers/FormTableBlocks'
import { AddressSearchInput } from '@condo/domains/common/components/AddressSearchInput'
import * as Property from '@condo/domains/property/utils/clientSchema/Property'
import { buildingMapJson } from '@condo/domains/property/constants/property.example'

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
            /* NOTE: we need to recreate form if editableItem changed because the form initialValues are cached
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
                        [<Link href={href} key={1}><Button size="small" type={'primary'}>{SelectMsg}</Button></Link>],
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

    const { objs, count, refetch, loading } = Property.useObjects({}, {
        fetchPolicy: 'network-only',
    })
    const create = Property.useCreate({ organization: organization.id, map: buildingMapJson }, () => refetch())

    useEffect(() => {
        if (objs) {
            table.setData(objs)
            table.updateFilterPaginationSort({ total: count })
        }
    }, [loading])

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
*/

