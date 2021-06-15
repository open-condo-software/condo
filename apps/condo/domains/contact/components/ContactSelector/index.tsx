import React, { useCallback, useState } from 'react'
import { Contact } from '../../../../schema'
import { Input, Row, Col, Select, Typography, Radio } from 'antd'
import { Button } from '@condo/domains/common/components/Button'
import { PhoneInput } from '@condo/domains/common/components/PhoneInput'
import { BaseSearchInput } from '../../../common/components/BaseSearchInput'
import { green, grey } from '@ant-design/colors'
import { OptionProps } from 'antd/lib/mentions'
import { useIntl } from '@core/next/intl'
import { PlusCircleFilled } from '@ant-design/icons'

interface ILabelsProps {
    left: React.ReactNode,
    right?: React.ReactNode,
}

const Labels: React.FC<ILabelsProps> = ({ left, right }) => (
    <>
        <Col span={10}>
            <Typography.Text type="secondary">
                {left}
            </Typography.Text>
        </Col>
        <Col span={10}>
            <Typography.Text type="secondary">
                {right}
            </Typography.Text>
        </Col>
        <Col span={2}>
        </Col>
        <Col span={2}>
        </Col>
    </>
)

type ContactFields = Pick<Contact, 'phone' | 'name'>

interface IContactSelector {
    property: string,
    unitName?: string,
    onChange: (contact: ContactFields, isNew: boolean) => void,
    contacts: Contact[],
}

export const ContactSelector: React.FC<IContactSelector> = (props) => {
    const [selectedContact, setSelectedContact] = useState(null)
    const [displayNewContactFields, setDisplayNewContactFields] = useState(false)
    const intl = useIntl()
    const FullNameLabel = intl.formatMessage({ id: 'contact.Contact.ContactSelector.Name' })
    const PhoneLabel = intl.formatMessage({ id: 'contact.Contact.ContactSelector.Phone' })
    const AddNewContactLabel = intl.formatMessage({ id: 'contact.Contact.ContactSelector.AddNewContact' })
    const AnotherContactLabel = intl.formatMessage({ id: 'contact.Contact.ContactSelector.AnotherContact' })

    const handleClickOnPlusButton = () => {
        setDisplayNewContactFields(true)
        setSelectedContact(null)
    }

    const handleSelectContact = (contact) => {
        setSelectedContact(contact)
        props.onChange && props.onChange(contact, false)
    }

    const handleChangeNewContact = (contact) => {
        props.onChange && props.onChange(contact, true)
    }

    const handleSyncedFieldsChecked = (contact) => {
        setSelectedContact(null)
    }

    return (
        <Row gutter={[40, 25]}>
            <Labels
                left={PhoneLabel}
                right={FullNameLabel}
            />
            {props.contacts.length === 0 ? (
                <ContactSelectFields/>
            ) : (
                <>
                    {props.contacts.map((contact, i) => (
                        <ContactOption
                            key={contact.id}
                            contact={contact}
                            onSelect={handleSelectContact}
                            selected={selectedContact ? selectedContact.id === contact.id : !displayNewContactFields && i === 0 }
                        />
                    ))}
                    <>
                        {displayNewContactFields ? (
                            <>
                                <Labels
                                    left={AnotherContactLabel}
                                />
                                <ContactSelectFields
                                    onChange={handleChangeNewContact}
                                    onChecked={handleSyncedFieldsChecked}
                                    checked={!selectedContact}
                                />
                            </>
                        ) : (
                            <Button
                                type="link"
                                style={{ color: green[6] }}
                                onClick={handleClickOnPlusButton}
                                icon={<PlusCircleFilled style={{ color: green[6], fontSize: 21 }}/>}
                            >
                                {AddNewContactLabel}
                            </Button>
                        )}
                    </>
                </>
            )}
        </Row>
    )
}

const SAMPLE_CONTACTS =  [
    { id: '1', name: 'Anton', phone: '+79991112233' },
    { id: '2', name: 'Andrey', phone: '+79992223344' },
    { id: '3', name: 'Alexey', phone: '+79993334455' },
]

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
    return string.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
}

