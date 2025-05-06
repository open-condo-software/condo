import { TableRowSelection } from 'antd/lib/table/interface'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState } from 'react'

import { Checkbox, CheckboxProps } from '@open-condo/ui'

import { getObjectValueFromQuery } from '@condo/domains/common/utils/query'


type UseTableRowSelectionProps<TableItem> = {
    items: TableItem[]
}

type UseTableRowSelectionResult<TableItem> = {
    selectedKeys: string[]
    clearSelection: () => void
    rowSelection: TableRowSelection<TableItem>
}

export const useTableRowSelection = <TableItem extends { id: string }> ({
    items,
}: UseTableRowSelectionProps<TableItem>): UseTableRowSelectionResult<TableItem> => {
    const router = useRouter()

    const itemIds = useMemo(() => items?.map(item => item?.id).filter(Boolean) || [], [items])
    const [selectedKeys, setSelectedKeys] = useState<string[]>(() => getObjectValueFromQuery(router, ['selectedIds'], []))
    const updateSelectedKeys = useCallback((selectedKeys: string[]) => {
        setSelectedKeys(selectedKeys)
    }, [])
    const selectedRowKeysByPage = useMemo(() => {
        return itemIds?.filter(itemId => selectedKeys.includes(itemId))
    }, [itemIds, selectedKeys])
    const handleSelectAllRowsByPage: CheckboxProps['onChange'] = useCallback(e => {
        const checked = e.target.checked
        if (checked) {
            const newSelectedReadingKeys = itemIds?.filter(itemId => !selectedRowKeysByPage.includes(itemId))

            updateSelectedKeys([...selectedKeys, ...newSelectedReadingKeys])
        } else {
            updateSelectedKeys(selectedKeys.filter(key => !selectedRowKeysByPage.includes(key)))
        }
    }, [itemIds, updateSelectedKeys, selectedKeys, selectedRowKeysByPage])
    const handleSelectRow: (record: TableItem, checked: boolean) => void = useCallback((record, checked) => {
        const selectedKey = record.id
        if (checked) {
            updateSelectedKeys([...selectedKeys, selectedKey])
        } else {
            updateSelectedKeys(selectedKeys.filter(key => selectedKey !== key))
        }
    }, [selectedKeys, updateSelectedKeys])

    const isSelectedAllRowsByPage = itemIds?.length > 0 && selectedRowKeysByPage?.length > 0 &&
        selectedRowKeysByPage.length === itemIds.length
    const isSelectedSomeRowsByPage = itemIds?.length > 0 && selectedRowKeysByPage?.length > 0 &&
        selectedRowKeysByPage.length < itemIds.length

    const rowSelection: TableRowSelection<TableItem> = useMemo(() => ({
        selectedRowKeys: selectedRowKeysByPage,
        fixed: true,
        onSelect: handleSelectRow,
        columnTitle: (
            <Checkbox
                checked={isSelectedAllRowsByPage}
                indeterminate={isSelectedSomeRowsByPage}
                onChange={handleSelectAllRowsByPage}
            />
        ),
    }), [handleSelectAllRowsByPage, handleSelectRow, isSelectedAllRowsByPage, isSelectedSomeRowsByPage, selectedRowKeysByPage])

    const clearSelection = useCallback(() => setSelectedKeys([]), [])

    return useMemo(() => ({
        selectedKeys,
        clearSelection,
        rowSelection,
    }), [clearSelection, rowSelection, selectedKeys])
}