import { GetDocumentsForTableQuery, useGetDocumentsForTableLazyQuery } from '@app/condo/gql'
import { SortDocumentsBy } from '@app/condo/schema'
import { Row, Col } from 'antd'
import omit from 'lodash/omit'
import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Input, Space, Modal, Typography, Checkbox, Table, GetTableData, SortState, TableColumn, RenderTableCell, TableRef } from '@open-condo/ui'

import {
    getTableCellRenderer,
} from '@condo/domains/common/components/Table/Renders'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useTableSearch } from '@condo/domains/common/hooks/useSearch'
import { useTableTranslations } from '@condo/domains/common/hooks/useTableTranslations'
import { usePropertyDocumentsTableFilters } from '@condo/domains/property/hooks/usePropertyDocumentsTableFilters'


const DOCUMENT_PAGE_SIZE = 10


type TData = GetDocumentsForTableQuery['documents'][number]
type UseDocumentsTableColumns = () => Array<TableColumn<TData>>

const useDocumentsTableColumns: UseDocumentsTableColumns = () => {
    const intl = useIntl()
    const addressMessage = intl.formatMessage({ id: 'documents.columns.organization' })
    const fileMessage = intl.formatMessage({ id: 'documents.columns.file' })
    const detailsMessage = intl.formatMessage({ id: 'documents.columns.details' })

    const renderName = useCallback<RenderTableCell<TData, TData['name']>>(
        (name, _, __, globalFilter) => getTableCellRenderer({ search: globalFilter, ellipsis: true })(name)
        , []
    )

    const renderDetails = useCallback<RenderTableCell<TData>>((_, document) => {
        if (document?.property?.id) {
            return (
                <Typography.Paragraph type='secondary' size='medium'>
                    <Typography.Text type='secondary' size='medium'>
                        {document?.property?.address}
                    </Typography.Text>
                    <Typography.Text type='secondary' size='medium'>
                        {' '}({document?.category?.name})
                    </Typography.Text>
                </Typography.Paragraph>
            )
        }

        return (
            <Typography.Text type='secondary' size='medium'>
                {addressMessage}
            </Typography.Text>
        )
    }, [addressMessage])

    return useMemo<Array<TableColumn<TData>>>(() => [
        {
            header: fileMessage,
            dataKey: 'name',
            id: 'name',
            enableSorting: true,
            initialSize: 200,
            render: renderName,
            enableColumnResize: false,
            enableColumnSettings: false,
            minSize: 200,
        },
        {
            header: detailsMessage,
            id: 'details',
            dataKey: 'id',
            initialSize: 300,
            render: renderDetails,
            enableColumnResize: false,
            enableColumnSettings: false,
            enableSorting: false,
            minSize: 300,
        },
    ], [renderDetails, renderName, detailsMessage, fileMessage])
}

