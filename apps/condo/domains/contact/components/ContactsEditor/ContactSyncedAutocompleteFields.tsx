import { jsx } from '@emotion/core'
import React, { useCallback, useState } from 'react'
import { OptionProps } from 'antd/lib/mentions'
import { AutoComplete, Col, Radio, Select, Typography } from 'antd'
import { colors } from '@condo/domains/common/constants/style'
import { get } from 'lodash'
import { MinusCircleOutlined } from '@ant-design/icons'
import { Contact as TContact } from '@condo/domains/contact/schema'
import { useApolloClient } from '@core/next/apollo'
import { BaseSearchInput } from '@condo/domains/common/components/BaseSearchInput'
import { searchContactsByPhone, searchProperty } from '@condo/domains/ticket/utils/clientSchema/search'
import { useOrganization } from '@core/next/organization'
import { Highlighter } from '../../../common/components/Highlighter'
import { QUERY_SPLIT_REGEX } from '../../../common/constants/regexps'
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

    // const searchContactByPhone = useCallback((query) => {
    //     setContactsByPhone(contacts.filter(c => c.phone.match(escapeRegex(query))))
    // }, [contacts])

    const searchContactByName = useCallback((query) => {
        setContactsByName(contacts.filter(c => c.name.match(escapeRegex(query))))
    }, [contacts])

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

    const client = useApolloClient()
    const { organization } = useOrganization()
    const organizationId = get(organization, 'id')

    const searchContactByPhone = useCallback(
        (query, skip) => {
            console.log(query)
            const userInputWords = query
                ? query.split(QUERY_SPLIT_REGEX).map((element) => {
                    return {
                        phone_contains_i: element,
                    }
                })
                : []
            const where = {
                organization: { id: organizationId },
                AND: userInputWords,
            }
            return searchContactByPhone(client, where, 'createdAt_ASC', 10, skip)
        },
        [client, organizationId],
    )

    const renderOption = useCallback(
        (dataItem, searchValue) => {
            return (
                <Select.Option
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


    return (
        <>
            <Col span={10}>
                <BaseSearchInput
                    search={searchContactByPhone}
                    // onPopupScroll={e => console.log(isNeedToLoadNewElements(e, false))}
                    allowClear
                    value={get(value, 'phone')}
                    renderOption={renderOption}
                    // onSelect={handleSelectContact}
                    // onSearch={searchContactByPhone}
                    // onChange={handleChangeContact('phone')}
                    // onClear={handleClearContact}
                    style={{ width: '100%' }}
                >
                    <PhoneInput
                        block
                        compatibilityWithAntAutoComplete={true}
                    />
                </BaseSearchInput>
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