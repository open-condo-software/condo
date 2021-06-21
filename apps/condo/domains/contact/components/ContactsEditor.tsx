import React, { useCallback, useState, useMemo, useRef, useEffect } from 'react'
import { Contact } from '@condo/domains/contact/utils/clientSchema'
import { Contact as TContact } from '@condo/domains/contact/schema'
import { Input, Row, Col, Select, Typography, Radio, Form, FormInstance, Skeleton } from 'antd'
import { Button } from '@condo/domains/common/components/Button'
import { PhoneInput } from '@condo/domains/common/components/PhoneInput'
import { BaseSearchInput } from '@condo/domains/common/components/BaseSearchInput'
import { green, grey } from '@ant-design/colors'
import { OptionProps } from 'antd/lib/mentions'
import { useIntl } from '@core/next/intl'
import { PlusCircleFilled, MinusCircleFilled } from '@ant-design/icons'
import { find, get, pick, has } from 'lodash'
import { useTicketValidations } from '@condo/domains/ticket/components/BaseTicketForm/useTicketValidations'
import styled from '@emotion/styled'
import { useApolloClient } from '@core/next/apollo'
import { searchContacts } from '@condo/domains/ticket/utils/clientSchema/search'

interface ILabelsProps {
    left: React.ReactNode,
    right?: React.ReactNode,
}

/**
 * Displays validation error, but hides form input
 */
const ErrorContainerOfHiddenControl = styled.div`
  .ant-form-item-control-input {
    display: none;
  }
`

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

type ContactValue = ContactFields & {
    id?: string,
}

interface IContactEditorProps {
    form: FormInstance<any>,
    // Customizeable field names of the provided `form`, where editor component will be mounted
    // Fields `clientName` and `clientPhone` are not hardcoded to make this component
    // usable in any form, where contact information fields may be different.
    // Also, this makes usage of the component explicitly, — it's clear, what fields will be set.
    fields: {
        id: string,
        phone: string,
        name: string,
    },
    value?: ContactValue,
    onChange: (contact: ContactFields, isNew: boolean) => void,
    // Contacts for autocomplete will be fetched for specified organization
    organization?: string,
    // Contacts for autocomplete will be fetched for specified property
    property?: string,
    // Contacts for autocomplete will be fetched for specified unit of the property
    unitName?: string,
}

interface IContactsEditorHookArgs {
    // Organization scope for contacts autocomplete and new contact, that can be created
    organization: string,
}

interface IContactsEditorHookResult {
    createContact: (organization: string, property: string, unitName: string) => Promise<void>,
    ContactsEditorComponent: React.FC<IContactEditorProps>,
}

