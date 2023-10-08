/** @jsx jsx */
import { grey } from '@ant-design/colors'
import { Organization, Property } from '@app/condo/schema'
import { jsx } from '@emotion/react'
import { Select, SelectProps } from 'antd'
import get from 'lodash/get'
import React, { CSSProperties, Dispatch, SetStateAction, useCallback } from 'react'

import { useApolloClient } from '@open-condo/next/apollo'


import { BaseSearchInput } from '@condo/domains/common/components/BaseSearchInput'
import { renderHighlightedPart } from '@condo/domains/common/components/Table/Renders'
import { TextHighlighter } from '@condo/domains/common/components/TextHighlighter'
import { QUERY_SPLIT_REGEX } from '@condo/domains/common/constants/regexps'
import { searchProperty, searchSingleProperty } from '@condo/domains/ticket/utils/clientSchema/search'

type IAddressSearchInput = SelectProps<string> & {
    organization: Organization
    setIsMatchSelectedProperty?: Dispatch<SetStateAction<boolean>>
}

const SELECT_OPTION_STYLE: CSSProperties = { direction: 'rtl', textAlign: 'left', color: grey[6] }

export const PropertyAddressSearchInput: React.FC<IAddressSearchInput> = (props) => {
    const { organization } = props
    const client = useApolloClient()
    const organizationId = get(organization, 'id')
    const initialValueGetter = useCallback(
        (value) => {
            return searchSingleProperty(client, value, organizationId).then((property: Property) => {
                if (property) {
                    return property.address
                }
            })
        },
        [],
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

    const MemoizedBaseSearchInput = useCallback(() => (
        <BaseSearchInput
            {...props}
            id='propertyAddressSearchInput'
            eventName='PropertyAddressSearchInput'
            search={searchAddress}
            renderOption={renderOption}
            initialValueGetter={initialValueGetter}
            infinityScroll
        />
    ), [organizationId])

    return <MemoizedBaseSearchInput/>
}
