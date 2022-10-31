import { Typography } from 'antd'
import { isEmpty } from 'lodash'
import { FilterValue } from 'antd/es/table/interface'
import { TextProps } from 'antd/es/typography/Text'

import { Property } from '@app/condo/schema'

import { getTableCellRenderer } from '@condo/domains/common/components/Table/Renders'
import { getPropertyAddressParts } from '@condo/domains/property/utils/helpers'

const ADDRESS_RENDER_POSTFIX_PROPS: TextProps = { type: 'secondary', style: { whiteSpace: 'pre-line' } }

export const getAddressCellRender = (property: Property, DeletedMessage?: string, search?: FilterValue | string, shortAddress?: boolean) => {
    const { postfix, extraProps, text } = getPropertyAddressParts(property, DeletedMessage)

    if (shortAddress) {
        const addressWithoutComma = text.substring(0, text.length - 1)
        return getTableCellRenderer(search, false, null, null, ADDRESS_RENDER_POSTFIX_PROPS)(addressWithoutComma)
    }

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

export const geOneAddressAndPropertiesCountRender = (search: FilterValue) => {
    return function render (intl, properties) {
        const DeletedMessage = intl.formatMessage({ id: 'Deleted' })
        const MoreAddressesMessage = intl.formatMessage({ id: 'pages.condo.settings.propertyScope.propertiesCount' })
        const AndMessage = intl.formatMessage({ id: 'And' })

        if (isEmpty(properties)) {
            return '—'
        }
        const firstPropertyAddress = getAddressCellRender(properties[0], DeletedMessage, search, true)

        if (properties.length > 0) {
            if (properties.length === 1) {
                return firstPropertyAddress
            } else if (properties.length === 2) {
                const secondPropertyAddress = getAddressCellRender(properties[1], DeletedMessage, search, true)
                return (
                    <Typography.Text>
                        {firstPropertyAddress} {AndMessage} {secondPropertyAddress}
                    </Typography.Text>
                )
            }

            return (
                <Typography.Text>
                    {firstPropertyAddress} <Typography.Text type='secondary'>{MoreAddressesMessage}{properties.length - 1}</Typography.Text>
                </Typography.Text>
            )
        }
    }
}