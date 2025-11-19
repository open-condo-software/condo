import { useGetContactEditorContactsQuery, useGetContactEditorOrganizationEmployeesQuery } from '@app/condo/gql'
import { BuildingUnitSubType, Contact as ContactType } from '@app/condo/schema'
import styled from '@emotion/styled'
import { Col, Form, FormInstance, FormItemProps, Row, Tabs } from 'antd'
import { Gutter } from 'antd/lib/grid/row'
import { isNil } from 'lodash'
import debounce from 'lodash/debounce'
import find from 'lodash/find'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import isFunction from 'lodash/isFunction'
import pickBy from 'lodash/pickBy'
import React, { CSSProperties, useCallback, useEffect, useMemo, useState } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { PlusCircle, MinusCircle } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Typography, Button } from '@open-condo/ui'

import Input from '@condo/domains/common/components/antd/Input'
import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { colors } from '@condo/domains/common/constants/style'

import { ContactOption } from './ContactOption'
import { NEW_CONTACT_PHONE_FORM_ITEM_NAME, NEW_CONTACT_NAME_FORM_ITEM_NAME, NewContactFields } from './NewContactFields'
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
    name: string
    phone: string
}
export type ContactValue = ContactFields & {
    id?: string
}
export type FieldsType = {
    id: string
    phone: string
    name: string
}

export interface IContactEditorProps {
    form: FormInstance<any>
    // Customizeable field names of the provided `form`, where editor component will be mounted
    // Fields `clientName` and `clientPhone` are not hardcoded to make this component
    // usable in any form, where contact information fields may be different.
    // Also, this makes usage of the component explicitly, — it's clear, what fields will be set.
    fields: FieldsType
    value?: ContactValue
    onChange?: (contact: ContactFields, isNew: boolean) => void
    // Composite scope of organization, property and unitName, used to
    // fetch contacts for autocomplete fields.
    organization?: string
    property?: string
    unitName?: string
    unitType?: BuildingUnitSubType
    hasNotResidentTab?: boolean
    initialQuery?
    residentTitle?: string
    notResidentTitle?: string
    hideFocusContainer?: boolean
    hideTabBar?: boolean
    contactFormItemProps?: FormItemProps
    newContactPhoneFormItemProps?: FormItemProps
    newContactNameFormItemProps?: FormItemProps
    disabled?: boolean
    initialIsResident?: boolean
}

const ContactsInfoFocusContainer = styled(FocusContainer)`
  position: relative;
  left: ${({ padding }) => padding ? padding : '24px'};
  box-sizing: border-box;
  width: 100%;
`
const { TabPane } = Tabs

const TAB_PANE_ROW_GUTTERS: [Gutter, Gutter] = [0, 24]
const TABS_STYLE: CSSProperties = { width: '100%' }

export enum CONTACT_TYPE {
    RESIDENT = 'resident',
    NOT_RESIDENT = 'notResident',
}

