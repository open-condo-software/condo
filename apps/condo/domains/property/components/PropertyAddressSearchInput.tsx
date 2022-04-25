/** @jsx jsx */
import React, { CSSProperties, useCallback } from 'react'
import get from 'lodash/get'
import { Select, SelectProps, Typography } from 'antd'

import { Organization, Property } from '@app/condo/schema'
import { useApolloClient } from '@core/next/apollo'
import { grey } from '@ant-design/colors'
import { jsx } from '@emotion/core'

import { BaseSearchInput } from '@condo/domains/common/components/BaseSearchInput'
import { Highlighter } from '@condo/domains/common/components/Highlighter'
import { QUERY_SPLIT_REGEX } from '@condo/domains/common/constants/regexps'

import { searchProperty, searchSingleProperty } from '@condo/domains/ticket/utils/clientSchema/search'

import { colors } from '@condo/domains/common/constants/style'

type IAddressSearchInput = SelectProps<string> & {
    organization: Organization
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

    /**
     * TODO(DOMA-1513) replace HighLighter with apps/condo/domains/common/components/TextHighlighter.tsx and renderHighlightedPart
     */
    const renderOption = useCallback(
        (dataItem, searchValue) => {
            return (
                <Select.Option
                    style={SELECT_OPTION_STYLE}
                    key={dataItem.value}
                    value={dataItem.text}
                    title={dataItem.text}
                    data-cy={'ticket__property-address-search-option'}
                >
                    {
                        searchValue === dataItem.text
                            ? dataItem.text
                            : (
                                <Highlighter
                                    text={dataItem.text}
                                    search={searchValue}
                                    renderPart={(part, index) => {
                                        return (
                                            <Typography.Text
                                                strong
                                                key={part + index}
                                                style={{ color: colors.black }}
                                            >
                                                {part}
                                            </Typography.Text>
                                        )
                                    }}
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
            id={'propertyAddressSearchInput'}
            search={searchAddress}
            renderOption={renderOption}
            initialValueGetter={initialValueGetter}
            infinityScroll
        />
    ), [organizationId])

    return <MemoizedBaseSearchInput/>
}
