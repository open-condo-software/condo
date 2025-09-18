import type { TableColumn } from '../types'

export interface ColumnSizingConfig {
    columns: TableColumn[]
    containerWidth?: number
}

export const calculateInitialColumnSizes = ({ columns, containerWidth }: ColumnSizingConfig): Record<string, number | undefined> => {
    const visibleColumns = columns.filter(col => col.initialVisibility !== false)
    const fixedColumns = visibleColumns.filter(col => typeof col.initialWidth === 'number')
    const flexibleColumns = visibleColumns.filter(col => typeof col.initialWidth !== 'number')

    const sizesByKey: Record<string, number | undefined> = {}

    if (containerWidth && visibleColumns.length > 0) {
        if (fixedColumns.length === 0) {
            // No initialWidth set: distribute equally
            const per = Math.max(Math.floor(containerWidth / visibleColumns.length), 0)
            for (const col of visibleColumns) {
                sizesByKey[col.key] = per
            }
        } else if (fixedColumns.length < visibleColumns.length) {
            // Some have initialWidth: apply fixed and distribute remaining equally
            const fixedTotal = fixedColumns.reduce((sum, col) => sum + (col.initialWidth as number), 0)
            const remaining = Math.max(containerWidth - fixedTotal, 0)
            const per = flexibleColumns.length > 0 ? Math.floor(remaining / flexibleColumns.length) : 0
            
            for (const col of fixedColumns) {
                sizesByKey[col.key] = col.initialWidth as number
            }
            for (const col of flexibleColumns) {
                sizesByKey[col.key] = per
            }
        } else {
            // All have initialWidth: apply as-is
            for (const col of visibleColumns) {
                sizesByKey[col.key] = col.initialWidth as number
            }
        }
    } else {
        // Fallback when containerWidth is unknown: use provided sizes or defaults
        for (const col of visibleColumns) {
            sizesByKey[col.key] = (typeof col.initialWidth === 'number' 
                ? col.initialWidth 
                : (col.initialSize ?? col.width)) as number | undefined
        }
    }

    return sizesByKey
}

export const calculateColumnSizeVars = (table: any) => {
    const headers = table.getFlatHeaders()
    const colSizes: { [key: string]: string } = {}
    
    // Получаем текущие размеры всех видимых колонок
    const visibleHeaders = headers.filter((header: any) => header.column.getIsVisible())
    const totalSize = visibleHeaders.reduce((sum: number, header: any) => sum + header.column.getSize(), 0)
    
    visibleHeaders.forEach((header: any) => {
        const columnSize = header.column.getSize()
        const percentage = totalSize > 0 ? (columnSize / totalSize) * 100 : 100 / visibleHeaders.length
        
        colSizes[`--col-${header.column.id}-size`] = `${Math.round(percentage * 100) / 100}%`
    })
    
    return colSizes
}
