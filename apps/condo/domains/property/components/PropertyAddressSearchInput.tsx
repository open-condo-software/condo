import { grey } from '@ant-design/colors'
import { Property } from '@app/condo/schema'
import { Select, SelectProps } from 'antd'
import React, { CSSProperties, useCallback, useMemo } from 'react'

import { Building } from '@open-condo/icons'
import { useApolloClient } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { BaseSearchInput } from '@condo/domains/common/components/BaseSearchInput'
import { LinkWithIcon } from '@condo/domains/common/components/LinkWithIcon'
import { renderHighlightedPart } from '@condo/domains/common/components/Table/Renders'
import { TextHighlighter } from '@condo/domains/common/components/TextHighlighter'
import { QUERY_SPLIT_REGEX } from '@condo/domains/common/constants/regexps'
import { searchProperty, searchSingleProperty } from '@condo/domains/ticket/utils/clientSchema/search'


type IAddressSearchInput = SelectProps<string> & {
    organizationId: string
}

const SELECT_OPTION_STYLE: CSSProperties = { direction: 'rtl', textAlign: 'left', color: grey[6] }

export const PropertyAddressSearchInput: React.FC<IAddressSearchInput> = (props) => {
    const intl = useIntl()
    const NotFoundDefaultMessage = intl.formatMessage({ id: 'field.Address.notFound.default' })
    const NotFountDefaultLinkMessage = intl.formatMessage({ id: 'field.Address.notFound.default.link' })

    const { organizationId, disabled, notFoundContent: propsNotFoundContent } = props
    const client = useApolloClient()
    const initialValueGetter = useCallback(
        (value) => {
            return searchSingleProperty(client, value, organizationId).then((property: Property) => {
                if (property) {
                    return property.address
                }
            })
        },
        [client, organizationId],
    )

    const searchAddress = useCallback(
        (query, skip) => {
            const userInputWords = query
                ? query.split(QUERY_SPLIT_REGEX).map((element) => {
                    return {
                        address_contains_i: element,
                    }
                })
                : []
            const where = {
                organization: { id: organizationId },
                AND: userInputWords,
            }
            return searchProperty(client, where, 'address_ASC', 10, skip)
        },
        [client, organizationId],
    )

    const renderOption = useCallback(
        (dataItem, searchValue) => {
            return (
                <Select.Option
                    style={SELECT_OPTION_STYLE}
                    key={dataItem.value}
                    value={dataItem.text}
                    title={dataItem.text}
                    data-cy='ticket__property-address-search-option'
                >
                    {
                        searchValue === dataItem.text
                            ? dataItem.text
                            : (
                                <TextHighlighter
                                    text={dataItem.text}
                                    search={searchValue}
                                    renderPart={renderHighlightedPart}
                                />
                            )
                    }
                </Select.Option>
            )
        },
        [],
    )

    const notFoundContent = useMemo(() => {
        if (propsNotFoundContent) return propsNotFoundContent

        return (
            <div>
                <Typography.Text type='secondary' size='medium'>
                    {NotFoundDefaultMessage}
                </Typography.Text>
                &nbsp;
                <LinkWithIcon
                    title={NotFountDefaultLinkMessage}
                    size='medium'
                    PostfixIcon={Building}
                    href='/property'
                    target='_blank'
                />
            </div>
        )
    }, [NotFoundDefaultMessage, NotFountDefaultLinkMessage, propsNotFoundContent])

    const MemoizedBaseSearchInput = useCallback(() => (
        <BaseSearchInput
            {...props}
            id='propertyAddressSearchInput'
            search={searchAddress}
            renderOption={renderOption}
            initialValueGetter={initialValueGetter}
            infinityScroll
            notFoundContent={notFoundContent}
        />
    ), [organizationId, disabled, notFoundContent])

    return <MemoizedBaseSearchInput/>
}
