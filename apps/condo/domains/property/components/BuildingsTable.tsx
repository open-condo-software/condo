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

import { FileDown, PlusCircle, Search, Sheet } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { ActionBar, Button } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import Input from '@condo/domains/common/components/antd/Input'
import { EmptyListView } from '@condo/domains/common/components/EmptyListView'
import { ImportWrapper } from '@condo/domains/common/components/Import/Index'
import { Table } from '@condo/domains/common/components/Table/Index'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { EXPORT_PROPERTIES_TO_EXCEL } from '@condo/domains/property/gql'
import { useImporterFunctions } from '@condo/domains/property/hooks/useImporterFunctions'
import { PropertyTable } from '@condo/domains/property/utils/clientSchema'
import { IFilters, PROPERTY_PAGE_SIZE } from '@condo/domains/property/utils/helpers'


type BuildingTableProps = {
    role: OrganizationEmployeeRole
    searchPropertiesQuery: PropertyWhereInput
    tableColumns: ColumnsType
    sortBy: SortPropertiesBy[]
    loading?: boolean
    canDownloadProperties?: boolean
}

const ROW_VERTICAL_GUTTERS: [Gutter, Gutter] = [0, 40]

export default function BuildingsTable (props: BuildingTableProps) {
    const intl = useIntl()

    const ExportAsExcel = intl.formatMessage({ id: 'exportAsExcel' })
    const CreateLabel = intl.formatMessage({ id: 'property.index.createPropertyButtonLabel' })
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.fullSearch' })
    const PropertiesMessage = intl.formatMessage({ id: 'global.section.properties' })
    const DownloadExcelLabel = intl.formatMessage({ id: 'property.id.downloadExcelLabel' })
    const PropertyTitle = intl.formatMessage({ id: 'property.importTitle' })
    const EmptyListLabel = intl.formatMessage({ id: 'property.index.emptyList.header' })
    const EmptyListMessage = intl.formatMessage({ id: 'property.index.emptyList.text' })
    const CreateProperty = intl.formatMessage({ id: 'property.index.createPropertyButtonLabel' })
    const ImportButtonMessage = intl.formatMessage({ id: 'containers.formTableExcelImport.clickOrDragImportFileHint' })

    const { role, searchPropertiesQuery, tableColumns, sortBy, loading, canDownloadProperties } = props

    const router = useRouter()
    const { filters, offset } = parseQuery(router.query)
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
    const isNoBuildingsData = isEmpty(properties) && isEmpty(filters) && !propertiesLoading && !loading

    const canManageProperties = get(role, 'canManageProperties', false)
    const isDownloadButtonHidden = !get(role, 'canManageProperties', canDownloadProperties === true)
    const EMPTY_LIST_VIEW_CONTAINER_STYLE = { display: isNoBuildingsData ? 'flex' : 'none', paddingTop : canManageProperties ? 'inherit' : '5%' }
    const exampleTemplateLink = useMemo(() => `/buildings-import-example-${intl.locale}.xlsx`, [intl.locale])

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
                accessCheck={canManageProperties}
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
                        exampleTemplateLink={exampleTemplateLink}
                    >
                        <Button
                            type='secondary'
                            icon={<FileDown size='medium' />}
                        />
                    </ImportWrapper>
                )}
                createRoute='/property/create'
                createLabel={CreateProperty}
                containerStyle={EMPTY_LIST_VIEW_CONTAINER_STYLE}
            />
            <Row justify='space-between' gutter={ROW_VERTICAL_GUTTERS} hidden={isNoBuildingsData}>
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
                <Col span={24}>
                    <ActionBar actions={[
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
                                    objectsName={PropertiesMessage}
                                    accessCheck={canManageProperties}
                                    onFinish={refetch}
                                    columns={columns}
                                    rowNormalizer={propertyNormalizer}
                                    rowValidator={propertyValidator}
                                    domainTranslate={PropertyTitle}
                                    objectCreator={propertyCreator}
                                    exampleTemplateLink={exampleTemplateLink}
                                >
                                    <Button
                                        type='secondary'
                                        icon={<FileDown size='medium' />}
                                    >
                                        {ImportButtonMessage}
                                    </Button>
                                </ImportWrapper>
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
                    ]}
                    />
                </Col>
            </Row>
        </>
    )
}
