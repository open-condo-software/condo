import { Property } from '@app/condo/schema'
import { FilterValue } from 'antd/es/table/interface'
import { TextProps } from 'antd/es/typography/Text'
import get from 'lodash/get'

import { getAddressDetails } from '@condo/domains/common/utils/helpers'
import { TTextHighlighterProps } from '@condo/domains/common/components/TextHighlighter'
import { getTableCellRenderer } from '@condo/domains/common/components/Table/Renders'

const ADDRESS_RENDER_POSTFIX_PROPS: TextProps = { type: 'secondary', style: { whiteSpace: 'pre-line' } }

export const getAddressRender = (property: Property, DeletedMessage?: string, search?: FilterValue | string) => {
    const isDeleted = !!get(property, 'deletedAt')
    const { streetPart, regionPart, cityPart, settlementPart, areaPart } = getAddressDetails(property)
    const extraProps: Partial<TTextHighlighterProps> = isDeleted && { type: 'secondary' }
    const text = `${streetPart},`
    const deletedMessage = isDeleted && DeletedMessage ? `(${DeletedMessage})\n` : '\n'
    const region = regionPart ? regionPart : ''
    const area = areaPart ? `, ${areaPart}` : ''
    const city = cityPart ? `${region ? ',' : ''} ${cityPart}` : ''
    const settlement = settlementPart ? `, ${settlementPart}` : ''
    const postfix = region + area + settlement + city + deletedMessage

    return getTableCellRenderer(search, false, postfix, extraProps, ADDRESS_RENDER_POSTFIX_PROPS)(text)
}