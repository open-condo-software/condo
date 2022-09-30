import { FilterValue } from 'antd/es/table/interface'
import { TextProps } from 'antd/es/typography/Text'
import { Property } from '@app/condo/schema'

import { getTableCellRenderer } from '@condo/domains/common/components/Table/Renders'
import { isEmpty } from 'lodash'

import { getPropertyAddressParts } from '../helpers'

const ADDRESS_RENDER_POSTFIX_PROPS: TextProps = { type: 'secondary', style: { whiteSpace: 'pre-line' } }

export const getAddressCellRender = (property: Property, DeletedMessage?: string, search?: FilterValue | string) => {
    const { postfix, extraProps, text } = getPropertyAddressParts(property, DeletedMessage)

    return getTableCellRenderer(search, false, postfix, extraProps, ADDRESS_RENDER_POSTFIX_PROPS)(text)
}

export const getManyPropertiesAddressRender = (search: FilterValue) => {
    return function render (intl, properties) {
        const DeletedMessage = intl.formatMessage({ id: 'Deleted' })

        if (isEmpty(properties)) {
            return '—'
        }

        return properties.map((property) => getAddressCellRender(property, DeletedMessage, search))
    }
}