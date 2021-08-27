import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { debounce } from 'lodash'
import qs from 'qs'
import { useLazyQuery } from '@apollo/client'

import { PROPERTY_PAGE_SIZE } from '@condo/domains/property/utils/helpers'
import { useTableColumns } from '@condo/domains/property/hooks/useTableColumns'
import { Property } from '@condo/domains/property/utils/clientSchema'
import { useOrganization } from '@core/next/organization'
import { useIntl } from '@core/next/intl'

import { EXPORT_PROPERTIES_TO_EXCEL } from '@condo/domains/property/gql'
import { Col, Input, notification, Row, Space } from 'antd'
import { Table } from '@condo/domains/common/components/Table/Index'
import { useImporterFunctions } from '../hooks/useImporterFunctions'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { DatabaseFilled, DiffOutlined } from '@ant-design/icons'
import { ImportWrapper } from '@condo/domains/common/components/Import/Index'
import { Button } from '@condo/domains/common/components/Button'
import { getFilter, getPageIndexFromOffset, getSorterMap, parseQuery, QueryMeta } from '@condo/domains/common/utils/tables.utils'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'

type BuildingTableProps = {
    onSearch?: (properties: Property.IPropertyUIState[]) => void
}

export default function BuildingsTable (props: BuildingTableProps) {

    const intl = useIntl()

    const ExportAsExcel = intl.formatMessage({ id: 'ExportAsExcel' })
    const CreateLabel = intl.formatMessage({ id: 'pages.condo.property.index.CreatePropertyButtonLabel' })
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const PageTitleMsg = intl.formatMessage({ id: 'pages.condo.property.id.PageTitle' })
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })
    const PropertiesMessage = intl.formatMessage({ id: 'menu.Property' })
    const DownloadExcelLabel = intl.formatMessage({ id: 'pages.condo.property.id.DownloadExcelLabel' })

    const router = useRouter()

    const { organization, link: { role } } = useOrganization()

    const addressFilter = getFilter('address', 'single', 'string', 'contains_i')
    const unitsCountFilter = getFilter('unitsCount', 'single', 'number')

    const queryMetas: QueryMeta[] = [
        { keyword: 'address', filters: [addressFilter] },
        { keyword: 'search', filters: [addressFilter, unitsCountFilter], combineType: 'OR' },
    ]

    const { filters, sorters, offset } = parseQuery(router.query)

    const currentPageIndex = getPageIndexFromOffset(offset, PROPERTY_PAGE_SIZE)

    const { filtersToWhere, sortersToSortBy } = useQueryMappers(queryMetas, ['address'])
    const sorterMap = getSorterMap(sorters)

    const tableColumns = useTableColumns(sorterMap, filters)
    const { loading, error, refetch, objs: properties, count: total } = Property.useObjects({
        sortBy: sortersToSortBy(sorters),
        where: { ...filtersToWhere(filters), organization: { id: organization.id } },
        skip: (currentPageIndex - 1) * PROPERTY_PAGE_SIZE,
        first: PROPERTY_PAGE_SIZE,
    }, {
        fetchPolicy: 'network-only',
        onCompleted: () => {
            props.onSearch && props.onSearch(properties)
        },
    })

    const handleRowAction = (record) => {
        return {
            onClick: () => {
                router.push(`/property/${record.id}/`)
            },
        }
    }

    const [downloadLink, setDownloadLink] = useState(null)
    const [
        exportToExcel, { loading: isXlsLoading },
    ] = useLazyQuery(
        EXPORT_PROPERTIES_TO_EXCEL,
        {
            onError: error => {
                notification.error(error)
            },
            onCompleted: data => {
                setDownloadLink(data.result.linkToFile)
            },
        }
    )

    const [columns, propertyNormalizer, propertyValidator, propertyCreator] = useImporterFunctions()
    const filtersWithOrganizations = useMemo(() => ({ ...filtersToWhere(filters), organization: { id: organization.id } }), [filters, filtersToWhere, organization.id])
    // TODO(mrfoxpro): move to common
    const applyFiltersToQuery = (newFilters) => {
        const query = { ...router.query, filters: JSON.stringify(newFilters) }
        const newQuery = qs.stringify({ ...query }, { arrayFormat: 'comma', skipNulls: true, addQueryPrefix: true })
        router.replace(router.route + newQuery)
    }

    const debouncedSearch = debounce((text) => {
        filters.search = text
        applyFiltersToQuery(filters)
    }, 400)

    function onExportToExcelButtonClicked () {
        exportToExcel({ variables: { data: { where: filtersWithOrganizations, sortBy: sortersToSortBy(sorters) } } })
    }

    if (error) {
        return <LoadingOrErrorPage title={PageTitleMsg} loading={loading} error={error ? ServerErrorMsg : null} />
    }

    return (
        <Row align={'middle'} gutter={[0, 40]}>
            <Col span={6}>
                <Input

                    placeholder={SearchPlaceholder}
                    onChange={(e) => debouncedSearch(e.target.value)}
                    defaultValue={filters.address}
                />
            </Col>
            <Col span={6} push={1}>
                {downloadLink
                    ?
                    <Button
                        type={'inlineLink'}
                        icon={<DatabaseFilled />}
                        loading={isXlsLoading}
                        target='_blank'
                        href={downloadLink}
                        rel='noreferrer'>{DownloadExcelLabel}
                    </Button>
                    :
                    <Button
                        type={'inlineLink'}
                        icon={<DatabaseFilled />}
                        loading={isXlsLoading}
                        onClick={onExportToExcelButtonClicked}>{ExportAsExcel}
                    </Button>}
            </Col>
            <Col span={6} push={6} align={'right'}>
                {role?.canManageProperties ? (
                    <Space size={16}>
                        <ImportWrapper
                            objectsName={PropertiesMessage}
                            accessCheck={role?.canManageProperties}
                            onFinish={refetch}
                            columns={columns}
                            rowNormalizer={propertyNormalizer}
                            rowValidator={propertyValidator}
                            objectCreator={propertyCreator}
                        >
                            <Button
                                type={'sberPrimary'}
                                icon={<DiffOutlined />}
                                secondary />
                        </ImportWrapper>
                        <Button type='sberPrimary' onClick={() => router.push('/buildings/create')}>
                            {CreateLabel}
                        </Button>
                    </Space>
                ) : null}
            </Col>
            <Col span={24}>
                <Table
                    totalRows={total}
                    loading={loading}
                    dataSource={properties}
                    onRow={handleRowAction}
                    columns={tableColumns}
                    pageSize={PROPERTY_PAGE_SIZE}
                />
            </Col>
        </Row>)
}
