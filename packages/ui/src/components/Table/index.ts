import { Table } from './table'
import { renderTextWithTooltip } from './utils/renderCellUtils'
import './style.less'

export type { TableProps, TableColumn, TableColumnMenuLabels, GetTableData, TableState, DefaultColumn } from './types'
export { 
    Table,
    renderTextWithTooltip,
}

// We want export defaultParseUrl and defaultUpdateUrl for condo from our ui-kit? 
