// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useCallback, useState } from 'react'

import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { Typography, Space, Radio, Row, Col, Tooltip, Input, Table } from 'antd'
import { DatabaseFilled } from '@ant-design/icons'

import Head from 'next/head'
import { EmptyListView } from '@condo/domains/common/components/EmptyListView'
import { MapGL } from '@condo/domains/common/components/MapGL'
import { Button } from '@condo/domains/common/components/Button'

import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { useIntl } from '@core/next/intl'
import { useRouter } from 'next/router'
import { useOrganization } from '@core/next/organization'

import qs from 'qs'
import pickBy from 'lodash/pickBy'
import XLSX from 'xlsx'
import has from 'lodash/has'

import {
    getFiltersFromQuery,
    getPaginationFromQuery,
    getSortStringFromQuery,
    sorterToQuery,
    filtersToQuery,
    PROPERTY_PAGE_SIZE,
} from '@condo/domains/property/utils/helpers'

import { useTableColumns } from '@condo/domains/property/hooks/useTableColumns'
import { Property } from '@condo/domains/property/utils/clientSchema'

import debounce from 'lodash/debounce'

import {
    BaseModalForm,
    useCreateAndEditModalForm,
} from '@condo/domains/common/components/containers/FormList'

import { AddressSearchInput } from '@condo/domains/common/components/AddressSearchInput'
import { Form, Select } from 'antd'
import { buildingMapJson } from '@condo/domains/property/constants/property.example'


// TODO(zuch): Change from modal to create page
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
                <AddressSearchInput />
            </Form.Item>
            <Form.Item
                name="name"
                label={NameMsg}
                rules={[{ required: true, message: FieldIsRequiredMsg }]}
            >
                <Input />
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
// TODO(zuch): Change from modal to create page
function CreatePropertyModalBlock ({ modal, create }) {
    const { visible, editableItem, cancelModal, openCreateModal } = modal

    const intl = useIntl()
    const CreateLabel = intl.formatMessage({ id: 'pages.condo.property.index.CreatePropertyButtonLabel' })

    return <>
        <Button
            type='sberPrimary'
            onClick={openCreateModal}
        >
            {CreateLabel}
        </Button>
        <CreateAndEditPropertyModalForm
            action={create}
            visible={visible}
            editableItem={editableItem}
            cancelModal={cancelModal}
        />
    </>
}
const PropertyPageViewMap = (): React.FC => {
    const {
        objs: properties,
    } = Property.useObjects()

    const points = properties
        .filter(property => has(property, ['addressMeta', 'data']))
        .map(property => {
            const { geo_lat, geo_lon } = property.addressMeta.data
            return {
                title: property.name,
                text: property.address,
                location: { lat: geo_lat, lng: geo_lon },
                route: `/property/${property.id}/`,
            }
        })

    return (
        <>
            <MapGL points={points} />
        </>
    )
}


