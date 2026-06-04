import { Document as DocumentType, SortDocumentsBy } from '@app/condo/schema'
import { Col, Row } from 'antd'
import get from 'lodash/get'
import Head from 'next/head'
import React, { useCallback, useMemo, useRef } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button, Table, Typography } from '@open-condo/ui'
import type { GetTableData, SortState, TableRef } from '@open-condo/ui'

import { PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { PageComponentType } from '@condo/domains/common/types'
import { useDocumentsTableColumns } from '@condo/domains/document/hooks/useDocumentsTableColumns'
import { useUpdateDocumentModal } from '@condo/domains/document/hooks/useUpdateDocumentModal'
import { useUploadDocumentsModal } from '@condo/domains/document/hooks/useUploadDocumentsModal'
import { Document } from '@condo/domains/document/utils/clientSchema'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'


const getSortBy = (sortState: SortState): SortDocumentsBy[] => {
    if (!sortState || sortState.length === 0) return [SortDocumentsBy.CreatedAtDesc]
    const { id, desc } = sortState[0]
    if (id === 'name') {
        return [desc ? SortDocumentsBy.NameDesc : SortDocumentsBy.NameAsc]
    }
    if (id === 'category') {
        return [desc ? SortDocumentsBy.CategoryDesc : SortDocumentsBy.CategoryAsc]
    }
    if (id === 'createdAt') {
        return [desc ? SortDocumentsBy.CreatedAtDesc : SortDocumentsBy.CreatedAtAsc]
    }
    return [SortDocumentsBy.CreatedAtDesc]
}

const DocumentsPage: PageComponentType = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'documents.title' })
    const AddDocumentMessage = intl.formatMessage({ id: 'documents.propertyDocuments.addDocument' })

    const { organization, link } = useOrganization()
    const role = get(link, 'role', {})
    const organizationId = get(organization, 'id')
    const canManageDocuments = useMemo(() => get(role, 'canManageDocuments', false), [role])

    const { setOpen, UploadDocumentsModal } = useUploadDocumentsModal()
    const openUploadModal = useCallback(() => setOpen(true), [setOpen])

    const initialCreateDocumentValue = useMemo(() => ({
        organization: { connect: { id: organizationId } },
    }), [organizationId])

    const {
        refetch: refetchDocuments,
    } = Document.useObjects({
        where: { organization: { id: organizationId } },
        sortBy: [SortDocumentsBy.CreatedAtDesc],
        first: 30,
        skip: 0,
    }, { skip: !organizationId })

    const dataSource: GetTableData<DocumentType> = useCallback(async ({
        startRow,
        endRow,
        sortState,
    }) => {
        const sortBy = getSortBy(sortState)
        const result = await refetchDocuments({
            where: { organization: { id: organizationId } },
            sortBy,
            first: endRow - startRow,
            skip: startRow,
        })
        return {
            rowData: result.data?.objs || [],
            rowCount: result.data?.meta?.count || 0,
        }
    }, [organizationId, refetchDocuments])

    const tableColumns = useDocumentsTableColumns()
    const { UpdateDocumentModal, setSelectedDocument } = useUpdateDocumentModal()
    const tableRef = useRef<TableRef>(null)

    const handleRowClick = useCallback((document) => {
        if (canManageDocuments) {
            setSelectedDocument(document)
        }
    }, [canManageDocuments, setSelectedDocument])

    const refetch = useCallback(async () => {
        await tableRef.current?.api.refetchData()
        await refetchDocuments()
    }, [refetchDocuments])

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={<Typography.Title>{PageTitle}</Typography.Title>} />
                <TablePageContent>
                    <Row gutter={[0, 32]}>
                        <Col span={24}>
                            <Table
                                id='documents-table'
                                dataSource={dataSource}
                                columns={tableColumns}
                                onRowClick={handleRowClick}
                                pageSize={30}
                                ref={tableRef}
                            />
                        </Col>
                    </Row>
                    {
                        canManageDocuments && (
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
                        )
                    }
                    <UpdateDocumentModal refetchDocuments={refetch} />
                    <UploadDocumentsModal
                        initialCreateDocumentValue={initialCreateDocumentValue}
                        onComplete={refetch}
                    />
                </TablePageContent>
            </PageWrapper>
        </>
    )
}

DocumentsPage.requiredAccess = OrganizationRequired

export default DocumentsPage