export const useContactsEditorHook = ({ organization }: IContactsEditorHookArgs): IContactsEditorHookResult => {
    // Field value will be initialized only on user interaction.
    // In case of no interaction, no create action will be performed
    const [contactFields, setContactFields] = useState({})
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

    const createContactAction = Contact.useCreate({ }, () => Promise.resolve())

    const handleChangeContact = (values, isNew) => {
        setContactFields(values)
        setShouldCreateContact(isNew)
    }

    const createContact = async (organization, property, unitName) => {
        if (shouldCreateContactRef.current) {
            try {
                return await createContactAction({
                    ...contactFieldsRef.current,
                    organization,
                    property,
                    unitName,
                })
            } catch (e) {
                // Duplicated contacts should be figured out on the client,
                // and "create" action should not be performed.
                // In case of violation of unique constraint on `Contact` table,
                // be silent for a user, but make a record in log.
                if (e.message.match('Contact_uniq')) {
                    console.error(e)
                } else {
                    throw (e)
                }
            }
        }
    }

    const ContactsEditorComponent: React.FC<IContactEditorProps> = useMemo(() => {
        const ContactsEditorWrapper = (props) => (
            <ContactsEditor
                {...props}
                organization={organization}
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
    const { form, fields, value: initialValue, onChange, organization, property, unitName } = props

    const [contacts, setContacts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState()

    const client = useApolloClient()

    searchContacts(client, {
        organizationId: organization,
        propertyId: property ? property : undefined,
        unitName : unitName ? unitName : undefined,
    })
        .then(({ data, loading, error }) => {
            setContacts(data.objs)
            setLoading(loading)
            setError(error)
        })

    Contact.useObjects({
        where: {
            organization: { id: organization },
            property: property ? { id: property } : undefined,
            unitName: unitName || undefined,
        },
    }, {
        fetchPolicy: 'network-only',
    })

    const [selectedContact, setSelectedContact] = useState(null)
    const [value, setValue] = useState(initialValue)
    const [editableFieldsChecked, setEditableFieldsChecked] = useState(false)
    // We need this to keep manually typed information preserved between rerenders
    // with different set of prefetched contacts. For example, when a different unitName is selected,
    // manually typed information should not be lost.
    const [manuallyTypedContact, setManuallyTypedContact] = useState()
    const [displayEditableContactFields, setDisplayEditableContactFields] = useState()
    const intl = useIntl()
    const FullNameLabel = intl.formatMessage({ id: 'contact.Contact.ContactsEditor.Name' })
    const PhoneLabel = intl.formatMessage({ id: 'contact.Contact.ContactsEditor.Phone' })
    const AddNewContactLabel = intl.formatMessage({ id: 'contact.Contact.ContactsEditor.AddNewContact' })
    const AnotherContactLabel = intl.formatMessage({ id: 'contact.Contact.ContactsEditor.AnotherContact' })

    const validations = useTicketValidations()


    // It's not enough to have `value` props of `Input` set.
    useEffect(() => {
        if (initialValue) {
            form.setFieldsValue({
                [fields.id]: initialValue.id,
                [fields.name]: initialValue.name,
                [fields.phone]: initialValue.phone,
            })
        }
    }, [])

    // When `unitName` was changed from outside, selection is not relevant anymore
    useEffect(() => {
        setSelectedContact(null)
    }, [unitName])

    const handleClickOnPlusButton = () => {
        setDisplayEditableContactFields(true)
        setSelectedContact(null)
        setEditableFieldsChecked(true)
    }

    const handleClickOnMinusButton = () => {
        setDisplayEditableContactFields(false)
        setSelectedContact(contacts[0])
        setEditableFieldsChecked(false)
    }

    const handleSelectContact = (contact) => {
        setSelectedContact(contact)
        setEditableFieldsChecked(false)
        triggerOnChange(contact)
    }

    const handleChangeContact = (contact) => {
        // User can manually type phone and name, that will match already existing contact,
        // so, it should be connected with ticket
        const contactFromFetched = find(contacts, { ...contact, unitName })
        const contactToSet = contactFromFetched || contact
        triggerOnChange(contactToSet)
        setManuallyTypedContact(contact)
        setEditableFieldsChecked(true)
        setSelectedContact(null)
    }

    const handleSyncedFieldsChecked = () => {
        setSelectedContact(null)
        setEditableFieldsChecked(true)
    }

    const triggerOnChange = (contact: ContactValue) => {
        form.setFieldsValue({
            [fields.id]: contact.id,
            [fields.name]: contact.name,
            [fields.phone]: contact.phone,
        })
        setValue(contact)
        const isNew = !has(contact, 'id')
        onChange && onChange(contact, isNew)
    }

    if (loading) {
        return (
            <Skeleton/>
        )
    }

    if (error) {
        console.warn(error)
        throw error
    }

    const initialValueIsPresentedInFetchedContacts = contacts && initialValue && initialValue.name && initialValue.phone && find(contacts, initialValue)

    return (
        <Row gutter={[40, 25]}>
            <Col span={24}>
                <Row gutter={[40, 25]}>
                    <Labels
                        left={PhoneLabel}
                        right={FullNameLabel}
                    />
                    {contacts.length === 0 || !unitName ? (
                        <ContactSyncedAutocompleteFields
                            initialValue={initialValue || manuallyTypedContact}
                            onChange={handleChangeContact}
                            contacts={contacts}
                        />
                    ) : (
                        <>
                            {contacts.map((contact, i) => (
                                <ContactOption
                                    key={contact.id}
                                    contact={contact}
                                    onSelect={handleSelectContact}
                                    selected={
                                        selectedContact
                                            ? selectedContact.id === contact.id
                                            : initialValue
                                                ? !editableFieldsChecked && (initialValue.name === contact.name && initialValue.phone === contact.phone)
                                                : !editableFieldsChecked && i === 0
                                    }
                                />
                            ))}
                            <>
                                {(displayEditableContactFields || (initialValue && !initialValueIsPresentedInFetchedContacts)) ? (
                                    <>
                                        <Labels
                                            left={AnotherContactLabel}
                                        />
                                        <ContactSyncedAutocompleteFields
                                            initialValue={initialValue || manuallyTypedContact}
                                            onChange={handleChangeContact}
                                            onChecked={handleSyncedFieldsChecked}
                                            checked={editableFieldsChecked}
                                            contacts={contacts}
                                            displayMinusButton={true}
                                            onClickMinusButton={handleClickOnMinusButton}
                                        />
                                    </>
                                ) : (
                                    <Col span={24}>
                                        <Button
                                            type="link"
                                            style={{
                                                color: green[6],
                                                paddingLeft: '5px',
                                            }}
                                            onClick={handleClickOnPlusButton}
                                            icon={<PlusCircleFilled style={{ color: green[6], fontSize: 21 }}/>}
                                        >
                                            {AddNewContactLabel}
                                        </Button>
                                    </Col>
                                )}
                            </>
                        </>
                    )}
                </Row>
                {/*
                    This is a place for items of external form, this component is embedded into.
                    Why not to use them in place of actual inputs?
                    Because we have many inputs ;)
                    1. Input pairs, imitating radio group for select
                    2. Text inputs for manual typing
                    Logic of displaying `Form.Item`, depending on what is currently selected:
                    radio-like pair, or manual input pair, — will be complex.
                    The simplest solution, i currently know, — is to keep it in one place.
                    So, we use hidden inputs here, but reveal validation errors.
                */}
                <Row gutter={[40, 25]}>
                    <Col span={10}>
                        <Form.Item name={fields.id} hidden>
                            <Input value={get(value, 'id')}/>
                        </Form.Item>
                        <ErrorContainerOfHiddenControl>
                            <Form.Item name={fields.phone} rules={unitName && validations.clientPhone}>
                                <Input value={get(value, 'phone')}/>
                            </Form.Item>
                        </ErrorContainerOfHiddenControl>
                    </Col>
                    <Col span={10}>
                        <ErrorContainerOfHiddenControl>
                            <Form.Item name={fields.name} rules={unitName && validations.clientName}>
                                <Input value={get(value, 'name')}/>
                            </Form.Item>
                        </ErrorContainerOfHiddenControl>
                    </Col>
                    <Col span={2}></Col>
                    <Col span={2}></Col>
                </Row>
            </Col>
        </Row>
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
    onChange: (contact: ContactValue) => void,
    onChecked?: () => void,
    checked?: boolean,
    // Used for autocomplete
    contacts: TContact[],
    displayMinusButton: boolean,
    onClickMinusButton: () => void,
}

/**
 * Synchronized pair of "Phone" and "Name" fields.
 * When a phone will be selected, "Name" field should reflect appropriate value for selected contact
 * And vise-versa.
 * When value in fields are typed, not selected, `onChange` callback will be fired.
 */
const ContactSyncedAutocompleteFields: React.FC<IContactSyncedAutocompleteFieldsProps> = ({ initialValue, onChange, onChecked, checked, contacts, displayMinusButton, onClickMinusButton }) => {
    const [value, setValue] = useState(initialValue)

    const searchContactBy = useCallback(
        (field) => async (query) => {
            return contacts.filter(c => c[field].match(escapeRegex(query)))
        },
        []
    )

    const handleSelectContact = (value: string, option: OptionProps) => {
        setValueAndTriggerOnChange(option.data)
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

    const renderOption = (field) => (item) => {
        return (
            <Select.Option
                style={{ textAlign: 'left', color: grey[6] }}
                key={item.id}
                value={item[field]}
                title={item[field]}
                data={pick(item, ['id', 'name', 'phone'])}
            >
                {item[field]}
            </Select.Option>
        )
    }

    const handleClearContact = () => {
        setValue(null)
    }

    const handleChecked = () => {
        onChecked && onChecked()
    }

    return (
        <>
            <Col span={10}>
                <BaseSearchInput
                    value={get(value, 'phone')}
                    loadOptionsOnFocus={false}
                    search={searchContactBy('phone')}
                    renderOption={renderOption('phone')}
                    onSelect={handleSelectContact}
                    onChange={handleChangeContact('phone')}
                    onClear={handleClearContact}
                    style={{ width: '100%' }}
                />
            </Col>
            <Col span={10}>
                <BaseSearchInput
                    value={get(value, 'name')}
                    loadOptionsOnFocus={false}
                    search={searchContactBy('name')}
                    renderOption={renderOption('name')}
                    onSelect={handleSelectContact}
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
                    <MinusCircleFilled
                        style={{
                            color: green[6],
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
                    style={{ width: '100%', height: '40px' }}
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
                    style={{ marginTop: '8px' }}
                />
            </Col>
            <Col span={2}>
            </Col>
        </>
    )
}
