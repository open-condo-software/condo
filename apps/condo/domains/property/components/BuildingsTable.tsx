import { useLazyQuery } from '@apollo/client'
import {
    OrganizationEmployeeRole,
    PropertyWhereInput,
    SortPropertiesBy,
} from '@app/condo/schema'
import { Col, notification, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import { ColumnsType } from 'antd/lib/table'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import { useRouter } from 'next/router'
import React, { useMemo, useState } from 'react'

import { PlusCircle, Search, Sheet } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { ActionBar, ActionBarProps, Button } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import Input from '@condo/domains/common/components/antd/Input'
import { EmptyListContent } from '@condo/domains/common/components/EmptyListContent'
import { ImportWrapper } from '@condo/domains/common/components/Import/Index'
import { Loader } from '@condo/domains/common/components/Loader'
import { Table } from '@condo/domains/common/components/Table/Index'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { FiltersMeta } from '@condo/domains/common/utils/filters.utils'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { EXPORT_PROPERTIES_TO_EXCEL } from '@condo/domains/property/gql'
import { useImporterFunctions } from '@condo/domains/property/hooks/useImporterFunctions'
import { PropertyTable } from '@condo/domains/property/utils/clientSchema'
import { IFilters, PROPERTY_PAGE_SIZE } from '@condo/domains/property/utils/helpers'


type BuildingTableProps = {
    role: OrganizationEmployeeRole
    baseSearchQuery: PropertyWhereInput
    tableColumns: ColumnsType
    propertyFilterMeta: FiltersMeta<PropertyWhereInput>[]
    loading?: boolean
    canDownloadProperties?: boolean
}

const ROW_VERTICAL_GUTTERS: [Gutter, Gutter] = [0, 40]

const BuildingTableContent: React.FC<BuildingTableProps> = (props) => {
    const {
        role,
        tableColumns,
        loading,
        canDownloadProperties,
        baseSearchQuery,
        propertyFilterMeta,
    } = props

    const intl = useIntl()
    const ExportAsExcel = intl.formatMessage({ id: 'ExportAsExcel' })
    const CreateLabel = intl.formatMessage({ id: 'pages.condo.property.index.CreatePropertyButtonLabel' })
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const DownloadExcelLabel = intl.formatMessage({ id: 'pages.condo.property.id.DownloadExcelLabel' })

    const router = useRouter()
    const { filters, sorters, offset } = parseQuery(router.query)

    const {
        filtersToWhere: filtersToPropertiesWhere,
        sortersToSortBy: sortersToSortPropertiesBy,
    } = useQueryMappers<PropertyWhereInput>(propertyFilterMeta, ['address'])

    const searchPropertiesQuery = useMemo(() => ({
        ...filtersToPropertiesWhere(filters),
        ...baseSearchQuery,
    }), [baseSearchQuery, filters, filtersToPropertiesWhere])

    const sortBy = sortersToSortPropertiesBy(sorters) as SortPropertiesBy[]

    const currentPageIndex = getPageIndexFromOffset(offset, PROPERTY_PAGE_SIZE)

    const { loading: propertiesLoading, refetch, objs: properties, count: total } = PropertyTable.useObjects({
        sortBy,
        where: { ...searchPropertiesQuery },
        skip: (currentPageIndex - 1) * PROPERTY_PAGE_SIZE,
        first: PROPERTY_PAGE_SIZE,
    })

    const handleRowAction = (record) => {
        return {
            onClick: async () => {
                await router.push(`/property/${record.id}/`)
            },
        }
    }

    const [downloadLink, setDownloadLink] = useState(null)
    const [exportToExcel, { loading: isXlsLoading }] = useLazyQuery(
        EXPORT_PROPERTIES_TO_EXCEL,
        {
            onError: error => {
                const message = get(error, ['graphQLErrors', 0, 'extensions', 'messageForUser']) || error.message
                notification.error({ message })
            },
            onCompleted: data => {
                setDownloadLink(data.result.linkToFile)
            },
        },
    )

    const [columns, propertyNormalizer, propertyValidator, propertyCreator] = useImporterFunctions()

    const [search, handleSearchChange] = useSearch<IFilters>()

    const canManageProperties = get(role, 'canManageProperties', false)
    const isDownloadButtonHidden = !get(role, 'canReadProperties', canDownloadProperties === true)

    function onExportToExcelButtonClicked () {
        exportToExcel({
            variables: {
                data: {
                    where: { ...searchPropertiesQuery },
                    sortBy,
                },
            },
        })
    }

    const actionBarButtons: ActionBarProps['actions'] = useMemo(() =>
        [
            canManageProperties && (
                <>
                    <Button
                        type='primary'
                        onClick={async () => await router.push('/property/create')}
                        icon={<PlusCircle size='medium'/>}
                    >
                        {CreateLabel}
                    </Button>
                    <ImportWrapper
                        accessCheck={canManageProperties}
                        onFinish={refetch}
                        columns={columns}
                        rowNormalizer={propertyNormalizer}
                        rowValidator={propertyValidator}
                        objectCreator={propertyCreator}
                        domainName='property'
                    />
                </>
            ),
            !isDownloadButtonHidden && (
                downloadLink
                    ? (
                        <Button
                            type='secondary'
                            icon={<Sheet size='medium' />}
                            loading={isXlsLoading}
                            target='_blank'
                            href={downloadLink}
                            rel='noreferrer'>
                            {DownloadExcelLabel}
                        </Button>
                    )
                    : (
                        <Button
                            type='secondary'
                            icon={<Sheet size='medium' />}
                            loading={isXlsLoading}
                            onClick={onExportToExcelButtonClicked}>
                            {ExportAsExcel}
                        </Button>
                    )
            ),
        ], [CreateLabel, DownloadExcelLabel, ExportAsExcel, canManageProperties, columns, downloadLink, isDownloadButtonHidden, isXlsLoading, onExportToExcelButtonClicked, propertyCreator, propertyNormalizer, propertyValidator, refetch, router])

    return (
        <Row justify='space-between' gutter={ROW_VERTICAL_GUTTERS}>
            <Col span={24}>
                <TableFiltersContainer>
                    <Input
                        placeholder={SearchPlaceholder}
                        onChange={(e) => {
                            handleSearchChange(e.target.value)
                        }}
                        value={search}
                        allowClear={true}
                        suffix={<Search size='medium' color={colors.gray[7]} />}
                    />
                </TableFiltersContainer>
            </Col>
            <Col span={24}>
                <Table
                    totalRows={total}
                    loading={propertiesLoading || loading}
                    dataSource={properties}
                    onRow={handleRowAction}
                    columns={tableColumns}
                    pageSize={PROPERTY_PAGE_SIZE}
                    data-cy='property__table'
                />
            </Col>
            {
                !isEmpty(actionBarButtons.filter(Boolean)) && (
                    <Col span={24}>
                        <ActionBar actions={actionBarButtons}/>
                    </Col>
                )
            }
        </Row>
    )
}

export default function BuildingsTable (props: BuildingTableProps) {
    const { role, baseSearchQuery, loading } = props

    const intl = useIntl()
    const EmptyListLabel = intl.formatMessage({ id: 'pages.condo.property.index.EmptyList.header' })
    const EmptyListManualBodyDescription = intl.formatMessage({ id: 'pages.condo.property.index.EmptyList.manualCreateCard.body.description' })
    const CreateProperty = intl.formatMessage({ id: 'pages.condo.property.index.CreatePropertyButtonLabel' })

    const [columns, propertyNormalizer, propertyValidator, propertyCreator] = useImporterFunctions()

    const canManageProperties = get(role, 'canManageProperties', false)

    const { count, loading: propertiesCountLoading } = PropertyTable.useCount({ where: baseSearchQuery })
    const { refetch } = PropertyTable.useObjects({ where: baseSearchQuery }, { skip: true })

    if (propertiesCountLoading || loading) {
        return <Loader />
    }

    if (count === 0) {
        return <EmptyListContent
            label={EmptyListLabel}
            accessCheck={canManageProperties}
            createRoute='/property/create'
            createLabel={CreateProperty}
            importLayoutProps={{
                manualCreateEmoji: '🏠',
                manualCreateDescription: EmptyListManualBodyDescription,
                importCreateEmoji: '🏘️',
                importWrapper: {
                    accessCheck: canManageProperties,
                    onFinish: refetch,
                    columns: columns,
                    rowNormalizer: propertyNormalizer,
                    rowValidator: propertyValidator,
                    objectCreator: propertyCreator,
                    domainName: 'property',
                },
            }}
        />
    }

    return (
        <BuildingTableContent {...props} />
    )
}
