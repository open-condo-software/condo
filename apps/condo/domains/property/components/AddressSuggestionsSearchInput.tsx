import { notification, Select, SelectProps } from 'antd'
import { OptionProps } from 'antd/lib/mentions'
import React, { useCallback } from 'react'
import identity from 'lodash/identity'
import pickBy from 'lodash/pickBy'
import { useMemo } from 'react'
import { AddressApi, AddressMetaCache } from '@condo/domains/common/utils/addressApi'
import { BaseSearchInput, preDashedSelectOptionsStyles } from '@condo/domains/common/components/BaseSearchInput'
import { useIntl } from '@core/next/intl'

type IAddressSearchInput = SelectProps<string>

export const AddressSuggestionsSearchInput: React.FC<IAddressSearchInput> = (props) => {
    const intl = useIntl()
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })
    const AddressMetaError = intl.formatMessage({ id: 'errors.AddressMetaParse' })

    const api = useMemo(
        () => {
            return new AddressApi()
        },
        [],
    )

    const searchAddress = React.useCallback(
        async (query: string) => {
            const { suggestions } = await api.getSuggestions(query)

            return suggestions.map(suggestion => {
                const cleanedSuggestion = pickBy(suggestion, identity)

                return {
                    text: suggestion.value,
                    value: JSON.stringify({ ...cleanedSuggestion, address: suggestion.value }),
                }
            })
        },
        [],
    )

    const renderOption = useCallback(
        dataItem => (
            <Select.Option
                css={preDashedSelectOptionsStyles}
                key={dataItem.value}
                value={dataItem.text}
                title={dataItem.text}
            >
                {dataItem.text}
            </Select.Option>
        ),
        [],
    )

    const handleOptionSelect = useCallback(
        (value: string, option: OptionProps) => {
            try {
                const parsedAddressMeta = JSON.parse(option.key)
                AddressMetaCache.set(value, parsedAddressMeta)
            } catch (e) {
                notification.error({
                    message: ServerErrorMsg,
                    description: AddressMetaError,
                })
            }
        },
        [],
    )

    return (
        <BaseSearchInput
            search={searchAddress}
            renderOption={renderOption}
            onSelect={handleOptionSelect}
            {...props}
        />
    )
}
