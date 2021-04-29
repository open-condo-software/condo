// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useCallback, useState } from 'react'
import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { Typography, Space, Radio, Row, Col, Input, Table } from 'antd'
import { DatabaseFilled } from '@ant-design/icons'
import Head from 'next/head'
import { EmptyListView } from '@condo/domains/common/components/EmptyListView'
import { MapGL } from '@condo/domains/common/components/MapGL'
import { Button } from '@condo/domains/common/components/Button'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { IFilters } from '@condo/domains/property/utils/helpers'
import { useIntl } from '@core/next/intl'
import { useRouter } from 'next/router'
import { useOrganization } from '@core/next/organization'

import qs from 'qs'
import pickBy from 'lodash/pickBy'
import get from 'lodash/get'
import has from 'lodash/has'
import XLSX from 'xlsx'
import isEmpty from 'lodash/isEmpty'

import {
    getPaginationFromQuery,
    getSortStringFromQuery,
    sorterToQuery,
    filtersToQuery,
    PROPERTY_PAGE_SIZE,
} from '@condo/domains/property/utils/helpers'
import { getFiltersFromQuery } from '@condo/domains/common/utils/helpers'

import { useTableColumns } from '@condo/domains/property/hooks/useTableColumns'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { Property } from '@condo/domains/property/utils/clientSchema'
import debounce from 'lodash/debounce'
import { PropertyImport } from '../../domains/property/components/PropertyImport'

import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'

const PropertyPageViewMap = (): React.FC => {
    const {
        objs: properties,
    } = Property.useObjects()


    const points = properties
        .filter(property => has(property, ['addressMeta', 'data'] ))
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
    const EmptyListLabel = intl.formatMessage({ id: 'pages.condo.property.index.EmptyList.header' })
    const EmptyListMessage = intl.formatMessage({ id: 'pages.condo.property.index.EmptyList.text' })
    const CreateLabel = intl.formatMessage({ id: 'pages.condo.property.index.CreatePropertyButtonLabel' })
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const createRoute = '/property/create'

    const router = useRouter()
    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])

    const sortFromQuery = getSortStringFromQuery(router.query)
    const offsetFromQuery = getPaginationFromQuery(router.query)
    const filtersFromQuery = getFiltersFromQuery<IFilters>(router.query)

    const {
        refetch,
        fetchMore,
        loading,
        error,
        count: total,
        objs: properties,
    } = Property.useObjects({
        sortBy: sortFromQuery,
        where: {
            ...filtersToQuery(filtersFromQuery),
            organization: { id: userOrganizationId },
        },
        skip: (offsetFromQuery * PROPERTY_PAGE_SIZE) - PROPERTY_PAGE_SIZE,
        first: PROPERTY_PAGE_SIZE,
    }, {
        fetchPolicy: 'network-only',
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
                skip: offset,
                first: PROPERTY_PAGE_SIZE,
            }).then(() => {
                const query = qs.stringify(
                    { ...router.query, sort, offset, filters: JSON.stringify(pickBy({ ...filtersFromQuery, ...nextFilters })) },
                    { arrayFormat: 'comma', skipNulls: true, addQueryPrefix: true },
                )
                router.push(router.route + query)
            })

        }
    }, 400), [loading])

    const [search, handleSearchChange] = useSearch<IFilters>(loading)

    const generateExcelData = useCallback(() => {
        return new Promise<void>((resolve, reject) => {
            try {
                const cols = [
                    'address',
                    'organization',
                    'unitsCount',
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

    const handleRowAction = useCallback((record) => {
        return {
            onClick: () => {
                router.push(`/property/${record.id}/`)
            },
        }
    }, [router])

    const PageTitleMsg = intl.formatMessage({ id: 'pages.condo.property.id.PageTitle' })
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })

    if (error || loading) {
        return <LoadingOrErrorPage title={PageTitleMsg} loading={loading} error={error ? ServerErrorMsg : null}/>
    }

    const isNoProperties = !properties.length && isEmpty(filtersFromQuery)

    return (
        <>
            {
                isNoProperties ?
                    <EmptyListView
                        label={EmptyListLabel}
                        message={EmptyListMessage}
                        createRoute={createRoute}
                        createLabel={CreateLabel} />
                    :
                    <Row align={'middle'} gutter={[0, 40]}>
                        <Col span={6}>
                            <Input
                                placeholder={SearchPlaceholder}
                                onChange={(e)=>{handleSearchChange(e.target.value)}}
                                value={search}
                            />
                        </Col>
                        <Col span={6} push={1}>
                            <Button type={'inlineLink'} icon={<DatabaseFilled />} onClick={generateExcelData} >{ExportAsExcel}</Button>
                        </Col>
                        <Col span={6} push={6} align={'right'}>
                            <Space size={16}>
                                <PropertyImport onFinish={refetch}/>
                                <Button type='sberPrimary' onClick={() => router.push(createRoute)}>
                                    {CreateLabel}
                                </Button>
                            </Space>
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
                                    showSizeChanger: false,
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
                                <Radio.Group value={viewMode} buttonStyle="outline" onChange={e => changeViewMode(e.target.value)}>
                                    <Radio.Button value="list">{ShowTable}</Radio.Button>
                                    <Radio.Button value="map">{ShowMap}</Radio.Button>
                                </Radio.Group>
                            </Col>
                            <Col span={24}>
                                {
                                    viewMode !== 'map' ? <PropertyPageViewTable /> : null
                                }
                            </Col>
                        </Row>
                        <>
                            {
                                viewMode === 'map' ? <PropertyPageViewMap /> : null
                            }
                        </>
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
