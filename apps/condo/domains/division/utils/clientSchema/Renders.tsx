import React from 'react'
import { Property } from '@app/condo/schema'
import { FilterValue } from 'antd/es/table/interface'
import { TextProps } from 'antd/es/typography/Text'
import { getTableCellRenderer } from '@condo/domains/common/components/Table/Renders'
import { getPropertyAddressParts } from '@condo/domains/property/utils/helpers'

const ADDRESS_RENDER_POSTFIX_PROPS: TextProps = { type: 'secondary', style: { whiteSpace: 'pre-line' } }

export const getAddressCellRender = (property: Property, DeletedMessage?: string, search?: FilterValue | string) => {
    const { postfix, extraProps, text } = getPropertyAddressParts(property, DeletedMessage)

    return getTableCellRenderer(search, false, postfix, extraProps, ADDRESS_RENDER_POSTFIX_PROPS)(text)
}