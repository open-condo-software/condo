import { OrganizationEmployeeRole, SortDocumentsBy } from '@app/condo/schema'
import { Col, Row } from 'antd'
import get from 'lodash/get'
import omit from 'lodash/omit'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'

import { Search } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
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
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { useUpdateDocumentModal } from '@condo/domains/document/hooks/useUpdateDocumentModal'
import { useUploadDocumentsModal } from '@condo/domains/document/hooks/useUploadDocumentsModal'
import { Document, DocumentCategory } from '@condo/domains/document/utils/clientSchema'
import { usePropertyDocumentsTableColumns } from '@condo/domains/property/hooks/usePropertyDocumentsTableColumns'
import { usePropertyDocumentsTableFilters } from '@condo/domains/property/hooks/usePropertyDocumentsTableFilters'


const SORTABLE_PROPERTIES = ['name', 'category', 'createdAt']
const DOCUMENTS_DEFAULT_SORT_BY = ['createdAt_DESC']

const TableContent = ({ total, documentsLoading, propertyDocuments, openUploadModal, role, refetchDocuments }) => {
    const intl = useIntl()
    const AddDocumentMessage = intl.formatMessage({ id: 'documents.propertyDocuments.addDocument' })

    const tableColumns = usePropertyDocumentsTableColumns()

    const { UpdateDocumentModal, setSelectedDocument } = useUpdateDocumentModal()

    const canManageDocuments = useMemo(() => get(role, 'canManageDocuments'), [role])

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
                        dataSource={propertyDocuments}
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
            <UpdateDocumentModal refetchDocuments={refetchDocuments} />
        </>
    )
}


type PropertyDocumentsProps = {
    organizationId: string
    propertyId: string
    role?: OrganizationEmployeeRole
    refetchDocumentsCount?: () => void
    propertyDocumentsCount: number
}

export const PropertyDocuments: React.FC<PropertyDocumentsProps> = ({
    organizationId,
    propertyId,
    role,
    refetchDocumentsCount,
    propertyDocumentsCount,
}) => {
    const intl = useIntl()
    const AllCategoriesMessage = intl.formatMessage({ id: 'documents.propertyDocuments.filters.category.allCategories' })
    const SearchPlaceholder = intl.formatMessage({ id: 'documents.propertyDocuments.filters.search.placeholder' })
    const EmptyListLabel = intl.formatMessage({ id: 'documents.propertyDocuments.emptyList.label' })
    const EmptyListMessage = intl.formatMessage({ id: 'documents.propertyDocuments.emptyList.message' })
    const AddDocumentMessage = intl.formatMessage({ id: 'documents.propertyDocuments.addDocument' })

    const router = useRouter()
    const { sorters, offset } = parseQuery(router.query)
    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)
    const filtersMeta = usePropertyDocumentsTableFilters()
    const { filtersToWhere, sortersToSortBy } = useQueryMappers(filtersMeta, SORTABLE_PROPERTIES)
    const sortBy = sortersToSortBy(sorters, DOCUMENTS_DEFAULT_SORT_BY) as SortDocumentsBy[]
    const filters = useMemo(() => getFiltersFromQuery(router.query), [router.query])

    const {
        loading: documentsLoading,
        count: total,
        objs: propertyDocuments,
        refetch: refetchDocuments,
    } = Document.useObjects({
        sortBy,
        where: {
            property: { id: propertyId },
            ...filtersToWhere(filters),
        },
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
    }, { skip: !propertyId })

    const { objs: categories, allDataLoaded: allCategoriesLoaded } = DocumentCategory.useAllObjects({})
    const categoryOptions = useMemo(() => {
        const options = categories.map(category => ({ label: get(category, 'name'), value: get(category, 'id') }))

        return [
            { label: AllCategoriesMessage, value: 'all' },
            ...options,
        ]
    }, [AllCategoriesMessage, categories])
    const categoryValueFromQuery = get(filters, 'category', 'all')
    const handleCategorySelectChange = useCallback(async (value) => {
        let newFilters = Object.assign({}, filters)
        if (value === 'all') {
            newFilters = omit(newFilters, 'category')
        } else {
            newFilters = { ...newFilters, category: value }
        }
        const newParameters = getFiltersQueryData(newFilters)
        await updateQuery(router, { newParameters }, { routerAction: 'replace', resetOldParameters: false, shallow: true })
    }, [filters, router])

    const canManagePropertyDocuments = useMemo(() => get(role, 'canManageDocuments', false), [role])

    const { setOpen, UploadDocumentsModal } = useUploadDocumentsModal()
    const openUploadModal = useCallback(() => setOpen(true), [setOpen])

    const initialCreateDocumentValue = useMemo(() => ({
        property: { connect: { id: propertyId } },
        organization: { connect: { id: organizationId } },
    }), [organizationId, propertyId])

    const refetch = useCallback(async () => {
        await refetchDocuments()
        await refetchDocumentsCount()
    }, [refetchDocuments, refetchDocumentsCount])

    const [search, handleSearchChange] = useSearch()
    const handleSearch = useCallback((e) => handleSearchChange(e.target.value), [handleSearchChange])

    if (propertyDocumentsCount === 0) {
        return (
            <>
                <EmptyListContent
                    label={EmptyListLabel}
                    message={EmptyListMessage}
                    accessCheck={canManagePropertyDocuments}
                    button={(
                        <Button type='primary' onClick={openUploadModal}>
                            {AddDocumentMessage}
                        </Button>
                    )}
                    image='/dino/searching@2x.png'
                />
                <UploadDocumentsModal
                    initialCreateDocumentValue={initialCreateDocumentValue}
                    onComplete={refetch}
                />
            </>
        )
    }

    return (
        <>
            <Row gutter={[0, 32]}>
                <Col span={24}>
                    <TableFiltersContainer>
                        <Row gutter={[16, 16]}>
                            <Col span={18}>
                                <Input
                                    placeholder={SearchPlaceholder}
                                    onChange={handleSearch}
                                    value={search}
                                    allowClear
                                    suffix={<Search size='medium' color={colors.gray[7]} />}
                                />
                            </Col>
                            <Col span={6}>
                                <Select
                                    options={categoryOptions}
                                    onChange={handleCategorySelectChange}
                                    value={categoryValueFromQuery}
                                    loading={!allCategoriesLoaded}
                                />
                            </Col>
                        </Row>
                    </TableFiltersContainer>
                </Col>
                <Col span={24}>
                    <TableContent
                        total={total}
                        documentsLoading={documentsLoading}
                        propertyDocuments={propertyDocuments}
                        openUploadModal={openUploadModal}
                        role={role}
                        refetchDocuments={refetch}
                    />
                </Col>
            </Row>
            <UploadDocumentsModal
                initialCreateDocumentValue={initialCreateDocumentValue}
                onComplete={refetch}
            />
        </>
    )
}