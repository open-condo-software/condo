import { OrganizationEmployeeRole, SortDocumentsBy } from '@app/condo/schema'
import { Col, Row } from 'antd'
import omit from 'lodash/omit'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'

import { Search } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button, Select } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import Input from '@condo/domains/common/components/antd/Input'
import { EmptyListContent } from '@condo/domains/common/components/EmptyListContent'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { getFiltersQueryData } from '@condo/domains/common/utils/filters.utils'
import { getFiltersFromQuery, updateQuery } from '@condo/domains/common/utils/helpers'
import { FiltersFromQueryType, getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { useUpdateDocumentModal } from '@condo/domains/document/hooks/useUpdateDocumentModal'
import { useUploadDocumentsModal } from '@condo/domains/document/hooks/useUploadDocumentsModal'
import { Document, DocumentCategory } from '@condo/domains/document/utils/clientSchema'
import { usePropertyDocumentsTableColumns } from '@condo/domains/property/hooks/usePropertyDocumentsTableColumns'
import { usePropertyDocumentsTableFilters } from '@condo/domains/property/hooks/usePropertyDocumentsTableFilters'


const SORTABLE_PROPERTIES = ['name', 'category', 'createdAt']
const DOCUMENTS_DEFAULT_SORT_BY = ['createdAt_DESC']

const TableContent = ({ total, documentsLoading, documents, openUploadModal, role, refetchDocuments }) => {
    const intl = useIntl()
    const AddDocumentMessage = intl.formatMessage({ id: 'documents.propertyDocuments.addDocument' })

    const tableColumns = usePropertyDocumentsTableColumns()

    const { UpdateDocumentModal, setSelectedDocument } = useUpdateDocumentModal()

    const canManageDocuments = useMemo(() => role?.canManageDocuments || false, [role])

    const handleRowAction = useCallback((document) => {
        return {
            onClick: async () => {
                if (canManageDocuments) {
                    setSelectedDocument(document)
                }
            },
        }
    }, [canManageDocuments, setSelectedDocument])

    return (
        <>
            <Row gutter={[0, 40]}>
                <Col span={24}>
                    <Table
                        totalRows={total}
                        loading={documentsLoading}
                        dataSource={documents}
                        columns={tableColumns}
                        onRow={handleRowAction}
                    />
                </Col>
                {
                    canManageDocuments && (
                        <Col span={24}>
                            <ActionBar
                                actions={[
                                    <Button
                                        key='createDocument'
                                        type='primary'
                                        onClick={openUploadModal}
                                    >
                                        {AddDocumentMessage}
                                    </Button>,
                                ]}
                            />
                        </Col>
                    )
                }
            </Row>
            <UpdateDocumentModal refetchDocuments={refetchDocuments} withCategory={false} />
        </>
    )
}


type OrganizationDocumentsProps = {
    // organizationId: string
    // role?: OrganizationEmployeeRole
    // refetchDocumentsCount?: () => void
    // documentsCount: number
}

export const OrganizationDocuments: React.FC<OrganizationDocumentsProps> = () => {
    const intl = useIntl()
    const SearchPlaceholder = intl.formatMessage({ id: 'documents.propertyDocuments.filters.search.placeholder' })
    const EmptyListLabel = intl.formatMessage({ id: 'documents.propertyDocuments.emptyList.label' })
    const EmptyListMessage = intl.formatMessage({ id: 'documents.propertyDocuments.emptyList.message' })
    const AddDocumentMessage = intl.formatMessage({ id: 'documents.propertyDocuments.addDocument' })

    const { role, organization } = useOrganization()
    const organizationId = useMemo(() => organization?.id, [organization])

    const router = useRouter()
    const { sorters, offset } = parseQuery(router.query)
    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)
    const filtersMeta = usePropertyDocumentsTableFilters()
    const { filtersToWhere, sortersToSortBy } = useQueryMappers(filtersMeta, SORTABLE_PROPERTIES)
    const sortBy = sortersToSortBy(sorters, DOCUMENTS_DEFAULT_SORT_BY) as SortDocumentsBy[]
    const filters = useMemo(() => getFiltersFromQuery<Record<string, any>>(router.query), [router.query])

    const { count: documentsCount, refetch: refetchDocumentsCount } = Document.useCount({
        where: {
            organization: { id: organizationId },
            property_is_null: true,
        },
    }, { skip: !organizationId })

    const {
        loading: documentsLoading,
        count: total,
        objs: documents,
        refetch: refetchDocuments,
    } = Document.useObjects({
        sortBy,
        where: {
            organization: { id: organizationId },
            property_is_null: true,
            ...filtersToWhere(filters),
        },
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
    }, { skip: !organizationId })

    const canManageDocuments = useMemo(() => role?.canManageDocuments || false, [role])

    const { setOpen, UploadDocumentsModal } = useUploadDocumentsModal()
    const openUploadModal = useCallback(() => setOpen(true), [setOpen])

    const initialCreateDocumentValue = useMemo(() => ({
        organization: { connect: { id: organizationId } },
    }), [organizationId])

    const refetch = useCallback(async () => {
        await refetchDocuments()
        await refetchDocumentsCount()
    }, [refetchDocuments, refetchDocumentsCount])

    const [search, handleSearchChange] = useSearch()
    const handleSearch = useCallback((e) => handleSearchChange(e.target.value), [handleSearchChange])

    if (documentsCount === 0) {
        return (
            <>
                <EmptyListContent
                    label={EmptyListLabel}
                    message={EmptyListMessage}
                    accessCheck={canManageDocuments}
                    button={(
                        <Button type='primary' onClick={openUploadModal}>
                            {AddDocumentMessage}
                        </Button>
                    )}
                    image='/mascot/searching.webp'
                />
                <UploadDocumentsModal
                    initialCreateDocumentValue={initialCreateDocumentValue}
                    onComplete={refetch}
                    withCategory={false}
                />
            </>
        )
    }

    return (
        <>
            <Row gutter={[0, 32]}>
                <Col span={24}>
                    <TableFiltersContainer>
                        <Input
                            placeholder={SearchPlaceholder}
                            onChange={handleSearch}
                            value={search}
                            allowClear
                            suffix={<Search size='medium' color={colors.gray[7]}/>}
                        />
                    </TableFiltersContainer>
                </Col>
                <Col span={24}>
                    <TableContent
                        total={total}
                        documentsLoading={documentsLoading}
                        documents={documents}
                        openUploadModal={openUploadModal}
                        role={role}
                        refetchDocuments={refetch}
                    />
                </Col>
            </Row>
            <UploadDocumentsModal
                initialCreateDocumentValue={initialCreateDocumentValue}
                onComplete={refetch}
                withCategory={false}
            />
        </>
    )
}