export const ContactsEditor: React.FC<IContactEditorProps> = (props) => {
    const intl = useIntl()
    const AddNewContactLabel = intl.formatMessage({ id: 'contact.Contact.ContactsEditor.AddNewContact' })
    const ResidentMessage = intl.formatMessage({ id: 'Contact' })
    const NotResidentMessage = intl.formatMessage({ id: 'contact.Contact.ContactsEditor.NotResident' })
    const CancelMessage = intl.formatMessage({ id: 'Cancel' })

    const {
        form,
        fields,
        value: initialValue,
        onChange,
        organization,
        property,
        unitName,
        unitType,
        hasNotResidentTab = true,
        initialQuery,
        residentTitle,
        notResidentTitle,
        hideFocusContainer,
        hideTabBar,
        contactFormItemProps,
        newContactPhoneFormItemProps,
        newContactNameFormItemProps,
        disabled,
        initialIsResident,
    } = props

    const [selectedContact, setSelectedContact] = useState(null)
    const [value, setValue] = useState(initialValue)
    const [editableFieldsChecked, setEditableFieldsChecked] = useState(false)
    const [displayEditableContactFields, setDisplayEditableContactFields] = useState(false)
    const [isInitialContactsLoaded, setIsInitialContactsLoaded] = useState<boolean>()
    const [initialContacts, setInitialContacts] = useState<ContactType[]>([])
    const [activeTab, setActiveTab] = useState<CONTACT_TYPE>()

    const { persistor } = useCachePersistor()
    const { breakpoints } = useLayoutContext()
    const { link } = useOrganization()
    const canReadContacts = get(link, ['role', 'canReadContacts'], false)
    const canManageContacts = get(link, ['role', 'canManageContacts'], false)

    const initialContactsQuery = useMemo(() => ({
        ...initialQuery,
        property: { id: property ? property : null },
        unitName: unitName ? unitName : undefined,
        unitType: unitType ? unitType : undefined,
    }), [initialQuery, property, unitName, unitType])

    const initialEmployeesQuery = useMemo(() => ({
        ...initialQuery,
    }), [initialQuery, organization])

    const initialValueWithoutContact = !initialValue.id && initialValue
    const isEmptyInitialNotResidentValue = useMemo(() => isEmpty(Object.values(initialValueWithoutContact).filter(Boolean)), [initialValueWithoutContact])
    
    const initialTab = useMemo(() => {
        if (!hasNotResidentTab) return CONTACT_TYPE.RESIDENT
        if (isNil(unitName)) return CONTACT_TYPE.NOT_RESIDENT

        if (initialIsResident) return CONTACT_TYPE.RESIDENT
        if (initialIsResident === false) return CONTACT_TYPE.NOT_RESIDENT

        if (!canReadContacts && !canManageContacts) return CONTACT_TYPE.NOT_RESIDENT

        return CONTACT_TYPE.RESIDENT
    }, [hasNotResidentTab, canReadContacts, canManageContacts, unitName, initialIsResident])

    const {
        data: contactsData,
        loading: contactsLoading,
        error,
    } = useGetContactEditorContactsQuery({
        variables: {
            where: initialContactsQuery,
        },
        skip: !persistor || !property || !unitName || !unitType,
    })
    const fetchedContacts = useMemo(() => contactsData?.contacts?.filter(Boolean) || [], [contactsData?.contacts])

    const {
        data: employeesData,
        refetch: refetchEmployees,
    } = useGetContactEditorOrganizationEmployeesQuery({
        variables: {
            where: initialEmployeesQuery,
        },
        skip: !persistor,
    })
    const fetchedEmployees = useMemo(() => employeesData?.employees?.filter(Boolean) || [], [employeesData?.employees])

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
        setActiveTab(initialTab)
    }, [initialTab])

    useEffect(() => {
        if (!contactsLoading) {
            form.validateFields([NEW_CONTACT_PHONE_FORM_ITEM_NAME])
        }
    }, [form, unitName, property, contactsLoading, editableFieldsChecked])

    useEffect(() => {
        if (!isInitialContactsLoaded && !contactsLoading) {
            setInitialContacts(fetchedContacts)
            setIsInitialContactsLoaded(true)
            if (isEmpty(pickBy(initialValue))) {
                triggerOnChange(get(fetchedContacts, '0'), false)
            }
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

            if (initialValue?.phone && !initialValue?.id) {
                setEditableFieldsChecked(true)
            }
        }
    }, [initialValue])

    useEffect(() => {
        form.setFieldValue('isResidentTicket', activeTab === CONTACT_TYPE.RESIDENT)
    }, [activeTab, fields.id, fields.name, fields.phone, form])

    const handleClickOnPlusButton = useCallback(() => {
        form.setFieldsValue({
            [NEW_CONTACT_PHONE_FORM_ITEM_NAME]: null,
            [NEW_CONTACT_NAME_FORM_ITEM_NAME]: null,
            [fields.id]: null,
            [fields.name]: null,
            [fields.phone]: null,
        })
        setSelectedContact(null)
        setDisplayEditableContactFields(true)
        setEditableFieldsChecked(true)
    }, [fields.id, fields.name, fields.phone, form])

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
        <Col span={24} key={contact.id}>
            <ContactOption
                contact={contact}
                onSelect={handleSelectContact}
                selected={isContactSelected(contact)}
                contactFormItemProps={contactFormItemProps}
                disabled={disabled}
            />
        </Col>
    )), [contactFormItemProps, disabled, handleSelectContact, initialContacts, isContactSelected])

    const handleTabChange = useCallback((tab) => {
        triggerOnChange(null, false)
        setEditableFieldsChecked(false)

        setActiveTab(tab)
    }, [initialValue.id, initialValue.phone, triggerOnChange])

    const className = props.disabled ? 'disabled' : ''

    const displayEditableFieldsWithContactOptions = useMemo(() =>
        displayEditableContactFields ||
        (initialValue.id && !initialValueIsPresentedInFetchedContacts) ||
        !isEmptyInitialNotResidentValue,
    [displayEditableContactFields, initialValue.id, initialValueIsPresentedInFetchedContacts, isEmptyInitialNotResidentValue])

    const Container = useCallback((props) =>
        hideFocusContainer ? <div {...props} /> : <ContactsInfoFocusContainer {...props} />,
    [hideFocusContainer])

    const tabBarStyle = useMemo(() =>
        hideTabBar ? { display: 'none' } : {},
    [hideTabBar])

    const residentInfo = useMemo(() => {
        return (
            <Row gutter={TAB_PANE_ROW_GUTTERS}>
                {isEmpty(initialContacts) || !unitName ? (
                    <NewContactFields
                        onChange={handleChangeContact}
                        contacts={fetchedContacts}
                        fields={fields}
                        activeTab={activeTab}
                        contactsLoading={contactsLoading}
                        unitName={unitName}
                        initialValueWithoutContact={initialValueWithoutContact}
                        newContactPhoneFormItemProps={newContactPhoneFormItemProps}
                        newContactNameFormItemProps={newContactNameFormItemProps}
                        disabled={disabled}
                        form={form}
                    />
                ) : (
                    <>
                        {contactOptions}
                        <>
                            {
                                canManageContacts && (
                                    displayEditableFieldsWithContactOptions ? (
                                        <>
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
                                                unitName={unitName}
                                                initialValueWithoutContact={initialValueWithoutContact}
                                                newContactPhoneFormItemProps={newContactPhoneFormItemProps}
                                                newContactNameFormItemProps={newContactNameFormItemProps}
                                                disabled={disabled}
                                                form={form}
                                            />
                                            {
                                                !breakpoints.TABLET_LARGE && (
                                                    <Col span={24}>
                                                        <Button
                                                            type='primary'
                                                            minimal
                                                            compact
                                                            onClick={handleClickOnMinusButton}
                                                            icon={<MinusCircle/>}
                                                        >
                                                            {CancelMessage}
                                                        </Button>
                                                    </Col>
                                                )
                                            }
                                        </>
                                    ) : (
                                        <Col span={24}>
                                            <Button
                                                type='primary'
                                                minimal
                                                compact
                                                onClick={handleClickOnPlusButton}
                                                icon={<PlusCircle/>}
                                                disabled={disabled}
                                            >
                                                {AddNewContactLabel}
                                            </Button>
                                        </Col>
                                    )
                                )
                            }
                        </>
                    </>
                )}
            </Row>
        )
    }, [AddNewContactLabel, CancelMessage, activeTab, breakpoints.TABLET_LARGE, canManageContacts, contactOptions, contactsLoading, disabled, displayEditableFieldsWithContactOptions, editableFieldsChecked, fetchedContacts, fields, form, handleChangeContact, handleClickOnMinusButton, handleClickOnPlusButton, initialContacts, initialValueWithoutContact, newContactNameFormItemProps, newContactPhoneFormItemProps, unitName])

    if (error) {
        console.warn(error)
        throw error
    }

    return (
        <Col span={24}>
            <Container className={className}>
                {
                    (canReadContacts || canManageContacts) && !hasNotResidentTab ? (
                        <>
                            <Typography.Title level={4}>{ResidentMessage}</Typography.Title>
                            {residentInfo}
                        </>
                    ) : (
                        <Tabs
                            defaultActiveKey={activeTab}
                            activeKey={activeTab}
                            style={TABS_STYLE}
                            onChange={handleTabChange}
                            tabBarStyle={tabBarStyle}
                        >
                            {
                                (canReadContacts || canManageContacts) && (
                                    <TabPane tab={residentTitle || ResidentMessage} key={CONTACT_TYPE.RESIDENT} disabled={!unitName}>
                                        {residentInfo}
                                    </TabPane>
                                )
                            }
                            {
                                hasNotResidentTab && (
                                    <TabPane
                                        tab={notResidentTitle || NotResidentMessage}
                                        key={CONTACT_TYPE.NOT_RESIDENT}
                                    >
                                        <Row gutter={TAB_PANE_ROW_GUTTERS}>
                                            <NotResidentFields
                                                initialQuery={initialEmployeesQuery}
                                                refetch={refetchEmployees}
                                                initialValue={initialValueWithoutContact}
                                                onChange={handleChangeEmployee}
                                                employees={fetchedEmployees}
                                                activeTab={activeTab}
                                            />
                                        </Row>
                                    </TabPane>
                                )
                            }
                        </Tabs>
                    )
                }
            </Container>
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
