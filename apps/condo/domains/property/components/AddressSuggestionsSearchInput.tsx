import styled from '@emotion/styled'
import { notification, Select, SelectProps } from 'antd'
import get from 'lodash/get'
import React, { CSSProperties, Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { useAddressApi } from '@condo/domains/common/components/AddressApi'
import { BaseSearchInput } from '@condo/domains/common/components/BaseSearchInput'
import { renderHighlightedPart } from '@condo/domains/common/components/Table/Renders'
import { TextHighlighter } from '@condo/domains/common/components/TextHighlighter'
import { TSelectedAddressSuggestion } from '@condo/domains/property/components/BasePropertyForm/types'
import { validHouseTypes } from '@condo/domains/property/constants/property'


const SELECT_OPTION_STYLES: CSSProperties = { direction: 'rtl', textAlign: 'left' }
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
    const ServerErrorMsg = intl.formatMessage({ id: 'serverError' })
    const AddressMetaError = intl.formatMessage({ id: 'errors.addressMetaParse' })
    const AddressNotSelected = intl.formatMessage({ id: 'field.property.nonSelectedError' })

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
                    // TODO(pahaz): we should remove isHouse and use only suggestion.type
                    // TODO(pahaz): we should drop backward compatibility check by house_type_full. Because we add `suggestion.type` check!
                    return {
                        text: suggestion.value,
                        value: suggestion.rawValue,
                        isHouse: suggestion.type === 'building' || validHouseTypes.includes(suggestion.data.house_type_full),
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
                    style={SELECT_OPTION_STYLES}
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
