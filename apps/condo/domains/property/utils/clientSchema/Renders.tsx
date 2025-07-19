import { Property } from '@app/condo/schema'
import { Typography } from 'antd'
import { FilterValue } from 'antd/es/table/interface'
import { TextProps } from 'antd/es/typography/Text'
import get from 'lodash/get'
import isArray from 'lodash/isArray'
import isEmpty from 'lodash/isEmpty'
import isInteger from 'lodash/isInteger'

import { getTableCellRenderer } from '@condo/domains/common/components/Table/Renders'
import { getPropertyAddressParts } from '@condo/domains/property/utils/helpers'


const ADDRESS_RENDER_POSTFIX_PROPS: TextProps = { type: 'secondary', style: { whiteSpace: 'pre-line' } }

export const getAddressCellRender = (property: Property, DeletedMessage?: string, search?: FilterValue | string, shortAddress?: boolean) => {
    const { postfix, extraProps, text } = getPropertyAddressParts(property, DeletedMessage)

    if (shortAddress) {
        const isDeleted = !!get(property,  'deletedAt')
        const addressWithoutComma = text.substring(0, text.length - 1)
        return getTableCellRenderer({
            search,
            extraPostfixProps: ADDRESS_RENDER_POSTFIX_PROPS,
            postfix: (isDeleted && DeletedMessage) ? `(${DeletedMessage})` : '',
        })(addressWithoutComma)
    }

    return getTableCellRenderer({ search, postfix, extraHighlighterProps: extraProps, extraPostfixProps: ADDRESS_RENDER_POSTFIX_PROPS })(text)
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

export const getCompactAddressPropertiesRender = (search: FilterValue) => (intl, firstOnesProperties, count, CustomMoreAddressesMessage?) => {
    const DeletedMessage = intl.formatMessage({ id: 'Deleted' })
    const MoreAddressesMessage = CustomMoreAddressesMessage || intl.formatMessage({ id: 'pages.condo.settings.propertyScope.propertiesCount' })
    const AndMessage = intl.formatMessage({ id: 'And' })

    if (!isInteger(count) || count === 0 || !isArray(firstOnesProperties) || isEmpty(firstOnesProperties)) {
        return '—'
    }

    const firstPropertyAddress = getAddressCellRender(firstOnesProperties[0], DeletedMessage, search, true)

    if (firstOnesProperties.length > 0 && count > 0) {
        if (firstOnesProperties.length === 1 && count === 1) {
            return firstPropertyAddress
        } else if (firstOnesProperties.length === 2 && count === 2) {
            const secondPropertyAddress = getAddressCellRender(firstOnesProperties[1], DeletedMessage, search, true)
            return (
                <Typography.Text>
                    {firstPropertyAddress} {AndMessage} {secondPropertyAddress}
                </Typography.Text>
            )
        }

        return (
            <Typography.Text>
                {firstPropertyAddress}
                <br/><Typography.Text type='secondary'>{MoreAddressesMessage}{count - 1}</Typography.Text>
            </Typography.Text>
        )
    }
}

export const getOneAddressAndPropertiesCountRender = (search: FilterValue) => {
    return function render (intl, properties) {
        if (isEmpty(properties) || !isArray(properties)) {
            return '—'
        }

        const firstOnesProperties = properties.slice(0, 2)
        const count = properties.length

        return getCompactAddressPropertiesRender(search)(intl, firstOnesProperties, count)
    }
}
