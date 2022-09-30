import { FilterValue } from 'antd/es/table/interface'
import { isEmpty } from 'lodash'

import { getTableCellRenderer } from '@condo/domains/common/components/Table/Renders'


export const getManyEmployeesNameRender = (search: FilterValue) => {
    return function render (intl, employees) {
        if (isEmpty(employees)) {
            return '—'
        }

        return employees.map((employee) => getTableCellRenderer(search)(employee))
    }
}