const PropertyPageViewTable = (): React.FC => {
    const intl = useIntl()
    const ExportAsExcel = intl.formatMessage({ id: 'ExportAsExcel' })
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const NotImplementedYedMessage = intl.formatMessage({ id: 'NotImplementedYed' })
    const createRoute = '/property/create'
    const router = useRouter()
    const modal = useCreateAndEditModalForm()
    const { organization } = useOrganization()
    const create = Property.useCreate({ organization: organization.id, map: buildingMapJson }, () => refetch())
    const sortFromQuery = getSortStringFromQuery(router.query)
    const offsetFromQuery = getPaginationFromQuery(router.query)
    const filtersFromQuery = getFiltersFromQuery(router.query)

    const {
        refetch,
        fetchMore,
        loading,
        count: total,
        objs: properties,
    } = Property.useObjects({
        sortBy: sortFromQuery,
        where: filtersToQuery(filtersFromQuery),
        offset: offsetFromQuery,
        limit: PROPERTY_PAGE_SIZE,
    })

    const tableColumns = useTableColumns(sortFromQuery, filtersFromQuery)

    const handleTableChange = useCallback(debounce((...tableChangeArguments) => {
        const [nextPagination, nextFilters, nextSorter] = tableChangeArguments
        const { current, pageSize } = nextPagination
        const offset = current * pageSize - pageSize
        const sort = sorterToQuery(nextSorter)
        const filters = filtersToQuery(nextFilters)
        if (!loading) {
            fetchMore({
                sortBy: sort,
                where: filters,
                offset,
                first: PROPERTY_PAGE_SIZE,
                limit: PROPERTY_PAGE_SIZE,
            }).then(() => {
                const query = qs.stringify(
                    { ...router.query, sort, offset, filters: JSON.stringify(pickBy(nextFilters)) },
                    { arrayFormat: 'comma', skipNulls: true, addQueryPrefix: true },
                )
                router.push(router.route + query)
            })

        }
    }, 400), [loading])

    const generateExcelData = useCallback(() => {
        return new Promise<void>((resolve, reject) => {
            try {
                const cols = [
                    'address',
                    'organization',
                    'flatsCount',
                    'ticketsInWork',
                ]
                const wb = XLSX.utils.book_new()
                const ws = XLSX.utils.json_to_sheet(
                    properties.map((property) => Property.extractAttributes(property, cols)), { header: cols }
                )
                XLSX.utils.book_append_sheet(wb, ws, 'table')
                XLSX.writeFile(wb, 'export_properties.xlsx')
            } catch (e) {
                reject(e)
            } finally {
                resolve()
            }
        })
    }, [properties])

    const noProperties = !properties.length && !filtersFromQuery

    const handleRowAction = useCallback((record) => {
        return {
            onClick: () => {
                router.push(`/property/${record.id}/`)
            },
        }
    }, [router])
    return (
        <>
            {
                noProperties ?
                    <EmptyListView
                        title='pages.condo.property.index.EmptyList.header'
                        text='pages.condo.property.index.EmptyList.text'
                        createRoute={createRoute}
                        createLabel='pages.condo.property.index.CreatePropertyButtonLabel' />
                    :
                    <Row align={'middle'} gutter={[0, 40]}>
                        <Col span={6}>
                            <Tooltip title={NotImplementedYedMessage}>
                                <div>
                                    <Input placeholder={SearchPlaceholder} disabled />
                                </div>
                            </Tooltip>
                        </Col>
                        <Col span={6} push={1}>
                            <Button type={'inlineLink'} icon={<DatabaseFilled />} onClick={generateExcelData} >{ExportAsExcel}</Button>
                        </Col>
                        <Col span={6} push={6} align={'right'}>
                            <CreatePropertyModalBlock modal={modal} create={create} />
                        </Col>
                        <Col span={24}>
                            <Table
                                bordered
                                tableLayout={'fixed'}
                                loading={loading}
                                dataSource={properties}
                                onRow={handleRowAction}
                                rowKey={record => record.id}
                                columns={tableColumns}
                                onChange={handleTableChange}
                                pagination={{
                                    total,
                                    current: offsetFromQuery,
                                    pageSize: PROPERTY_PAGE_SIZE,
                                    position: ['bottomLeft'],
                                }}
                            />
                        </Col>
                    </Row>
            }
        </>
    )

}

const PropertyPage = (): React.FC => {
    const intl = useIntl()
    const PageTitleMessage = intl.formatMessage({ id: 'pages.condo.property.index.PageTitle' })
    const ShowMap = intl.formatMessage({ id: 'pages.condo.property.index.ViewModeMap' })  
    const ShowTable = intl.formatMessage({ id: 'pages.condo.property.index.ViewModeTable' }) 
    const [viewMode, changeViewMode] = useState('list')

    return (
        <>
            <Head>
                <title>{PageTitleMessage}</title>
            </Head>
            <PageWrapper>
                <PageContent> 
                    <OrganizationRequired>
                        <Row gutter={[0, 40]} align={'top'} style={{ zIndex: 1, position: 'relative' }}>
                            <Col span={6} >
                                <PageHeader style={{ background: 'transparent' }} title={<Typography.Title>
                                    {PageTitleMessage}
                                </Typography.Title>} />
                            </Col>
                            <Col span={6} push={12} align={'right'} style={{ top: 10 }}>
                                <Radio.Group value={viewMode} buttonStyle="solid" onChange={e => changeViewMode(e.target.value)}>
                                    <Radio.Button value="list">{ShowTable}</Radio.Button>
                                    <Radio.Button value="map">{ShowMap}</Radio.Button>
                                </Radio.Group>
                            </Col>
                        </Row>
                        {
                            viewMode == 'map' ?
                                <PropertyPageViewMap />
                                :
                                <PropertyPageViewTable />
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
