import React, { useCallback, useState, useMemo, useRef, useEffect } from 'react'
import { Contact } from '@condo/domains/contact/utils/clientSchema'
import { Contact as TContact } from '../../../../schema'
import { Input, Row, Col, Select, Typography, Radio, Form, FormInstance } from 'antd'
import { Button } from '@condo/domains/common/components/Button'
import { PhoneInput } from '@condo/domains/common/components/PhoneInput'
import { BaseSearchInput } from '../../../common/components/BaseSearchInput'
import { green, grey } from '@ant-design/colors'
import { OptionProps } from 'antd/lib/mentions'
import { useIntl } from '@core/next/intl'
import { PlusCircleFilled } from '@ant-design/icons'


const SAMPLE_CONTACTS =  [
    { id: '1', name: 'Anton', phone: '+79991112233' },
    { id: '2', name: 'Andrey', phone: '+79992223344' },
    { id: '3', name: 'Alexey', phone: '+79993334455' },
]

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

type ContactFields = {
    name: string,
    phone: string,
}

interface IContactEditorProps {
    form: FormInstance<any>,
    // Field, that should be set in a Form, where editor component will be mounted
    formFields: {
        phone: string,
        name: string,
    },
    onChange: (contact: ContactFields, isNew: boolean) => void,
    contacts: TContact[],
}

interface IContactsEditorHookArgs {
    // Organization scope for contacts autocomplete and new contact, that can be created
    organization: string,
    // Property scope for contacts autocomplete and new contact, that can be created
    property: string,
    // Unit scope for contacts autocomplete and new contact, that can be created
    unitName?: string,
    formFieldsInitialValue: ContactFields,
}

interface IContactsEditorHookResult {
    createContact: () => Promise<void>,
    ContactsEditorComponent: React.FC<IContactEditorProps>,
}

export const useContactsEditorHook = ({ organization, formFieldsInitialValue }: IContactsEditorHookArgs): IContactsEditorHookResult => {
    const [contactFields, setContactFields] = useState(formFieldsInitialValue)
    const [shouldCreateContact, setShouldCreateContact] = useState(false)

    // Closure of `createContact` will be broken, when it will be assigned to another constant outside of this hook
    // Refs are used to keep it

    const contactFieldsRef = useRef(contactFields)
    useEffect(() => {
        contactFieldsRef.current = contactFields
    }, [contactFields])

    const shouldCreateContactRef = useRef(shouldCreateContact)
    useEffect(() => {
        shouldCreateContactRef.current = shouldCreateContact
    }, [shouldCreateContact])

    // eslint-disable-next-line @typescript-eslint/no-empty-function @ts-ignore
    const createContactAction = Contact.useCreate({ }, () => {})

    const handleChangeContact = (values, isNew) => {
        setContactFields(values)
        if (isNew) {
            setShouldCreateContact(true)
        }
    }

    const createContact = async () => {
        if (shouldCreateContactRef.current) {
            await createContactAction({
                ...contactFieldsRef.current,
                organization,
            })
        }
    }

    const ContactsEditorComponent: React.FC<IContactEditorProps> = useMemo(() => {
        const ContactsEditorWrapper = (props) => (
            <ContactsEditor
                {...props}
                contacts={SAMPLE_CONTACTS}
                onChange={handleChangeContact}
            />
        )
        return ContactsEditorWrapper
    }, [])

    return {
        createContact,
        ContactsEditorComponent,
    }
}

export const ContactsEditor: React.FC<IContactEditorProps> = (props) => {
    const [selectedContact, setSelectedContact] = useState(null)
    const [contactFields, setContactFields] = useState()
    const [displayNewContactFields, setDisplayNewContactFields] = useState(false)
    const intl = useIntl()
    const FullNameLabel = intl.formatMessage({ id: 'contact.Contact.ContactsEditor.Name' })
    const PhoneLabel = intl.formatMessage({ id: 'contact.Contact.ContactsEditor.Phone' })
    const AddNewContactLabel = intl.formatMessage({ id: 'contact.Contact.ContactsEditor.AddNewContact' })
    const AnotherContactLabel = intl.formatMessage({ id: 'contact.Contact.ContactsEditor.AnotherContact' })

    const { form, formFields, onChange, contacts } = props

    const handleClickOnPlusButton = () => {
        setDisplayNewContactFields(true)
        setSelectedContact(null)
    }

    const handleSelectContact = (contact) => {
        setSelectedContact(contact)
        triggerOnChange(contact, false)
    }

    const handleChangeNewContact = (contact) => {
        triggerOnChange(contact, true)
    }

    const handleSyncedFieldsChecked = () => {
        setSelectedContact(null)
    }

    const triggerOnChange = (contact, isNew) => {
        form.setFieldsValue({
            clientName: contact.name,
            clientPhone: contact.phone,
        })
        setContactFields(contact)
        onChange && onChange(contact, isNew)
    }

    return (
        <>
            <Row gutter={[40, 25]}>
                <Labels
                    left={PhoneLabel}
                    right={FullNameLabel}
                />
                {contacts.length === 0 ? (
                    <ContactSyncedAutocompleteFields/>
                ) : (
                    <>
                        {contacts.map((contact, i) => (
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
                                    <ContactSyncedAutocompleteFields
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
            {contactFields && (
                <>
                    <Form.Item name={formFields.name} hidden>
                        <Input value={contactFields.name}/>
                    </Form.Item>
                    <Form.Item name={formFields.phone} hidden>
                        <Input value={contactFields.phone}/>
                    </Form.Item>
                </>
            )}
        </>
    )
}

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

interface IContactSyncedAutocompleteFieldsProps {
    initialValue?: TContact,
    onChange?: (contact: ContactFields) => void,
    onChecked?: () => void,
    checked?: boolean,
}

/**
 * Synchronized pair of "Phone" and "Name" fields.
 * When a phone will be selected, "Name" field should reflect appropriate value for selected contact
 * And vise-versa.
 * When values in fields are typed, not selected, `onChange` callback will be fired.
 */
const ContactSyncedAutocompleteFields: React.FC<IContactSyncedAutocompleteFieldsProps> = ({ initialValue, onChange, onChecked, checked }) => {
    const [selectedContact, setSelectedContact] = useState(initialValue)
    const [fieldValues, setFieldValues] = useState(initialValue && {})

    const searchContactByPhone = useCallback(async (query) => {
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

    const searchContactByName = useCallback(async (query) => {
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
        onChecked && onChecked()
    }

    const handleChange = (field) => (value) => {
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
                    onChange={handleChange('phone')}
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
                    onChange={handleChange('name')}
                    onClear={handleClearContactByName}
                    style={{ width: '100%' }}
                />
            </Col>
            <Col span={2}>
                {onChecked && (
                    <Radio
                        onClick={handleChecked}
                        checked={checked}
                    />
                )}
            </Col>
            <Col span={2}>
            </Col>
        </>
    )
}

interface IContactFieldsDisplayProps {
    contact: TContact,
    onSelect: (contact: TContact) => void,
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
