import { find, get } from 'lodash'
import { Col, Form, FormInstance, Input, Row, Skeleton } from 'antd'
import { PlusCircleFilled } from '@ant-design/icons'
import React, { useEffect, useState } from 'react'
import { useIntl } from '@core/next/intl'
import { useApolloClient } from '@core/next/apollo'
import { searchContacts } from '@condo/domains/ticket/utils/clientSchema/search'
import { Labels } from './Labels'
import { ContactSyncedAutocompleteFields } from './ContactSyncedAutocompleteFields'
import { ContactOption } from './ContactOption'
import { Button } from '@condo/domains/common/components/Button'
import { green } from '@ant-design/colors'
import styled from '@emotion/styled'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { ErrorsWrapper } from '@condo/domains/common/components/ErrorsWrapper'

/**
 * Displays validation error, but hides form input
 */
const ErrorContainerOfHiddenControl = styled.div`
  .ant-form-item-control-input {
    display: none;
  }
`
export type ContactFields = {
    name: string,
    phone: string,
}
export type ContactValue = ContactFields & {
    id?: string,
}

export interface IContactEditorProps {
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

    // Composite scope of organization, property and unitName, used to
    // fetch contacts for autocomplete fields.
    organization?: string,
    role?: Record<string, boolean>,
    property?: string,
    unitName?: string,
    allowLandLine?: boolean;
}

export const ContactsEditor: React.FC<IContactEditorProps> = (props) => {
    const intl = useIntl()
    const FullNameLabel = intl.formatMessage({ id: 'contact.Contact.ContactsEditor.Name' })
    const PhoneLabel = intl.formatMessage({ id: 'contact.Contact.ContactsEditor.Phone' })
    const AddNewContactLabel = intl.formatMessage({ id: 'contact.Contact.ContactsEditor.AddNewContact' })
    const AnotherContactLabel = intl.formatMessage({ id: 'contact.Contact.ContactsEditor.AnotherContact' })
    const CannotCreateContactMessage = intl.formatMessage({ id: 'contact.Contact.ContactsEditor.CannotCreateContact' })

    const { form, fields, value: initialValue, onChange, organization, role, property, unitName, allowLandLine } = props

    const [contacts, setContacts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState()
    const client = useApolloClient()

    searchContacts(client, {
        organizationId: organization,
        propertyId: property ? property : undefined,
        unitName: unitName ? unitName : undefined,
    })
        .then(({ data, loading, error }) => {
            setContacts(data.objs)
            setLoading(loading)
            setError(error)
        })

    const [selectedContact, setSelectedContact] = useState(null)
    const [value, setValue] = useState(initialValue)
    const [editableFieldsChecked, setEditableFieldsChecked] = useState(false)
    // We need this to keep manually typed information preserved between rerenders
    // with different set of prefetched contacts. For example, when a different unitName is selected,
    // manually typed information should not be lost.
    const [manuallyTypedContact, setManuallyTypedContact] = useState()
    const [displayEditableContactFields, setDisplayEditableContactFields] = useState(false)

    const { phoneValidator } = useValidations({ allowLandLine })
    const validations = {
        phone: [phoneValidator],
    }

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
        const isNew = !contact.id
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

    const sameAsInitial = (contact) => (
        initialValue && initialValue.name === contact.name && initialValue.phone === contact.phone
    )

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
                                            : !editableFieldsChecked && (sameAsInitial(contact) || !initialValue && i === 0)
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
                                        {(!get(role, 'canManageContacts')) && (
                                            <Col span={24}>
                                                <ErrorsWrapper>
                                                    {CannotCreateContactMessage}
                                                </ErrorsWrapper>
                                            </Col>
                                        )}
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
                                            icon={<PlusCircleFilled style={{
                                                color: green[6],
                                                fontSize: 21,
                                                position: 'relative',
                                                top: '2px',
                                            }}/>}
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
                            <Form.Item
                                name={fields.phone}
                                validateFirst
                                rules={validations.phone}>
                                <Input value={get(value, 'phone')}/>
                            </Form.Item>
                        </ErrorContainerOfHiddenControl>
                    </Col>
                    <Col span={10}>
                        <ErrorContainerOfHiddenControl>
                            <Form.Item name={fields.name}>
                                <Input value={get(value, 'name')}/>
                            </Form.Item>
                        </ErrorContainerOfHiddenControl>
                    </Col>
                    <Col span={2}/>
                    <Col span={2}/>
                </Row>
            </Col>
        </Row>
    )
}
