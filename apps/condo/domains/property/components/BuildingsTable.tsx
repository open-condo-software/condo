import { DatabaseFilled, DiffOutlined } from '@ant-design/icons'
import { useLazyQuery } from '@apollo/client'
import {
    OrganizationEmployeeRole,
    PropertyWhereInput,
    Property as PropertyType,
    SortPropertiesBy,
} from '@app/condo/schema'
import { Button } from '@condo/domains/common/components/Button'
import { ImportWrapper } from '@condo/domains/common/components/Import/Index'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { Table } from '@condo/domains/common/components/Table/Index'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { EmptyListView } from '@condo/domains/common/components/EmptyListView'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { EXPORT_PROPERTIES_TO_EXCEL } from '@condo/domains/property/gql'
import { Property } from '@condo/domains/property/utils/clientSchema'
import { IFilters, PROPERTY_PAGE_SIZE } from '@condo/domains/property/utils/helpers'
import { useIntl } from '@core/next/intl'
import { Col, notification, Row } from 'antd'
import Input from '@condo/domains/common/components/antd/Input'
import { Gutter } from 'antd/es/grid/row'
import { ColumnsType } from 'antd/lib/table'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import { useImporterFunctions } from '../hooks/useImporterFunctions'
import isEmpty from 'lodash/isEmpty'

type BuildingTableProps = {
    role: OrganizationEmployeeRole
    searchPropertiesQuery: PropertyWhereInput
    tableColumns: ColumnsType
    sortBy: SortPropertiesBy[]
    onSearch?: (properties: PropertyType[]) => void
    loading?: boolean
}

const ROW_VERTICAL_GUTTERS: [Gutter, Gutter] = [0, 40]
const ROW_SMALL_HORIZONTAL_GUTTERS: [Gutter, Gutter] = [10, 0]
const ROW_BIG_HORIZONTAL_GUTTERS: [Gutter, Gutter] = [40, 0]

export default function BuildingsTable (props: BuildingTableProps) {
    const intl = useIntl()

    const ExportAsExcel = intl.formatMessage({ id: 'ExportAsExcel' })
    const CreateLabel = intl.formatMessage({ id: 'pages.condo.property.index.CreatePropertyButtonLabel' })
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const PropertiesMessage = intl.formatMessage({ id: 'menu.Property' })
    const DownloadExcelLabel = intl.formatMessage({ id: 'pages.condo.property.id.DownloadExcelLabel' })
    const PropertyTitle = intl.formatMessage({ id: 'pages.condo.property.ImportTitle' })
    const EmptyListLabel = intl.formatMessage({ id: 'pages.condo.property.index.EmptyList.header' })
    const EmptyListMessage = intl.formatMessage({ id: 'pages.condo.property.index.EmptyList.text' })
    const CreateProperty = intl.formatMessage({ id: 'pages.condo.property.index.CreatePropertyButtonLabel' })

    const { role, searchPropertiesQuery, tableColumns, sortBy, loading } = props

    const { isSmall } = useLayoutContext()
    const router = useRouter()
    const { filters, offset } = parseQuery(router.query)
    const currentPageIndex = getPageIndexFromOffset(offset, PROPERTY_PAGE_SIZE)

    const { loading: propertiesLoading, refetch, objs: properties, count: total } = Property.useObjects({
        sortBy,
        where: { ...searchPropertiesQuery },
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

    const [search, handleSearchChange] = useSearch<IFilters>(propertiesLoading)
    const isNoBuildingsData = isEmpty(properties) && isEmpty(filters) && !propertiesLoading && !loading

    const canManageProperties = get(role, 'canManageProperties', false)

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

    return (
        <>
            <EmptyListView
                label={EmptyListLabel}
                message={EmptyListMessage}
                button={(
                    <ImportWrapper
                        objectsName={PropertiesMessage}
                        accessCheck={canManageProperties}
                        onFinish={refetch}
                        columns={columns}
                        rowNormalizer={propertyNormalizer}
                        rowValidator={propertyValidator}
                        domainTranslate={PropertyTitle}
                        objectCreator={propertyCreator}
                    >
                        <Button
                            type={'sberPrimary'}
                            icon={<DiffOutlined/>}
                            secondary
                        />
                    </ImportWrapper>
                )}
                createRoute="/property/create"
                createLabel={CreateProperty}
                containerStyle={{ display: isNoBuildingsData ? 'flex' : 'none' }}
            />
            <Row justify={'space-between'} gutter={ROW_VERTICAL_GUTTERS} hidden={isNoBuildingsData}>
                <Col span={24}>
                    <TableFiltersContainer>
                        <Row justify="space-between" gutter={ROW_VERTICAL_GUTTERS}>
                            <Col xs={24} lg={12}>
                                <Row align={'middle'} gutter={ROW_BIG_HORIZONTAL_GUTTERS}>
                                    <Col xs={24} lg={13}>
                                        <Input
                                            placeholder={SearchPlaceholder}
                                            onChange={(e) => {
                                                handleSearchChange(e.target.value)
                                            }}
                                            value={search}
                                            allowClear={true}
                                        />
                                    </Col>
                                    <Col hidden={isSmall}>
                                        {
                                            downloadLink
                                                ? (
                                                    <Button
                                                        type={'inlineLink'}
                                                        icon={<DatabaseFilled/>}
                                                        loading={isXlsLoading}
                                                        target="_blank"
                                                        href={downloadLink}
                                                        rel="noreferrer">
                                                        {DownloadExcelLabel}
                                                    </Button>
                                                )
                                                : (
                                                    <Button
                                                        type={'inlineLink'}
                                                        icon={<DatabaseFilled/>}
                                                        loading={isXlsLoading}
                                                        onClick={onExportToExcelButtonClicked}>
                                                        {ExportAsExcel}
                                                    </Button>
                                                )
                                        }
                                    </Col>
                                </Row>
                            </Col>
                            <Col xs={24} lg={6}>
                                <Row justify={'end'} gutter={ROW_SMALL_HORIZONTAL_GUTTERS}>
                                    <Col hidden={isSmall}>
                                        {
                                            canManageProperties && (
                                                <ImportWrapper
                                                    objectsName={PropertiesMessage}
                                                    accessCheck={canManageProperties}
                                                    onFinish={refetch}
                                                    columns={columns}
                                                    rowNormalizer={propertyNormalizer}
                                                    rowValidator={propertyValidator}
                                                    domainTranslate={PropertyTitle}
                                                    objectCreator={propertyCreator}
                                                    exampleTemplateLink="/buildings-import-example.xlsx"
                                                >
                                                    <Button
                                                        type={'sberPrimary'}
                                                        icon={<DiffOutlined/>}
                                                        secondary
                                                    />
                                                </ImportWrapper>
                                            )
                                        }
                                    </Col>
                                    <Col>
                                        {
                                            canManageProperties
                                                ? (
                                                    <Button type="sberPrimary" onClick={() => router.push('/property/create')}>
                                                        {CreateLabel}
                                                    </Button>
                                                )
                                                : null
                                        }
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
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
                    />
                </Col>
            </Row>
        </>
    )
}
