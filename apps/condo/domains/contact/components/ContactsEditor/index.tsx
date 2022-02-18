import { find, get, debounce } from 'lodash'
import { Col, Form, FormInstance, Input, Row, Skeleton } from 'antd'
import { PlusCircleOutlined } from '@ant-design/icons'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useIntl } from '@core/next/intl'
import { Labels } from './Labels'
import { ContactSyncedAutocompleteFields } from './ContactSyncedAutocompleteFields'
import { ContactOption } from './ContactOption'
import { Button } from '@condo/domains/common/components/Button'
import styled from '@emotion/styled'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { ErrorsWrapper } from '@condo/domains/common/components/ErrorsWrapper'
import { Contact } from '@condo/domains/contact/utils/clientSchema'
import { colors } from '@condo/domains/common/constants/style'

const DEBOUNCE_TIMEOUT = 800

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


    const [selectedContact, setSelectedContact] = useState(null)
    const [value, setValue] = useState(initialValue)
    const [editableFieldsChecked, setEditableFieldsChecked] = useState(false)
    // We need this to keep manually typed information preserved between rerenders
    // with different set of prefetched contacts. For example, when a different unitName is selected,
    // manually typed information should not be lost.
    const [manuallyTypedContact, setManuallyTypedContact] = useState({ id: undefined, name: '', phone: '' })
    const [displayEditableContactFields, setDisplayEditableContactFields] = useState(false)

    const {
        objs: fetchedContacts,
        loading,
        error,
    } = Contact.useObjects({
        where: {
            organization: { id: organization },
            property: { id: property ? property : null },
            unitName: unitName ? unitName : undefined,
        },
        first: 1000,
    })

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
        setSelectedContact(fetchedContacts[0])
        setEditableFieldsChecked(false)
    }

    const handleSelectContact = (contact) => {
        setSelectedContact(contact)
        setEditableFieldsChecked(false)
        triggerOnChange(contact)
    }

    const handleChangeContact = debounce((contact) => {
        // User can manually type phone and name, that will match already existing contact,
        // so, it should be connected with ticket
        const contactFromFetched = find(fetchedContacts, { ...contact, unitName })
        const contactToSet = contactFromFetched || contact
        triggerOnChange(contactToSet)
        setManuallyTypedContact(contact)
        setEditableFieldsChecked(true)
        setSelectedContact(null)
    }, DEBOUNCE_TIMEOUT)

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
        setSelectedContact(contact)
        const isNew = !contact.id
        onChange && onChange(contact, isNew)
    }

    const initialValueIsPresentedInFetchedContacts = fetchedContacts && initialValue && initialValue.name && initialValue.phone && find(fetchedContacts, initialValue)

    const sameAsInitial = (contact) => (
        initialValue && initialValue.name === contact.name && initialValue.phone === contact.phone
    )

    const isContactSelected = useCallback((contact, i) => {
        if (selectedContact) return selectedContact.id === contact.id

        if (!editableFieldsChecked) {
            if (sameAsInitial(contact)) return true

            if (!initialValue && i === 0 && !selectedContact) {
                triggerOnChange(contact)
                return true
            }
        }

        return false
    }, [editableFieldsChecked, initialValue, sameAsInitial, selectedContact, triggerOnChange])

    const contactOptions = useMemo(() => fetchedContacts.map((contact, i) => (
        <ContactOption
            key={contact.id}
            contact={contact}
            onSelect={handleSelectContact}
            selected={isContactSelected(contact, i)}
        />
    )), [fetchedContacts, handleSelectContact, isContactSelected])


    if (loading) {
        return (
            <Skeleton/>
        )
    }

    if (error) {
        console.warn(error)
        throw error
    }

    return (
        <Row gutter={[40, 25]}>
            <Col span={24}>
                <Row gutter={[40, 25]}>
                    <Labels
                        left={PhoneLabel}
                        right={FullNameLabel}
                    />
                    {fetchedContacts.length === 0 || !unitName ? (
                        <ContactSyncedAutocompleteFields
                            initialValue={initialValue || manuallyTypedContact}
                            onChange={handleChangeContact}
                            contacts={fetchedContacts}
                        />
                    ) : (
                        <>
                            {contactOptions}
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
                                            contacts={fetchedContacts}
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
                                                color: colors.black,
                                                paddingLeft: '5px',
                                            }}
                                            onClick={handleClickOnPlusButton}
                                            icon={<PlusCircleOutlined style={{
                                                color: colors.black,
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
