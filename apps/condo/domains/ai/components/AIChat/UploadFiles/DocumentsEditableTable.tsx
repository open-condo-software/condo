import { Document as DocumentType } from '@app/condo/schema'
import { FormInstance, Form } from 'antd'
import React, { useCallback, useMemo, useRef } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Table, GetTableData, TableColumn, RenderTableCell, TableRef } from '@open-condo/ui'

import {
    getTableCellRenderer,
} from '@condo/domains/common/components/Table/Renders'

import { EditableDocumentDetails } from './EditableDocumentDetails'


type DocumentsEditableTableData = DocumentType & { name: string }
type UseDocumentsEditableTableColumns = (form: FormInstance) => Array<TableColumn<DocumentsEditableTableData>>
const useDocumentsEditableTableColumns: UseDocumentsEditableTableColumns = (form) => {
    const intl = useIntl()
    const fileMessage = intl.formatMessage({ id: 'aiChat.DocumentsEditableTable.columns.file' })
    const detailsMessage = intl.formatMessage({ id: 'aiChat.DocumentsEditableTable.columns.details' })

    const renderName = useCallback<RenderTableCell<DocumentsEditableTableData, DocumentsEditableTableData['name']>>(
        (name) => getTableCellRenderer({ ellipsis: { rows: 1 } })(name)
        , []
    )

    const renderEditableDocumentDetails = useCallback((_, record) => {
        return <EditableDocumentDetails key={record.uid} form={form} editableDocumentId={record.uid} />
    }, [form])

    return useMemo<Array<TableColumn<DocumentsEditableTableData>>>(() => [
        {
            header: fileMessage,
            id: 'name',
            dataKey: 'name',
            initialSize: '40%',
            enableColumnResize: false,
            enableColumnSettings: false,
            enableSorting: false,
            render: renderName,
        },
        {
            header: detailsMessage,
            id: 'details',
            dataKey: 'id',
            initialSize: '60%',
            enableColumnResize: false,
            enableColumnSettings: false,
            enableSorting: false,
            render: renderEditableDocumentDetails,
        },
    ], [renderEditableDocumentDetails, renderName, fileMessage, detailsMessage])
}


export const DocumentsEditableTable: React.FC<{
    documents: Array<DocumentType & { name: string }>
    form: FormInstance
}> = ({ documents, form }) => {
    const tableRef = useRef<TableRef | null>(null)
    const tableColumns = useDocumentsEditableTableColumns(form)

    const dataSource: GetTableData<DocumentsEditableTableData> = useCallback(async () => {
        return { rowData: documents || [], rowCount: documents?.length || 0 }
    }, [documents])

    return (
        <Table
            id='upload-documents-table'
            dataSource={dataSource}
            columns={tableColumns}
            ref={tableRef}
        />
    )
}
