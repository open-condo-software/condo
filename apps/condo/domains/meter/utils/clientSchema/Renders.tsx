import { FilterValue } from 'antd/es/table/interface'
import { TextProps } from 'antd/es/typography/Text'
import get from 'lodash/get'

import { getTableCellRenderer } from '@condo/domains/common/components/Table/Renders'

const POSTFIX_PROPS: TextProps = { type: 'secondary', style: { whiteSpace: 'pre-line' } }

export const getUnitRender = (intl, search: FilterValue) => {
    return function render (text, record) {
        const unitType = get(record, ['meter', 'unitType'], 'flat')

        let unitNamePrefix = null
        let extraTitle = null
        if (text) {
            extraTitle = intl.formatMessage({ id: `pages.condo.ticket.field.unitType.${unitType}` })
            if (unitType !== 'flat') {
                unitNamePrefix = intl.formatMessage({ id: `pages.condo.ticket.field.unitType.prefix.${unitType}` })
            }
        }
        const unitName = text && unitNamePrefix ? `${unitNamePrefix} ${text}` : text
        return getTableCellRenderer(search, true, null, null, POSTFIX_PROPS, extraTitle)(unitName)
    }
}
