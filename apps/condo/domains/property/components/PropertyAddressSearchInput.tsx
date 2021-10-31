/** @jsx jsx */
import React, { useCallback } from 'react'
import get from 'lodash/get'
import { Select, SelectProps, Typography } from 'antd'

import { Organization, Property } from '@app/condo/schema'
import { useApolloClient } from '@core/next/apollo'
import { grey } from '@ant-design/colors'
import { jsx } from '@emotion/core'

import { BaseSearchInput } from '@condo/domains/common/components/BaseSearchInput'
import { Highlighter } from '@condo/domains/common/components/Highlighter'

import { searchProperty, searchSingleProperty } from '@condo/domains/ticket/utils/clientSchema/search'

import { colors } from '@condo/domains/common/constants/style'

type IAddressSearchInput = SelectProps<string> & {
    organization: Organization
}

export const PropertyAddressSearchInput: React.FC<IAddressSearchInput> = (props) => {
    // TODO(Dimitree):remove ts ignore after useOrganizationTypo
    // @ts-ignore
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
        (query) => {
            const where = {
                address_contains_i: query,
                organization: { id: organizationId },
            }

            return searchProperty(client, where, 'unitsCount_DESC')
        },
        [],
    )

    /**
     * TODO(DOMA-1513) replace HighLighter with apps/condo/domains/common/components/TextHighlighter.tsx and renderHighlightedPart
     */
    const renderOption = useCallback(
        (dataItem, searchValue) => {
            return (
                <Select.Option
                    style={{ direction: 'rtl', textAlign: 'left', color: grey[6] }}
                    key={dataItem.value}
                    value={dataItem.text}
                    title={dataItem.text}
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

    return (
        <BaseSearchInput
            {...props}
            id={'propertyAddressSearchInput'}
            search={searchAddress}
            renderOption={renderOption}
            initialValueGetter={initialValueGetter}
        />
    )
}
