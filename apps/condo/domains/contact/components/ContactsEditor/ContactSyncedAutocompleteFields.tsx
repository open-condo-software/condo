import styled from '@emotion/styled'
import debounce from 'lodash/debounce'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { OptionProps } from 'antd/lib/mentions'
import { AutoComplete, Col, Radio } from 'antd'
import { get } from 'lodash'
import { MinusCircleOutlined } from '@ant-design/icons'

import { useIntl } from '@open-condo/next/intl'

import { colors } from '@condo/domains/common/constants/style'
import { Contact as TContact } from '@condo/domains/contact/schema'
import { PhoneInput } from '@condo/domains/common/components/PhoneInput'

import { ContactValue } from './index'

const DEBOUNCE_TIMEOUT_IN_MS = 800

interface IContactSyncedAutocompleteFieldsProps {
    refetch,
    initialQuery?,
    initialValue?: TContact,
    onChange: (contact: ContactValue) => void,
    onChecked?: () => void,
    checked?: boolean,
    // Used for autocomplete
    contacts: TContact[],
    displayMinusButton?: boolean,
    onClickMinusButton?: () => void,
    disableNameWhenPhoneMatches?: boolean,
    unitName?: string
}

const StyledAutoComplete = styled(AutoComplete)<{ disabled?: boolean }>`
  width: 100%;

  &.ant-select-disabled > .ant-select-selector > .ant-select-selection-search > input {
    color: ${colors.black} 
  }
`

/**
 * Synchronized pair of "Phone" and "Name" fields.
 * When a phone will be selected, "Name" field should reflect appropriate value for selected contact
 * And vise-versa.
 * When value in fields are typed, not selected, `onChange` callback will be fired.
 */
const ContactSyncedAutocompleteFields: React.FC<IContactSyncedAutocompleteFieldsProps> = ({
    refetch,
    initialQuery,
    initialValue,
    onChange,
    onChecked,
    checked,
    contacts,
    displayMinusButton,
    onClickMinusButton,
    disableNameWhenPhoneMatches = true,
    unitName,
}) => {
    const intl = useIntl()
    const NamePlaceholder = intl.formatMessage({ id: 'contact.Contact.ContactsEditor.Name.placeholder' })

    const [value, setValue] = useState(initialValue)
    const [searchByPhoneLoading, setSearchByPhoneLoading] = useState<boolean>(true)

    const searchSuggestions = useCallback(
        async (query) => {
            return refetch({
                where: { ...initialQuery, ...query },
            })
        },
        [initialQuery, refetch],
    )

    const debouncedSearch = useMemo(
        () => {
            return debounce(searchSuggestions, DEBOUNCE_TIMEOUT_IN_MS)
        },
        [searchSuggestions],
    )

    const searchContactByPhone = useCallback(async (query) => {
        const contactName = get(value, 'name', undefined)

        setSearchByPhoneLoading(true)
        await debouncedSearch({
            phone_contains_i: query,
            name_contains_i: contactName,
        })
        setSearchByPhoneLoading(false)
    }, [debouncedSearch, value])

    const searchContactByName = useCallback(async (query) => {
        const contactPhone = get(value, 'phone', undefined)

        await debouncedSearch({
            name_contains_i: query,
            phone_contains_i: contactPhone,
        })
    }, [debouncedSearch, value])

    const handleSelectContact = (value: string, option: OptionProps) => {
        setValueAndTriggerOnChange(option.item)
    }

    const handleChangeContact = (field) => (fieldValue) => {
        const newValue = {
            ...value,
            [field]: fieldValue,
        }
        setValueAndTriggerOnChange(newValue)
    }

    const setValueAndTriggerOnChange = (contact) => {
        setValue(contact)
        onChange(contact)
    }

    const handleClearContact = () => {
        setValue(null)
    }

    const handleChecked = () => {
        onChecked && onChecked()
    }

    const renderOptionsBy = useCallback((prop) =>
        contacts.map(contact => ({
            value: contact[prop],
            item: contact,
            children: null,
            key: contact.id,
        }))
    , [contacts])

    const phoneOptions = useMemo(() => renderOptionsBy('phone'), [renderOptionsBy])
    const nameOptions = useMemo(() => renderOptionsBy('name'), [renderOptionsBy])
    const disabledNameAutoComplete = disableNameWhenPhoneMatches && (searchByPhoneLoading || phoneOptions.length > 0)
    const isPhoneFieldFilled = useMemo(() => get(value, 'phone.length') === 12, [value])
    const setContactByPhoneNumber = useCallback(() => {
        if (isPhoneFieldFilled && disabledNameAutoComplete && phoneOptions.length > 0) {
            setValueAndTriggerOnChange(contacts[0])
        }
    }, [contacts, disabledNameAutoComplete, isPhoneFieldFilled, phoneOptions.length, setValueAndTriggerOnChange])

    useEffect(() => {
        const phone = get(value, 'phone')

        if (phone) {
            setSearchByPhoneLoading(true)
            debouncedSearch({
                phone_contains_i: phone,
            })
            setSearchByPhoneLoading(false)

            setContactByPhoneNumber()
        }
    }, [unitName])

    const handlePhoneBlur = useCallback(() => {
        setContactByPhoneNumber()
    }, [setContactByPhoneNumber])

    return (
        <>
            <Col span={10}>
                <StyledAutoComplete
                    allowClear
                    value={get(value, 'phone')}
                    options={phoneOptions}
                    onSelect={handleSelectContact}
                    onSearch={searchContactByPhone}
                    onBlur={handlePhoneBlur}
                    onChange={handleChangeContact('phone')}
                    onClear={handleClearContact}
                >
                    <PhoneInput
                        block
                        compatibilityWithAntAutoComplete={true}
                    />
                </StyledAutoComplete>
            </Col>
            <Col span={10}>
                <StyledAutoComplete
                    allowClear
                    placeholder={NamePlaceholder}
                    value={get(value, 'name')}
                    options={nameOptions}
                    onSelect={handleSelectContact}
                    onSearch={searchContactByName}
                    onChange={handleChangeContact('name')}
                    onClear={handleClearContact}
                    disabled={disabledNameAutoComplete}
                />
            </Col>
            <Col span={2}>
                {onChecked && (
                    <Radio
                        onClick={handleChecked}
                        checked={checked}
                        style={{ marginTop: '8px' }}
                    />
                )}
            </Col>
            <Col span={2}>
                {displayMinusButton && (
                    <MinusCircleOutlined
                        style={{
                            color: colors.black,
                            fontSize: '21px',
                            marginTop: '9px',
                            marginLeft: '-4px',
                        }}
                        onClick={onClickMinusButton}
                    />
                )}
            </Col>
        </>
    )
}

ContactSyncedAutocompleteFields.defaultProps = {
    displayMinusButton: false,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onClickMinusButton: () => {
    },
    contacts: [],
}

export {
    ContactSyncedAutocompleteFields,
}