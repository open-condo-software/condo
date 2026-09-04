import { Row, RowData, Table } from '@tanstack/react-table'
import React from 'react'

import { SelectionCheckbox } from '@open-condo/ui/src/components/Table/components/SelectionCheckbox'
import { COLUMN_ID_SELECTION } from '@open-condo/ui/src/components/Table/constants'
import type { ColumnDefWithId, RowSelectionOptions } from '@open-condo/ui/src/components/Table/types'


type SelectableRow = {
    getCanSelect: () => boolean
    getIsSelected: () => boolean
}

function getHeaderSelectionState (rows: SelectableRow[]): { checked: boolean, indeterminate: boolean } {
    const selectableRows = rows.filter(row => row.getCanSelect())
    const selectedCount = selectableRows.filter(row => row.getIsSelected()).length
    const allSelectableSelected = selectableRows.length > 0 && selectedCount === selectableRows.length

    return {
        checked: allSelectableSelected,
        indeterminate: selectedCount > 0 && !allSelectableSelected,
    }
}

function toggleAllSelectableRows<TData extends RowData> (table: Table<TData>): void {
    const selectableRows = table.getRowModel().rows.filter(row => row.getCanSelect())
    const allSelectableSelected = selectableRows.length > 0 && selectableRows.every(row => row.getIsSelected())

    table.toggleAllRowsSelected(!allSelectableSelected)
}

type SelectionColumnHeaderProps<TData extends RowData> = {
    table: Table<TData>
}

function SelectionColumnHeader<TData extends RowData> ({ table }: SelectionColumnHeaderProps<TData>) {
    const { checked, indeterminate } = getHeaderSelectionState(table.getRowModel().rows)

    return (
        <SelectionCheckbox
            checked={checked}
            indeterminate={indeterminate}
            onChange={() => toggleAllSelectableRows(table)}
        />
    )
}

type SelectionColumnCellProps<TData extends RowData> = {
    row: Row<TData>
    getCheckboxTooltip?: RowSelectionOptions<TData>['getCheckboxTooltip']
}

function SelectionColumnCell<TData extends RowData> ({ row, getCheckboxTooltip }: SelectionColumnCellProps<TData>) {
    return (
        <SelectionCheckbox
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            tooltip={getCheckboxTooltip?.(row.original)}
            onChange={row.getToggleSelectedHandler()}
        />
    )
}

export function getSelectionColumnDef<TData extends RowData> (
    getCheckboxTooltip?: RowSelectionOptions<TData>['getCheckboxTooltip']
): ColumnDefWithId<TData> {
    return {
        id: COLUMN_ID_SELECTION,
        header: ({ table }) => <SelectionColumnHeader table={table} />,
        cell: ({ row }) => (
            <SelectionColumnCell
                row={row}
                getCheckboxTooltip={getCheckboxTooltip}
            />
        ),
        minSize: 48,
        enableSorting: false,
        enableColumnFilter: false,
        meta: {
            enableColumnSettings: false,
            enableColumnMenu: false,
            enableColumnResize: false,
            initialVisibility: true,
            initialSize: 48,
            initialOrder: 0,
        },
    }
}
