import React, { useCallback, useState } from 'react'
import { Contact } from '../../../../schema'
import { AutoComplete, Input, Row, Col, Select, Typography, Radio, SelectProps } from 'antd'
import { Button } from '@condo/domains/common/components/Button'
import { PhoneInput } from '@condo/domains/common/components/PhoneInput'
import { BaseSearchInput } from '../../../common/components/BaseSearchInput'
import { green, grey } from '@ant-design/colors'
import { OptionProps } from 'antd/lib/mentions'
import { useIntl } from '@core/next/intl'
import { PlusCircleFilled } from '@ant-design/icons'

const ILabelsProps = {
    left: React.ReactNode,
    right: React.ReactNode,
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
    const [displayNewContactFields, setDisplayNewContactFields] = useState(false)
    const intl = useIntl()
    const FullNameLabel = intl.formatMessage({ id: 'contact.Contact.ContactSelector.Name' })
    const PhoneLabel = intl.formatMessage({ id: 'contact.Contact.ContactSelector.Phone' })
    const AddNewContactLabel = intl.formatMessage({ id: 'contact.Contact.ContactSelector.AddNewContact' })
    const AnotherContactLabel = intl.formatMessage({ id: 'contact.Contact.ContactSelector.AnotherContact' })

    const handleClickOnPlusButton = () => {
        setDisplayNewContactFields(true)
    }

    const handleChangeNewContact = (contact) => {
        props.onChange && props.onChange(contact, true)
    }

    const handleSelectContact = (contact) => {
        props.onChange && props.onChange(contact, false)
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
                    {props.contacts.map(contact => (
                        <ContactSelectFields
                            key={contact.id}
                            value={contact}
                            onSelect={handleSelectContact}
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
function escapeRegex(string) {
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

interface IContactSelectFieldsProps {
    value?: Contact,
    onChange?: (contact: ContactFields) => void,
    onSelect?: (contact: ContactFields) => void,
}

const ContactSelectFields: React.FC<IContactSelectFieldsProps> = ({ value, onChange, onSelect }) => {
    const [contact, setContact] = useState(value && {})

    const searchContactByPhone = useCallback((query) => {
        return SAMPLE_CONTACTS.filter(c => c.phone.match(escapeRegex(query)))
    }, [])

    const handleSelectContactByPhone = (value: string, option: OptionProps) => {
        setContact(option.data)
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
        setContact(null)
    }

    const searchContactByName = useCallback((query) => {
        return SAMPLE_CONTACTS.filter(c => c.name.match(escapeRegex(query)))
    }, [])

    const handleContactByNameSelect = (value: string, option: OptionProps) => {
        setContact(option.data)
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
        setContact(null)
    }

    const handleChangeContact = (field) => (value) => {
        const newContact = {
            ...contact,
            [field]: value,
        }
        setContact(newContact)
        onChange && onChange(newContact)
    }

    const handleSelectContact = () => {
        onSelect && onSelect(value)
    }

    return (
        <>
            <Col span={10}>
                {value ? (
                    <PhoneInput
                        disabled
                        value={value.phone}
                        style={{ width: '100%' }}
                        onChange={handleChangeContact('phone')}
                    />
                ) : (
                    <BaseSearchInput
                        value={contact && contact.phone}
                        loadOptionsOnFocus={false}
                        search={searchContactByPhone}
                        renderOption={renderContactPhoneOption}
                        onSelect={handleSelectContactByPhone}
                        onClear={handleClearContactByPhone}
                        style={{ width: '100%' }}
                    />
                )}
            </Col>
            <Col span={10}>
                {value ? (
                    <Input
                        disabled
                        value={value.name}
                        onChange={handleChangeContact('name')}
                    />
                ) : (
                    <BaseSearchInput
                        value={contact && contact.name}
                        loadOptionsOnFocus={false}
                        search={searchContactByName}
                        renderOption={renderContactNameOption}
                        onSelect={handleContactByNameSelect}
                        onClear={handleClearContactByName}
                        style={{ width: '100%' }}
                    />
                )}
            </Col>
            <Col span={2}>
                <Radio onClick={handleSelectContact}/>
            </Col>
            <Col span={2}>
            </Col>
        </>
    )
}

const ContactFieldsWithAutoComplete = () => {
    const [contact, setContact] = useState()
    const [contactsByPhone, setContactsByPhone] = useState([])
    const [contactsByName, setContactsByName] = useState([])

    const searchContactByPhone = useCallback((query) => {
        setContactsByPhone(SAMPLE_CONTACTS.filter(c => c.phone.match(escapeRegex(query))))
    }, [])

    const handleSelectContactByPhone = (value: string, option: OptionProps) => {
        setContact(option.item)
    }

    const handleClearContactByPhone = () => {
        setContact(null)
    }

    const searchContactByName = useCallback((query) => {
        setContactsByName(SAMPLE_CONTACTS.filter(c => c.name.match(escapeRegex(query))))
    }, [])

    const handleSelectContactByName = (value: string, option: OptionProps) => {
        setContact(option.item)
    }

    const handleClearContactByName = () => {
        setContact(null)
    }

    const renderOptionsBy = useCallback((prop, items) =>
        items.map(item => ({
            value: item[prop],
            item,
        }))
    , [])

    return (
        <Row gutter={[0, 40]}>
            <Col span={11}>
                <AutoComplete
                    allowClear
                    value={contact ? contact.phone : undefined}
                    options={renderOptionsBy('phone', contactsByPhone)}
                    onSelect={handleSelectContactByPhone}
                    onSearch={searchContactByPhone}
                    onClear={handleClearContactByPhone}
                    placeholder="Phone"
                    style={{ width: '100%' }}
                />
            </Col>
            <Col span={11}>
                <AutoComplete
                    allowClear
                    value={contact ? contact.name : undefined}
                    options={renderOptionsBy('name', contactsByName)}
                    onSelect={handleSelectContactByName}
                    onSearch={searchContactByName}
                    onClear={handleClearContactByName}
                    placeholder="Name"
                    style={{ width: '100%' }}
                />
            </Col>
        </Row>
    )
}
