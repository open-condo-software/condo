import debounce from 'lodash/debounce'
import React, { useCallback, useMemo, useState } from 'react'
import { OptionProps } from 'antd/lib/mentions'
import { AutoComplete, Col, Radio } from 'antd'
import { colors } from '@condo/domains/common/constants/style'
import { get } from 'lodash'
import { MinusCircleOutlined } from '@ant-design/icons'
import { Contact as TContact } from '@condo/domains/contact/schema'
import { isNeedToLoadNewElements } from '../../../common/utils/select.utils'
import { ContactValue } from './index'
import { PhoneInput } from '@condo/domains/common/components/PhoneInput'
import { useIntl } from '@core/next/intl'

/**
 * Prevent crash of `String.match`, when providing a regular expression string value,
 * that containts special characters.
 *
 * @example
 *
 *      someString.match(escapeRegex(value))
 *
 * @see https://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
 */
function escapeRegex (string) {
    return String(string).replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
}

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
}

/**
 * Synchronized pair of "Phone" and "Name" fields.
 * When a phone will be selected, "Name" field should reflect appropriate value for selected contact
 * And vise-versa.
 * When value in fields are typed, not selected, `onChange` callback will be fired.
 */
const ContactSyncedAutocompleteFields: React.FC<IContactSyncedAutocompleteFieldsProps> = ({ refetch, initialQuery, initialValue, onChange, onChecked, checked, contacts, displayMinusButton, onClickMinusButton }) => {
    const intl = useIntl()
    const NamePlaceholder = intl.formatMessage({ id: 'contact.Contact.ContactsEditor.Name.placeholder' })
    const [value, setValue] = useState(initialValue)

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

        await debouncedSearch({
            phone_contains_i: query,
            name_contains_i: contactName,
        })
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
        }))
    , [contacts])

    return (
        <>
            <Col span={10}>
                <AutoComplete
                    allowClear
                    value={get(value, 'phone')}
                    options={renderOptionsBy('phone')}
                    onSelect={handleSelectContact}
                    onSearch={searchContactByPhone}
                    onChange={handleChangeContact('phone')}
                    onClear={handleClearContact}
                    style={{ width: '100%' }}
                >
                    <PhoneInput
                        block
                        compatibilityWithAntAutoComplete={true}
                    />
                </AutoComplete>
            </Col>
            <Col span={10}>
                <AutoComplete
                    allowClear
                    placeholder={NamePlaceholder}
                    value={get(value, 'name')}
                    options={renderOptionsBy('name')}
                    onSelect={handleSelectContact}
                    onSearch={searchContactByName}
                    onChange={handleChangeContact('name')}
                    onClear={handleClearContact}
                    style={{ width: '100%' }}
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
    onClickMinusButton: () => {},
    contacts: [],
}

export {
    ContactSyncedAutocompleteFields,
}