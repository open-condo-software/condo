import { notification, Select, SelectProps, Typography } from 'antd'
import { OptionProps } from 'antd/lib/mentions'
import React, { useCallback } from 'react'
import identity from 'lodash/identity'
import pickBy from 'lodash/pickBy'
import { BaseSearchInput } from '@condo/domains/common/components/BaseSearchInput'
import { useIntl } from '@core/next/intl'
import { Highliter } from '@condo/domains/common/components/Highliter'
import { grey } from '@ant-design/colors'
import { colors } from '@condo/domains/common/constants/style'
import { useAddressApi } from '@condo/domains/common/components/AddressApi'

type IAddressSearchInput = SelectProps<string>

export const AddressSuggestionsSearchInput: React.FC<IAddressSearchInput> = (props) => {
    const intl = useIntl()
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })
    const AddressMetaError = intl.formatMessage({ id: 'errors.AddressMetaParse' })

    const { addressApi } = useAddressApi()

    const searchAddress = useCallback(
        async (query: string) => {
            try {
                const { suggestions } = await addressApi.getSuggestions(query)

                return suggestions.map(suggestion => {
                    const cleanedSuggestion = pickBy(suggestion, identity)

                    return {
                        text: suggestion.value,
                        value: JSON.stringify({ ...cleanedSuggestion, address: suggestion.value }),
                    }
                })
            } catch (e) {
                console.warn('Error while trying to fetch suggestions: ', e)
                return []
            }
        },
        [],
    )

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
                                <Highliter
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

    const handleOptionSelect = useCallback(
        (value: string, option: OptionProps) => {
            try {
                addressApi.cacheAddressMeta(value, JSON.parse(option.key))
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
            {...props}
            loadOptionsOnFocus={false}
            search={searchAddress}
            renderOption={renderOption}
            onSelect={handleOptionSelect}
            id={'addressSuggestionsSearchInput'}
        />
    )
}
