import styled from '@emotion/styled'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Select, Spin, SelectProps, notification, Typography } from 'antd'
import get from 'lodash/get'
import debounce from 'lodash/debounce'
import pickBy from 'lodash/pickBy'
import identity from 'lodash/identity'
import { useIntl } from '@core/next/intl'
import { AddressApi, IAddressApi, AddressMetaCache } from '../utils/addressApi'

const DEBOUNCE_TIMEOUT = 800

const SelectOption = styled(Select.Option)`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  direction: rtl;
  text-align: left;
`

async function searchAddress (api: IAddressApi, query) {
    const { suggestions } = await api.getSuggestions(query)

    return suggestions.map(suggestion => {
        const cleanedSuggestion = pickBy(suggestion, identity)

        return {
            text: suggestion.value,
            value: JSON.stringify({ ...cleanedSuggestion, address: suggestion.value }),
        }
    })
}

type IAddressSearchInput = SelectProps<string>

export const AddressSearchInput: React.FC<IAddressSearchInput> = (props) => {
    const intl = useIntl()
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })
    const AddressMetaError = intl.formatMessage({ id: 'errors.AddressMetaParse' })

    const [selected, setSelected] = useState('')
    const [fetching, setFetching] = useState(false)
    const [isDropDownVisible, setDropDownVisible] = useState(false)
    const [selectInputNode, setSelectInputNode] = useState(null)
    const [data, setData] = useState([])
    const api = useMemo(() => {
        return new AddressApi()
    }, [])

    const options = data.map(dataItem => {
        return (
            <SelectOption
                key={dataItem.value}
                value={dataItem.text}
                title={dataItem.text}
                style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    direction: 'rtl',
                    textAlign: 'left',
                }}
            >
                {dataItem.text}
            </SelectOption>
        )
    })

    const searchSuggestions = useCallback(async (value) => {
        setFetching(true)
        const data = await searchAddress(api, (selected) ? selected + ' ' + value : value)

        setFetching(false)
        setData(data)
    }, [searchAddress])

    const debouncedSearch = useMemo(() => {
        return debounce(searchSuggestions, DEBOUNCE_TIMEOUT)
    }, [searchSuggestions])

    const handleSelect = useCallback((value, option) => {
        try {
            const parsedAddressMeta = JSON.parse(option.key)
            AddressMetaCache.set(value, parsedAddressMeta)
        } catch (e) {
            notification.error({
                message: ServerErrorMsg,
                description: AddressMetaError,
            })
        }

        setSelected(option.children)
    }, [])

    const handleClear = useCallback(() => {
        setSelected('')
    }, [])

    const preventScrollingOnBlur = (event) => {
        // @ts-ignore
        const scrollLeft = event.target.scrollLeft
        setTimeout(() => {
            event.target.scrollLeft = scrollLeft
        }, 0)
    }

    const selectRef = useCallback(node => {
        try {
            if (node !== null) {
                const isSelectMounted = node.updater.isMounted(node)
                if (isSelectMounted) {
                    const addressInput = document.querySelector(`#${props.id}`)

                    setSelectInputNode(addressInput)
                    scrollInputCaretToEnd()
                }
            }
        } catch (e) {
            console.warn('Error while trying to set input element node: ', e)
        }
    }, [])

    const scrollInputCaretToEnd = () => {
        try {
            if (selectInputNode) {
                setTimeout(() => {
                    const len = selectInputNode.value.length;

                    // refs. to: https://www.geeksforgeeks.org/how-to-place-cursor-position-at-end-of-text-in-text-input-field-using-javascript/
                    if (selectInputNode.setSelectionRange) {
                        selectInputNode.blur()
                        selectInputNode.focus()
                        selectInputNode.setSelectionRange(len, len)
                    } else if (selectInputNode.createTextRange) {
                        const t = selectInputNode.createTextRange()
                        t.collapse(true)
                        t.moveEnd('character', len)
                        t.moveStart('character', len)
                        t.select()
                    }
                }, 100)
            }
        } catch (e) {
            console.warn('Error while trying to scroll on input end: ', e)
        }
    }

    useEffect(() => {
        scrollInputCaretToEnd()
    }, [selectInputNode, selected])

    return (
        <Select
            showSearch
            autoFocus
            allowClear
            onSearch={debouncedSearch}
            onSelect={handleSelect}
            onClear={handleClear}
            loading={fetching}
            ref={selectRef}
            notFoundContent={fetching ? <Spin size="small" /> : null}
            // TODO(Dimitreee): remove ts ignore after combobox mode will be introduced after ant update
            // @ts-ignore
            mode={'SECRET_COMBOBOX_MODE_DO_NOT_USE'}
            showArrow={false}
            filterOption={false}
            autoClearSearchValue={false}
            defaultActiveFirstOption={false}
            {...props}
        >
            {options}
        </Select>
    )
}
