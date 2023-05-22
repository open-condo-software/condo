import { PlusCircleOutlined } from '@ant-design/icons'
import { BuildingUnitSubType, Contact as ContactType } from '@app/condo/schema'
import styled from '@emotion/styled'
import { Col, Form, FormInstance, Row, Tabs } from 'antd'
import { Gutter } from 'antd/lib/grid/row'
import debounce from 'lodash/debounce'
import find from 'lodash/find'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import isFunction from 'lodash/isFunction'
import React, { CSSProperties, useCallback, useEffect, useMemo, useState } from 'react'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { useIntl } from '@open-condo/next/intl'

import Input from '@condo/domains/common/components/antd/Input'
import { Button } from '@condo/domains/common/components/Button'
import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import { colors } from '@condo/domains/common/constants/style'
import { Contact } from '@condo/domains/contact/utils/clientSchema'
import { OrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'

import { ContactOption } from './ContactOption'
import { Labels } from './Labels'
import { NEW_CONTACT_PHONE_FORM_ITEM_NAME, NewContactFields } from './NewContactFields'
import { NotResidentFields } from './NotResidentFields'

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
export type FieldsType = {
    id: string,
    phone: string,
    name: string,
}

export interface IContactEditorProps {
    form: FormInstance<any>,
    // Customizeable field names of the provided `form`, where editor component will be mounted
    // Fields `clientName` and `clientPhone` are not hardcoded to make this component
    // usable in any form, where contact information fields may be different.
    // Also, this makes usage of the component explicitly, — it's clear, what fields will be set.
    fields: FieldsType,
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
    initialQuery
    hasNotResidentTab?: boolean
}

const ContactsInfoFocusContainer = styled(FocusContainer)`
  position: relative;
  left: ${({ padding }) => padding ? padding : '24px'};
  box-sizing: border-box;
  width: 100%;
`
const { TabPane } = Tabs

const TAB_PANE_ROW_GUTTERS: [Gutter, Gutter] = [15, 25]
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

export enum CONTACT_TYPE {
    RESIDENT = 'resident',
    NOT_RESIDENT = 'notResident',
}

export const ContactsEditor: React.FC<IContactEditorProps> = (props) => {
    const intl = useIntl()
    const FullNameLabel = intl.formatMessage({ id: 'contact.Contact.ContactsEditor.Name' })
    const PhoneLabel = intl.formatMessage({ id: 'contact.Contact.ContactsEditor.Phone' })
    const AddNewContactLabel = intl.formatMessage({ id: 'contact.Contact.ContactsEditor.AddNewContact' })
    const AnotherContactLabel = intl.formatMessage({ id: 'contact.Contact.ContactsEditor.AnotherContact' })
    const TicketFromResidentMessage = intl.formatMessage({ id: 'pages.condo.ticket.title.TicketFromResident' })
    const TicketNotFromResidentMessage = intl.formatMessage({ id: 'pages.condo.ticket.title.TicketNotFromResident' })

    const {
        form,
        fields,
        value: initialValue,
        onChange,
        organization,
        role,
        property,
        unitName,
        unitType,
        hasNotResidentTab = true,
        initialQuery,
    } = props

    const [selectedContact, setSelectedContact] = useState(null)
    const [value, setValue] = useState(initialValue)
    const [editableFieldsChecked, setEditableFieldsChecked] = useState(false)
    // We need this to keep manually typed information preserved between rerenders
    // with different set of prefetched contacts. For example, when a different unitName is selected,
    // manually typed information should not be lost.
    const [manuallyTypedContact, setManuallyTypedContact] = useState({ id: undefined, name: '', phone: '' })
    const [displayEditableContactFields, setDisplayEditableContactFields] = useState(false)
    const [isInitialContactsLoaded, setIsInitialContactsLoaded] = useState<boolean>()
    const [initialContacts, setInitialContacts] = useState<ContactType[]>([])
    const [activeTab, setActiveTab] = useState<CONTACT_TYPE>()

    const initialContactsQuery = useMemo(() => ({
        ...initialQuery,
        property: { id: property ? property : null },
        unitName: unitName ? unitName : undefined,
        unitType: unitType ? unitType : undefined,
    }), [initialQuery, property, unitName, unitType])

    const initialEmployeesQuery = useMemo(() => ({
        ...initialQuery,
    }), [initialQuery, organization])

    const isEmptyInitialValue = useMemo(() => isEmpty(Object.values(initialValue).filter(Boolean)), [])
    const isNotResidentInitialValue = !initialValue.id && initialValue.phone
    const initialTab = hasNotResidentTab && (isEmptyInitialValue || isNotResidentInitialValue) ? CONTACT_TYPE.NOT_RESIDENT : CONTACT_TYPE.RESIDENT
    const initialNotResidentAutoCompleteFieldsValue = !initialValue.id && initialValue

    const {
        objs: fetchedContacts,
        loading: contactsLoading,
        error,
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

    const triggerOnChange = useCallback((contact: ContactValue, isNew: boolean) => {
        form.setFieldsValue({
            [fields.id]: !isNew && get(contact, 'id', null),
            [fields.name]: get(contact, 'name', null),
            [fields.phone]: get(contact, 'phone', null),
        })

        setValue(contact)
        setSelectedContact(contact)
        isFunction(onChange) && onChange(contact, isNew)
    }, [fields.id, fields.name, fields.phone, form, onChange])

    useEffect(() => {
        if (!contactsLoading) {
            form.validateFields([NEW_CONTACT_PHONE_FORM_ITEM_NAME])
        }
    }, [form, unitName, property, contactsLoading, editableFieldsChecked])

    useEffect(() => {
        if (!isInitialContactsLoaded && !contactsLoading) {
            setInitialContacts(fetchedContacts)
            setIsInitialContactsLoaded(true)
        }
    }, [contactsLoading, fetchedContacts, isInitialContactsLoaded])

    // When `unitName` was changed from outside, selection is not relevant anymore
    useEffect(() => {
        triggerOnChange(value, true)
        setIsInitialContactsLoaded(false)
        setSelectedContact(null)
    }, [unitName, unitType, property])

    // It's not enough to have `value` props of `Input` set.
    useDeepCompareEffect(() => {
        if (initialValue) {
            triggerOnChange(initialValue, !initialValue.id)
        }
    }, [initialValue])

    useEffect(() => {
        form.setFieldValue('isResidentTicket', activeTab === CONTACT_TYPE.RESIDENT)
    }, [activeTab, fields.id, fields.name, fields.phone, form])

    useEffect(() => {
        if (hasNotResidentTab) {
            if (unitName) {
                setActiveTab(CONTACT_TYPE.RESIDENT)
            } else {
                setActiveTab(CONTACT_TYPE.NOT_RESIDENT)
            }
        } else {
            setActiveTab(CONTACT_TYPE.RESIDENT)
        }
    }, [hasNotResidentTab, unitName])

    useEffect(() => {
        setActiveTab(initialTab)
    }, [initialTab])

    const handleClickOnPlusButton = useCallback(() => {
        form.setFieldsValue({
            [NEW_CONTACT_PHONE_FORM_ITEM_NAME]: null,
        })
        setManuallyTypedContact(null)
        setSelectedContact(null)
        setDisplayEditableContactFields(true)
        setEditableFieldsChecked(true)
    }, [form])

    const handleClickOnMinusButton = useCallback(() => {
        setDisplayEditableContactFields(false)
        if (!selectedContact) {
            triggerOnChange(get(fetchedContacts, 0, null), false)
        }
        setEditableFieldsChecked(false)
    }, [fetchedContacts, selectedContact, triggerOnChange])

    const handleSelectContact = useCallback((contact) => {
        setSelectedContact(contact)
        setEditableFieldsChecked(false)
        triggerOnChange(contact, false)
    }, [triggerOnChange])

    const handleChangeContact = debounce((contact) => {
        // User can manually type phone and name, that will match already existing contact,
        // so, it should be connected with ticket
        const fetchedContact = find(fetchedContacts, { ...get(contact, 'phone'), unitName: unitName || null })
        const contactToSet = fetchedContact || contact

        triggerOnChange(contactToSet, !fetchedContact)

        setManuallyTypedContact(contact)
        setEditableFieldsChecked(true)
        setSelectedContact(null)
    }, DEBOUNCE_TIMEOUT)

    const handleSyncedFieldsChecked = () => {
        setSelectedContact(null)
        setEditableFieldsChecked(true)
    }

    const handleChangeEmployee = debounce((contact) => {
        const employeeContact = { ...contact, id: null }

        triggerOnChange(employeeContact, false)

        setManuallyTypedContact(employeeContact)
        setEditableFieldsChecked(true)
        setSelectedContact(null)
    }, DEBOUNCE_TIMEOUT)

    const initialValueIsPresentedInFetchedContacts = useMemo(() => initialContacts &&
        initialContacts.find(contact => contact.name === get(initialValue, 'name') && contact.phone === get(initialValue, 'phone')),
    [initialContacts, initialValue])

    const isContactSameAsInitial = useCallback((contact) => (
        initialValue && initialValue.name === contact.name && initialValue.phone === contact.phone && initialValue.id === contact.id
    ), [initialValue])

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
        triggerOnChange(null, false)
        setEditableFieldsChecked(false)

        setActiveTab(tab)
    }, [triggerOnChange])

    const className = props.disabled ? 'disabled' : ''

    if (error) {
        console.warn(error)
        throw error
    }

    return (
        <Col span={24}>
            <ContactsInfoFocusContainer className={className}>
                <Tabs
                    defaultActiveKey={activeTab}
                    activeKey={activeTab}
                    style={TABS_STYLE}
                    onChange={handleTabChange}
                >
                    <TabPane tab={TicketFromResidentMessage} key={CONTACT_TYPE.RESIDENT} disabled={!unitName}>
                        <Row gutter={TAB_PANE_ROW_GUTTERS}>
                            <Labels
                                left={PhoneLabel}
                                right={FullNameLabel}
                            />
                            {isEmpty(initialContacts) || !unitName ? (
                                <NewContactFields
                                    onChange={handleChangeContact}
                                    contacts={fetchedContacts}
                                    fields={fields}
                                    activeTab={activeTab}
                                    contactsLoading={contactsLoading}
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
                                                <NewContactFields
                                                    onChange={handleChangeContact}
                                                    onChecked={handleSyncedFieldsChecked}
                                                    checked={editableFieldsChecked}
                                                    contacts={fetchedContacts}
                                                    displayMinusButton={true}
                                                    onClickMinusButton={handleClickOnMinusButton}
                                                    fields={fields}
                                                    activeTab={activeTab}
                                                    contactsLoading={contactsLoading}
                                                />
                                            </>
                                        ) : (
                                            <Col span={24}>
                                                <Button
                                                    type='link'
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
                    {
                        hasNotResidentTab && (
                            <TabPane
                                tab={TicketNotFromResidentMessage}
                                key={CONTACT_TYPE.NOT_RESIDENT}
                            >
                                <Row gutter={TAB_PANE_ROW_GUTTERS}>
                                    <Labels
                                        left={PhoneLabel}
                                        right={FullNameLabel}
                                    />
                                    <NotResidentFields
                                        initialQuery={initialEmployeesQuery}
                                        refetch={refetchEmployees}
                                        initialValue={initialNotResidentAutoCompleteFieldsValue}
                                        onChange={handleChangeEmployee}
                                        employees={fetchedEmployees}
                                        activeTab={activeTab}
                                    />
                                </Row>
                            </TabPane>
                        )
                    }
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
                    {
                        hasNotResidentTab && (
                            <Form.Item name='isResidentTicket' hidden>
                                <Input value={String(activeTab === CONTACT_TYPE.RESIDENT)}/>
                            </Form.Item>
                        )
                    }
                    <Form.Item name={fields.id} hidden>
                        <Input value={get(selectedContact, 'id')}/>
                    </Form.Item>
                    <ErrorContainerOfHiddenControl>
                        <Form.Item
                            name={fields.phone}
                            validateFirst
                        >
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
