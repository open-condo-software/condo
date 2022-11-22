import { grey } from '@ant-design/colors'
import { useAddressApi } from '@condo/domains/common/components/AddressApi'
import { BaseSearchInput } from '@condo/domains/common/components/BaseSearchInput'
import { Highlighter } from '@condo/domains/common/components/Highlighter'
import { colors } from '@condo/domains/common/constants/style'
import styled from '@emotion/styled'
import { useIntl } from '@open-condo/next/intl'
import { notification, Select, SelectProps, Typography } from 'antd'
import get from 'lodash/get'
import identity from 'lodash/identity'
import pickBy from 'lodash/pickBy'
import React, { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react'

/*
    Fixes visual overlapping of close-button with text
    It cannot be extracted into global styles, because selects
    with custom components have different markup
*/
const BaseSearchInputWrapper = styled.div`
  .ant-select-allow-clear {
    &:hover {
      .ant-select-selection-search {
        /* This value fits to any size of select */
        padding-right: 24px;
      }
    }
  }
`

interface AddressSearchInputProps extends SelectProps<string> {
    setAddressValidatorError?: Dispatch<SetStateAction<string>>
    addressValidatorError?: string
}

export const AddressSuggestionsSearchInput: React.FC<AddressSearchInputProps> = (props) => {
    const { setAddressValidatorError, addressValidatorError } = props
    const intl = useIntl()
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })
    const AddressMetaError = intl.formatMessage({ id: 'errors.AddressMetaParse' })
    const AddressNotSelected = intl.formatMessage({ id: 'field.Property.nonSelectedError' })

    const [isMatchSelectedProperty, setIsMatchSelectedProperty] = useState(true)
    useEffect(() => {
        const isAddressNotSelected = get(props, 'setAddressValidatorError') && !isMatchSelectedProperty
        if (isAddressNotSelected) {
            setAddressValidatorError(addressValidatorError)
        } else if (addressValidatorError === AddressNotSelected) {
            setAddressValidatorError(null)
        }
    }, [isMatchSelectedProperty, setAddressValidatorError])

    const { addressApi } = useAddressApi()

    const searchAddress = useCallback(
        async (query: string) => {
            try {
                const { suggestions } = await addressApi.getSuggestions(query)
                return suggestions.map(suggestion => {
                    const cleanedSuggestion = pickBy(suggestion, identity)
                    return {
                        text: suggestion.value,
                        value: JSON.stringify({ ...cleanedSuggestion, address: suggestion.rawValue }),
                    }
                })
            } catch (e) {
                console.warn('Error while trying to fetch suggestions: ', e)
                return []
            }
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

    const handleOptionSelect = useCallback(
        (value: string, option) => {
            try {
                addressApi.cacheAddressMeta(value, JSON.parse(option.key))
            } catch (e) {
                notification.error({
                    message: ServerErrorMsg,
                    description: AddressMetaError,
                })
            }
            props.onSelect && props.onSelect(value, option)
        },
        [],
    )

    return (
        <BaseSearchInputWrapper>
            <BaseSearchInput
                {...props}
                setIsMatchSelectedProperty={setIsMatchSelectedProperty}
                loadOptionsOnFocus={false}
                search={searchAddress}
                renderOption={renderOption}
                onSelect={handleOptionSelect}
                id='addressSuggestionsSearchInput'
            />
        </BaseSearchInputWrapper>

    )
}
