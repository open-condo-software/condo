import { Table } from './table'
import { renderTextWithTooltip } from './utils/renderCellUtils'
import { defaultUpdateUrlCallback, defaultParseUrlQuery } from './utils/urlQuery'
import './style.less'

export type { TableProps, TableColumn, TableColumnMenuLabels, GetData, TableParamsRequest } from './types'
export { 
    Table,
    renderTextWithTooltip,
    defaultUpdateUrlCallback,
    defaultParseUrlQuery,
}
