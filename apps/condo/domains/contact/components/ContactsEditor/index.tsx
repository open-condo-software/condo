import React, { CSSProperties, useCallback, useEffect, useMemo, useState } from 'react'
import { Col, Form, FormInstance, Row, Tabs } from 'antd'
import Input from '@condo/domains/common/components/Input'
import { PlusCircleOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { useIntl } from '@core/next/intl'
import { Gutter } from 'antd/lib/grid/row'

import find from 'lodash/find'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import debounce from 'lodash/debounce'

import { Button } from '@condo/domains/common/components/Button'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { ErrorsWrapper } from '@condo/domains/common/components/ErrorsWrapper'
import { Contact } from '@condo/domains/contact/utils/clientSchema'
import { colors } from '@condo/domains/common/constants/style'
import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import { OrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'
import { IContactUIState } from '@condo/domains/contact/utils/clientSchema/Contact'

import { Labels } from './Labels'
import { ContactSyncedAutocompleteFields } from './ContactSyncedAutocompleteFields'
import { ContactOption } from './ContactOption'
import { BuildingUnitSubType } from '@app/condo/schema'

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
    unitType?: BuildingUnitSubType,
    allowLandLine?: boolean,
    disabled?: boolean
}

const ContactsInfoFocusContainer = styled(FocusContainer)`
  position: relative;
  left: ${({ padding }) => padding ? padding : '24px'};
  box-sizing: border-box;
  width: 100%;
  background: ${colors.backgroundLightGrey};
`
const { TabPane } = Tabs

const TAB_PANE_ROW_GUTTERS: [Gutter, Gutter] = [40, 25]
const TABS_STYLE: CSSProperties = { width: '100%' }
const BUTTON_ICON_STYLE: CSSProperties = {
    color: colors.black,
    fontSize: 21,
    position: 'relative',
    top: '2px',
}
const BUTTON_STYLE: CSSProperties = {
    color: colors.black,
    paddingLeft: '5px',
}

enum CONTACT_EDITOR_TABS {
    FROM_RESIDENT = '0',
    NOT_FROM_RESIDENT = '1',
}

export const ContactsEditor: React.FC<IContactEditorProps> = (props) => {
    const intl = useIntl()
    const FullNameLabel = intl.formatMessage({ id: 'contact.Contact.ContactsEditor.Name' })
    const PhoneLabel = intl.formatMessage({ id: 'contact.Contact.ContactsEditor.Phone' })
    const AddNewContactLabel = intl.formatMessage({ id: 'contact.Contact.ContactsEditor.AddNewContact' })
    const AnotherContactLabel = intl.formatMessage({ id: 'contact.Contact.ContactsEditor.AnotherContact' })
    const CannotCreateContactMessage = intl.formatMessage({ id: 'contact.Contact.ContactsEditor.CannotCreateContact' })
    const TicketFromResidentMessage = intl.formatMessage({ id: 'pages.condo.ticket.title.TicketFromResident' })
    const TicketNotFromResidentMessage = intl.formatMessage({ id: 'pages.condo.ticket.title.TicketNotFromResident' })

    const { form, fields, value: initialValue, onChange, organization, role, property, unitName, unitType, allowLandLine } = props
    const isNotContact = useMemo(() => !initialValue.id && initialValue.phone, [initialValue.id, initialValue.phone])

    const [selectedContact, setSelectedContact] = useState(null)
    const [value, setValue] = useState(initialValue)
    const [editableFieldsChecked, setEditableFieldsChecked] = useState(false)
    // We need this to keep manually typed information preserved between rerenders
    // with different set of prefetched contacts. For example, when a different unitName is selected,
    // manually typed information should not be lost.
    const [manuallyTypedContact, setManuallyTypedContact] = useState({ id: undefined, name: '', phone: '' })
    const [displayEditableContactFields, setDisplayEditableContactFields] = useState(false)
    const [isInitialContactsLoaded, setIsInitialContactsLoaded] = useState<boolean>()
    const [initialContacts, setInitialContacts] = useState<IContactUIState[]>([])

    const initialContactsQuery = useMemo(() => ({
        organization: { id: organization },
        property: { id: property ? property : null },
        unitName: unitName ? unitName : undefined,
        unitType: unitType ? unitType : undefined,
    }), [organization, property, unitName, unitType])

    const initialEmployeesQuery = useMemo(() => ({
        organization: { id: organization },
    }), [organization])

    const {
        objs: fetchedContacts,
        loading: contactsLoading,
        error,
        refetch: refetchContacts,
    } = Contact.useObjects({
        where: initialContactsQuery,
        first: 100,
    })

    const {
        objs: fetchedEmployees,
        refetch: refetchEmployees,
    } = OrganizationEmployee.useObjects({
        where: initialEmployeesQuery,
        first: 100,
    })

    const { phoneValidator } = useValidations({ allowLandLine })
    const validations = {
        phone: [phoneValidator],
    }

    useEffect(() => {
        if (!isInitialContactsLoaded && !contactsLoading) {
            setInitialContacts(fetchedContacts)
            setIsInitialContactsLoaded(true)
        }
    }, [contactsLoading, fetchedContacts, isInitialContactsLoaded])

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
        setIsInitialContactsLoaded(false)
        setSelectedContact(null)
        setManuallyTypedContact(null)
    }, [unitName, unitType])

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

    const triggerOnChange = (contact: ContactValue, isNew) => {
        form.setFieldsValue({
            [fields.id]: contact.id,
            [fields.name]: contact.name,
            [fields.phone]: contact.phone,
        })
        setValue(contact)
        setSelectedContact(contact)
        onChange && onChange(contact, isNew)
    }

    const handleSelectContact = (contact) => {
        setSelectedContact(contact)
        setEditableFieldsChecked(false)
        triggerOnChange(contact, false)
    }

    const handleChangeContact = debounce((contact) => {
        // User can manually type phone and name, that will match already existing contact,
        // so, it should be connected with ticket
        const fetchedContact = find(fetchedContacts, { ...contact, unitName: unitName || null })
        const contactToSet = fetchedContact || contact

        triggerOnChange(contactToSet, !fetchedContact)

        setManuallyTypedContact(contact)
        setEditableFieldsChecked(true)
        setSelectedContact(null)
    }, DEBOUNCE_TIMEOUT)

    const handleSyncedFieldsChecked = () => {
        setSelectedContact(null)
        setEditableFieldsChecked(true)

        if (isNotContact) {
            handleChangeContact(initialValue)
        }
    }

    const handleChangeEmployee = debounce((contact) => {
        form.setFieldsValue({
            [fields.id]: null,
            [fields.name]: contact.name,
            [fields.phone]: contact.phone,
        })
        const employeeContact = { ...contact, id: null }

        setValue(employeeContact)
        setManuallyTypedContact(employeeContact)
        setEditableFieldsChecked(true)

        onChange && onChange(employeeContact, false)
    }, DEBOUNCE_TIMEOUT)

    const initialValueIsPresentedInFetchedContacts = useMemo(() => initialContacts
        && initialValue && initialValue.name && initialValue.phone &&
        initialContacts.find(contact => contact.name === initialValue.name && contact.phone === initialValue.phone),
    [initialContacts, initialValue])

    const isContactSameAsInitial = (contact) => (
        initialValue && initialValue.name === contact.name && initialValue.phone === contact.phone && initialValue.id === contact.id
    )

    const isContactSelected = useCallback((contact) => {
        if (selectedContact) return selectedContact.id === contact.id

        if (!editableFieldsChecked) {
            if (isContactSameAsInitial(contact)) return true
        }

        return false
    }, [editableFieldsChecked, isContactSameAsInitial, selectedContact])

    const contactOptions = useMemo(() => initialContacts.map((contact) => (
        <ContactOption
            key={contact.id}
            contact={contact}
            onSelect={handleSelectContact}
            selected={isContactSelected(contact)}
        />
    )), [handleSelectContact, initialContacts, isContactSelected])

    const handleTabChange = useCallback((tab) => {
        setSelectedContact(null)
        setEditableFieldsChecked(false)

        if (tab === CONTACT_EDITOR_TABS.NOT_FROM_RESIDENT) {
            handleChangeEmployee(value)
        }
    }, [handleChangeEmployee, value])

    const className = props.disabled ? 'disabled' : ''

    if (error) {
        console.warn(error)
        throw error
    }

    return (
        <Col span={24}>
            <ContactsInfoFocusContainer className={className}>
                <Tabs
                    defaultActiveKey={isNotContact ? CONTACT_EDITOR_TABS.NOT_FROM_RESIDENT : CONTACT_EDITOR_TABS.FROM_RESIDENT}
                    style={TABS_STYLE}
                    onChange={handleTabChange}
                >
                    <TabPane tab={TicketFromResidentMessage} key={CONTACT_EDITOR_TABS.FROM_RESIDENT}>
                        <Row gutter={TAB_PANE_ROW_GUTTERS}>
                            <Labels
                                left={PhoneLabel}
                                right={FullNameLabel}
                            />
                            {isEmpty(initialContacts) || !unitName ? (
                                <ContactSyncedAutocompleteFields
                                    refetch={refetchContacts}
                                    initialQuery={initialContactsQuery}
                                    initialValue={initialValue.id ? initialValue : manuallyTypedContact}
                                    onChange={handleChangeContact}
                                    contacts={fetchedContacts}
                                />
                            ) : (
                                <>
                                    {contactOptions}
                                    <>
                                        {(displayEditableContactFields || (initialValue.id && !initialValueIsPresentedInFetchedContacts)) ? (
                                            <>
                                                <Labels
                                                    left={AnotherContactLabel}
                                                />
                                                <ContactSyncedAutocompleteFields
                                                    initialQuery={initialContactsQuery}
                                                    refetch={refetchContacts}
                                                    initialValue={initialValue.id ? initialValue : manuallyTypedContact}
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
                                                    style={BUTTON_STYLE}
                                                    onClick={handleClickOnPlusButton}
                                                    icon={<PlusCircleOutlined style={BUTTON_ICON_STYLE}/>}
                                                >
                                                    {AddNewContactLabel}
                                                </Button>
                                            </Col>
                                        )}
                                    </>
                                </>
                            )}
                        </Row>
                    </TabPane>
                    <TabPane
                        tab={TicketNotFromResidentMessage}
                        key={CONTACT_EDITOR_TABS.NOT_FROM_RESIDENT}
                    >
                        <Row gutter={TAB_PANE_ROW_GUTTERS}>
                            <Labels
                                left={PhoneLabel}
                                right={FullNameLabel}
                            />
                            <ContactSyncedAutocompleteFields
                                initialQuery={initialEmployeesQuery}
                                refetch={refetchEmployees}
                                initialValue={!initialValue.id ? initialValue : manuallyTypedContact}
                                onChange={handleChangeEmployee}
                                contacts={fetchedEmployees}
                            />
                        </Row>
                    </TabPane>
                </Tabs>
            </ContactsInfoFocusContainer>

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
            <Row gutter={TAB_PANE_ROW_GUTTERS}>
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
    )
}
