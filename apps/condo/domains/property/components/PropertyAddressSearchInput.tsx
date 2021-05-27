import { Select, SelectProps } from 'antd'
import get from 'lodash/get'
import React from 'react'
import { BaseSearchInput, preDashedSelectOptionsStyles } from '@condo/domains/common/components/BaseSearchInput'
import { useApolloClient } from '@core/next/apollo'
import { useOrganization } from '@core/next/organization'
import { searchProperty, searchSingleProperty } from '@condo/domains/ticket/utils/clientSchema/search'
import { Property } from '../../../schema'

type IAddressSearchInput = SelectProps<string>

export const PropertyAddressSearchInput: React.FC<IAddressSearchInput> = (props) => {
    // TODO(Dimitree):remove ts ignore after useOrganizationTypo
    // @ts-ignore
    const { organization } = useOrganization()
    const client = useApolloClient()
    const organizationId = get(organization, 'id')

    const initialValueGetter = React.useCallback(
        (value) => {
            return searchSingleProperty(client, value, organizationId).then((property: Property) => {
                if (property) {
                    return property.address
                }
            })
        },
        [],
    )

    const searchAddress = React.useCallback(
        (query) => searchProperty(organizationId)(client, query),
        [],
    )

    const renderOption = React.useCallback(
        (dataItem) => {
            return (
                <Select.Option
                    css={preDashedSelectOptionsStyles}
                    key={dataItem.value}
                    value={dataItem.text}
                    title={dataItem.text}
                >
                    {dataItem.text}
                </Select.Option>
            )
        },
        [],
    )

    return (
        <BaseSearchInput
            {...props}
            search={searchAddress}
            renderOption={renderOption}
            initialValueGetter={initialValueGetter}
        />
    )
}
