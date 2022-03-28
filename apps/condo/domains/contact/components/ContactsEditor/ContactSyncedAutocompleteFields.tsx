import React, { useCallback, useState } from 'react'
import { OptionProps } from 'antd/lib/mentions'
import { AutoComplete, Col, Radio } from 'antd'
import { colors } from '@condo/domains/common/constants/style'
import { get } from 'lodash'
import { MinusCircleOutlined } from '@ant-design/icons'
import { Contact as TContact } from '@condo/domains/contact/schema'
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

interface IContactSyncedAutocompleteFieldsProps {
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
const ContactSyncedAutocompleteFields: React.FC<IContactSyncedAutocompleteFieldsProps> = ({ initialValue, onChange, onChecked, checked, contacts, displayMinusButton, onClickMinusButton }) => {
    const intl = useIntl()
    const NamePlaceholder = intl.formatMessage({ id: 'contact.Contact.ContactsEditor.Name.placeholder' })
    const [value, setValue] = useState(initialValue)
    const [contactsByPhone, setContactsByPhone] = useState([])
    const [contactsByName, setContactsByName] = useState([])

    const searchContactByPhone = useCallback((query) => {
        setContactsByPhone(contacts.filter(c => c.phone.match(escapeRegex(query))))
    }, [])

    const searchContactByName = useCallback((query) => {
        setContactsByName(contacts.filter(c => c.name.match(escapeRegex(query))))
    }, [])

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

    const renderOptionsBy = useCallback((prop, items) =>
        items.map(item => ({
            value: item[prop],
            item,
        }))
    , [])

    return (
        <>
            <Col span={10}>
                <AutoComplete
                    allowClear
                    value={get(value, 'phone')}
                    options={renderOptionsBy('phone', contactsByPhone)}
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
                    options={renderOptionsBy('name', contactsByName)}
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