interface IContactSelectFieldsProps {
    value?: Contact,
    onChange?: (contact: ContactFields) => void,
    onChecked?: (contact: ContactFields) => void,
    checked: boolean,
}

/**
 * Synchronized pair of "Phone" and "Name" fields.
 * When a phone will be selected, "Name" field should reflect appropriate value for selected contact
 * And vise-versa.
 * When values in fields are typed, not selected, `onChange` callback will be fired.
 *
 * @param value
 * @param onChange
 * @param onSelect
 * @constructor
 */
const ContactSelectFields: React.FC<IContactSelectFieldsProps> = ({value, onChange, onChecked, checked }) => {
    const [selectedContact, setSelectedContact] = useState(value && {})
    const [fieldValues, setFieldValues] = useState(value && {})

    const searchContactByPhone = useCallback((query) => {
        return SAMPLE_CONTACTS.filter(c => c.phone.match(escapeRegex(query)))
    }, [])

    const handleSelectContactByPhone = (value: string, option: OptionProps) => {
        setSelectedContact(option.data)
    }

    const renderContactPhoneOption = useCallback(
        (item) => {
            return (
                <Select.Option
                    style={{ textAlign: 'left', color: grey[6] }}
                    key={item.id}
                    value={item.phone}
                    title={item.phone}
                    data={item}
                >
                    {item.phone}
                </Select.Option>
            )
        }, [])

    const handleClearContactByPhone = () => {
        setSelectedContact(null)
    }

    const searchContactByName = useCallback((query) => {
        return SAMPLE_CONTACTS.filter(c => c.name.match(escapeRegex(query)))
    }, [])

    const handleContactByNameSelect = (value: string, option: OptionProps) => {
        setSelectedContact(option.data)
    }

    const renderContactNameOption = useCallback(
        (item) => {
            return (
                <Select.Option
                    style={{ textAlign: 'left', color: grey[6] }}
                    key={item.id}
                    value={item.name}
                    title={item.name}
                    data={item}
                >
                    {item.name}
                </Select.Option>
            )
        }, [])

    const handleClearContactByName = () => {
        setSelectedContact(null)
    }

    const handleChecked = () => {
        onChecked && onChecked(value)
    }

    const handleChange = (field, value) => {
        const newValues = {
            ...fieldValues,
            [field]: value,
        }
        setFieldValues(newValues)
        onChange(newValues)
    }

    return (
        <>
            <Col span={10}>
                <BaseSearchInput
                    value={selectedContact ? selectedContact.phone : undefined}
                    loadOptionsOnFocus={false}
                    search={searchContactByPhone}
                    renderOption={renderContactPhoneOption}
                    onSelect={handleSelectContactByPhone}
                    onChange={handleChange}
                    onClear={handleClearContactByPhone}
                    style={{ width: '100%' }}
                />
            </Col>
            <Col span={10}>
                <BaseSearchInput
                    value={selectedContact ? selectedContact.name : undefined}
                    loadOptionsOnFocus={false}
                    search={searchContactByName}
                    renderOption={renderContactNameOption}
                    onSelect={handleContactByNameSelect}
                    onClear={handleClearContactByName}
                    style={{ width: '100%' }}
                />
            </Col>
            <Col span={2}>
                <Radio
                    onClick={handleChecked}
                    checked={checked}
                />
            </Col>
            <Col span={2}>
            </Col>
        </>
    )
}

interface IContactFieldsDisplayProps {
    contact: Contact,
    onSelect: (contact: Contact) => void,
    selected: boolean,
}

const ContactOption: React.FC<IContactFieldsDisplayProps> = ({ contact, onSelect, selected }) => {
    const handleSelect = () => {
        onSelect(contact)
    }

    return (
        <>
            <Col span={10}>
                <PhoneInput
                    disabled
                    value={contact.phone}
                    style={{ width: '100%' }}
                />
            </Col>
            <Col span={10}>
                <Input
                    disabled
                    value={contact.name}
                />
            </Col>
            <Col span={2}>
                <Radio
                    onClick={handleSelect}
                    checked={selected}
                />
            </Col>
            <Col span={2}>
            </Col>
        </>
    )
}
