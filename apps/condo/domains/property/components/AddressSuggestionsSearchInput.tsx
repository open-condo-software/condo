import { grey } from '@ant-design/colors'
import { useAddressApi } from '@condo/domains/common/components/AddressApi'
import { BaseSearchInput } from '@condo/domains/common/components/BaseSearchInput'
import { renderHighlightedPart } from '@condo/domains/common/components/Table/Renders'
import { TextHighlighter } from '@condo/domains/common/components/TextHighlighter'
import { validHouseTypes } from '@condo/domains/property/constants/property'
import styled from '@emotion/styled'
import { useIntl } from '@open-condo/next/intl'
import { notification, Select, SelectProps } from 'antd'
import get from 'lodash/get'
import React, { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react'
import { TSelectedAddressSuggestion } from './types'

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
        async (query: string): Promise<TSelectedAddressSuggestion[]> => {
            try {
                const { suggestions } = await addressApi.getSuggestions(query)
                return suggestions.map(suggestion => {
                    return {
                        text: suggestion.value,
                        value: suggestion.rawValue,
                        isHouse: validHouseTypes.includes(suggestion.data.house_type_full),
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
        (dataItem: TSelectedAddressSuggestion, searchValue) => {
            return (
                <Select.Option
                    style={{ direction: 'rtl', textAlign: 'left', color: grey[6] }}
                    key={JSON.stringify(dataItem)}
                    value={dataItem.text}
                    title={dataItem.text}
                >
                    <TextHighlighter
                        text={dataItem.text}
                        search={searchValue}
                        renderPart={renderHighlightedPart}
                    />
                </Select.Option>
            )
        },
        [],
    )

    const handleOptionSelect = useCallback(
        (value: string, option) => {
            try {
                addressApi.cacheRawAddress(value, option.key)
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