const DocumentsTableContent: React.FC<any> = ({ setSelectedDocuments }) => {
    const intl = useIntl()
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const organizationMessage = intl.formatMessage({ id: 'documents.SelectDocumentsModal.organization' })
    const propertyMessage = intl.formatMessage({ id: 'documents.SelectDocumentsModal.property' })

    const { organization } = useOrganization()
    const organizationId = useMemo(() => organization?.id || null, [organization])

    const baseSearchQuery = useMemo(() => ({
        organization: { id: organizationId },
    }), [organizationId])

    const tableRef = useRef<TableRef | null>(null)
    const [search, handleSearchChange] = useTableSearch(tableRef)

    const [showOrganizationDocuments, setShowOrganizationDocuments] = useState<boolean>(true)
    const [showPropertyDocuments, setShowPropertyDocuments] = useState<boolean>(true)
    const switchShowOrganizationDocuments = useCallback(() => {
        setShowOrganizationDocuments(prev => !prev)
    }, [])
    const switchShowPropertyDocuments = useCallback(() => {
        setShowPropertyDocuments(prev => !prev)
    }, [])
    const selectedDocumentType = useMemo(() => {
        if (showOrganizationDocuments && showPropertyDocuments) return 'both'
        if (showOrganizationDocuments && !showPropertyDocuments) return 'organization'
        if (!showOrganizationDocuments && showPropertyDocuments) return 'property'
        return 'nothing'
    }, [showOrganizationDocuments, showPropertyDocuments])
    useEffect(() => {
        tableRef.current.api.setFilterState({ ...tableRef.current.api.getFilterState(), documentType: selectedDocumentType })
    }, [selectedDocumentType])

    const getCheckboxFilters = useCallback((documentType) => {
        if (documentType === 'both') {
            return {}
        }
        if (documentType === 'organization') {
            return { property_is_null: true }
        }
        if (documentType === 'property') {
            return { property_is_null: false }
        }
        return { id: null }
    }, [])

    const tableColumns = useDocumentsTableColumns()
    const filtersMeta = usePropertyDocumentsTableFilters()
    const { filtersToWhere, sortersToSortBy } = useQueryMappers(filtersMeta, null)

    const documentsByIdsRef = useRef<Record<string, GetDocumentsForTableQuery['documents'][number]>>({})
    const [fetchDocuments] = useGetDocumentsForTableLazyQuery()

    const getDocumentsSortBy = useCallback((sortState: SortState) => {
        if (!sortState) {
            return sortersToSortBy([]) as SortDocumentsBy[]
        }

        return sortersToSortBy(sortState) as SortDocumentsBy[]
    }, [sortersToSortBy])

    const dataSource: GetTableData<GetDocumentsForTableQuery['documents'][number]> = useCallback(async ({
        filterState,
        sortState,
        startRow,
        endRow,
        globalFilter,
    }) => {
        const sortBy = getDocumentsSortBy(sortState)
        const where = {
            ...baseSearchQuery,
            ...filtersToWhere({ ...omit(filterState, 'documentType'), search: globalFilter }),
            ...(filterState?.documentType ? ({ ...getCheckboxFilters(filterState?.documentType) }) : null),
        }
        const skip = startRow
        const first = endRow - startRow

        const payload = {
            sortBy,
            where,
            first,
            skip,
        }

        const { data: { documents, meta: { count } } } = await fetchDocuments({
            variables: payload,
            fetchPolicy: 'network-only',
        })

        const rowData = documents?.filter(Boolean) ?? []

        for (const item of rowData) {
            if (item?.id) {
                documentsByIdsRef.current[item.id] = item
            }
        }

        return { rowData: rowData, rowCount: count }
    }, [fetchDocuments, filtersToWhere, baseSearchQuery, getDocumentsSortBy, getCheckboxFilters])

    const menuLabels = useTableTranslations()

    const getRowId = useCallback((row: GetDocumentsForTableQuery['documents'][number]) => row.id, [])

    return (
        <Row gutter={[0, 24]}>
            <Col span={24}>
                <TableFiltersContainer>
                    <Row gutter={[24, 12]} justify='space-between' align='middle'>
                        <Col flex='auto'>
                            <Input
                                placeholder={SearchPlaceholder}
                                onChange={(e) => {
                                    handleSearchChange(e.target.value)
                                }}
                                value={search}
                                allowClear
                            />
                        </Col>
                        <Col>
                            <Row>
                                <Space size={24} align='center'>
                                    <Checkbox
                                        checked={showOrganizationDocuments}
                                        onChange={switchShowOrganizationDocuments}
                                        children={organizationMessage}
                                    />
                                    <Checkbox
                                        checked={showPropertyDocuments}
                                        onChange={switchShowPropertyDocuments}
                                        children={propertyMessage}
                                    />
                                </Space>
                            </Row>
                        </Col>
                    </Row>

                </TableFiltersContainer>
            </Col>
            <Col span={24}>
                <Table
                    id='documents-selectable-table'
                    dataSource={dataSource}
                    columns={tableColumns}
                    pageSize={DOCUMENT_PAGE_SIZE}
                    columnLabels={menuLabels}
                    rowSelectionOptions={{
                        enableRowSelection: true,
                        onRowSelectionChange: (rowSelectionState) => {
                            const selectedDocuments =
                                rowSelectionState
                                    .map(documentId => documentsByIdsRef.current?.[documentId])
                                    .filter(Boolean)
                            setSelectedDocuments(selectedDocuments)
                        },
                    }}
                    getRowId={getRowId}
                    ref={tableRef}
                />
            </Col>
        </Row>
    )
}

export const SelectDocumentsModal: React.FC<any> = ({ open, setOpen, onSelect }) => {
    const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
    const cancelModal = useCallback(() => {
        setOpen(false)
        setSelectedDocuments([])
    }, [setOpen])

    return (
        <Modal
            scrollX={false}
            width='big'
            open={open}
            onCancel={cancelModal}
            title='Выберите файлы из доступных ИИ-помощнику'
            destroyOnClose
            footer={(
                <Space size={16} direction='horizontal' wrap>
                    <Button
                        type='primary'
                        disabled={selectedDocuments.length < 1}
                        onClick={() => {
                            onSelect(selectedDocuments)
                            cancelModal()
                        }}
                    >
                        {`Выбрать (${selectedDocuments.length})`}
                    </Button>
                </Space>
            )}
        >
            <DocumentsTableContent
                setSelectedDocuments={setSelectedDocuments}
            />
        </Modal>
    )
}
