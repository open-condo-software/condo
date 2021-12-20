// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useCallback, useEffect, useRef, useState } from 'react'

import { useRouter } from 'next/router'
import { Checkbox, Col, Form, Input, Row, Typography, Tooltip, Tabs, Alert } from 'antd'
import isFunction from 'lodash/isFunction'
import isUndefined from 'lodash/isUndefined'
import get from 'lodash/get'

import { useIntl } from '@core/next/intl'

import { normalizeText } from '@condo/domains/common/utils/text'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import { FrontLayerContainer } from '@condo/domains/common/components/FrontLayerContainer'
import { useMultipleFileUploadHook } from '@condo/domains/common/components/MultipleFileUpload'
import { InputWithCounter } from '@condo/domains/common/components/InputWithCounter'
import Prompt from '@condo/domains/common/components/Prompt'
import { UnitInfo } from '@condo/domains/property/components/UnitInfo'
import { Button } from '@condo/domains/common/components/Button'

import { useContactsEditorHook } from '@condo/domains/contact/components/ContactsEditor/useContactsEditorHook'

import { PropertyAddressSearchInput } from '@condo/domains/property/components/PropertyAddressSearchInput'

import { ITicketFormState } from '@condo/domains/ticket/utils/clientSchema/Ticket'
import { TicketFile, ITicketFileUIState } from '@condo/domains/ticket/utils/clientSchema'
import { useTicketThreeLevelsClassifierHook } from '@condo/domains/ticket/components/TicketClassifierSelect'

import { IOrganizationEmployeeRoleUIState } from '@condo/domains/organization/utils/clientSchema/OrganizationEmployeeRole'
import { IOrganizationUIState } from '@condo/domains/organization/utils/clientSchema/Organization'

import { Property } from '@condo/domains/property/utils/clientSchema'

import { TicketAssignments } from './TicketAssignments'
import { useTicketValidations } from './useTicketValidations'

const { TabPane } = Tabs

export const LAYOUT = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 },
}

const CONTANTS_INFO_TABS_STYLE = { width: '100%' }
const CONTACTS_EDITOR_FIELDS = {
    id: 'contact',
    phone: 'clientPhone',
    name: 'clientName',
}

export const ContactsInfo = ({ ContactsEditorComponent, form, selectedPropertyId, initialValues }) => {
    const intl = useIntl()
    const NotImplementedYetMessage = intl.formatMessage({ id: 'NotImplementedYet' })
    const TicketFromResidentMessage = intl.formatMessage({ id: 'pages.condo.ticket.title.TicketFromResident' })
    const TicketNotFromResidentMessage = intl.formatMessage({ id: 'pages.condo.ticket.title.TicketNotFromResident' })

    const value = React.useMemo(() => ({
        id: get(initialValues, ['contact', 'id']),
        name: get(initialValues, 'clientName'),
        phone: get(initialValues, 'clientPhone'),
    }), [initialValues])

    return (
        <Col span={24}>
            <Form.Item shouldUpdate noStyle>
                {({ getFieldsValue }) => {
                    const { property, unitName } = getFieldsValue(['property', 'unitName'])

                    return (
                        <FocusContainer className={!property && 'disabled'}>
                            <Tabs defaultActiveKey="1" style={CONTANTS_INFO_TABS_STYLE}>
                                <TabPane tab={TicketFromResidentMessage} key="1">
                                    <ContactsEditorComponent
                                        form={form}
                                        fields={CONTACTS_EDITOR_FIELDS}
                                        value={value}
                                        // Local `property` cannot be used here, because `PropertyAddressSearchInput`
                                        // sets `Property.address` as its value, but we need `Property.id` here
                                        property={selectedPropertyId}
                                        unitName={unitName}
                                    />
                                </TabPane>
                                <TabPane
                                    tab={
                                        <Tooltip title={NotImplementedYetMessage}>
                                            {TicketNotFromResidentMessage}
                                        </Tooltip>
                                    }
                                    key="2"
                                    disabled
                                />
                            </Tabs>
                        </FocusContainer>
                    )
                }}
            </Form.Item>
        </Col>
    )
}

const TASK_INFO_TITLE_STYLE = { margin: '0' }
const TASK_INFO_ROW_GUTTER = [0, 24]

export const TicketInfo = ({ form, validations, UploadComponent, initialValues, disableUserInteraction }) => {
    const intl = useIntl()
    const TicketInfoTitle = intl.formatMessage({ id: 'pages.condo.ticket.title.TicketInfo' })
    const AttachedFilesLabel = intl.formatMessage({ id: 'component.uploadlist.AttachedFilesLabel' })
    const DescriptionLabel = intl.formatMessage({ id: 'pages.condo.ticket.field.Description' })
    const EmergencyLabel = intl.formatMessage({ id: 'Emergency' })
    const PaidLabel = intl.formatMessage({ id: 'Paid' })
    const DescriptionPlaceholder = intl.formatMessage({ id: 'placeholder.Description' })

    const { ClassifiersEditorComponent } = useTicketThreeLevelsClassifierHook({ initialValues })

    const details = React.useMemo(() => get(initialValues, 'details'), [initialValues])
    const [currentDetailsLength, setCurrentDetailsLength] = useState<number>(details ? details.length : 0)

    const handleCounterChange = React.useCallback(
        e => setCurrentDetailsLength(e.target.value.length),
        [setCurrentDetailsLength]
    )

    return (
        <Col span={24}>
            <Row gutter={TASK_INFO_ROW_GUTTER}>
                <Col span={24}>
                    <Typography.Title level={5} style={TASK_INFO_TITLE_STYLE}>{TicketInfoTitle}</Typography.Title>
                </Col>
                <ClassifiersEditorComponent form={form} disabled={disableUserInteraction}/>
                <Col span={24}>
                    <Row>
                        <Col span={6}>
                            <Form.Item name='isEmergency' valuePropName='checked'>
                                <Checkbox disabled={disableUserInteraction}>{EmergencyLabel}</Checkbox>
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item name='isPaid' valuePropName='checked'>
                                <Checkbox disabled={disableUserInteraction}>{PaidLabel}</Checkbox>
                            </Form.Item>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <Form.Item name={'details'} rules={validations.details} label={DescriptionLabel}>
                        <InputWithCounter
                            InputComponent={Input.TextArea}
                            currentLength={currentDetailsLength}
                            autoSize={true}
                            maxLength={500}
                            onChange={handleCounterChange}
                            placeholder={DescriptionPlaceholder}
                            disabled={disableUserInteraction}
                        />
                    </Form.Item>
                </Col>
                <Col flex={0}>
                    <Form.Item label={AttachedFilesLabel}>
                        <UploadComponent/>
                    </Form.Item>
                </Col>
            </Row>
        </Col>
    )
}

export interface ITicketFormProps {
    organization?: IOrganizationUIState
    role?: IOrganizationEmployeeRoleUIState
    initialValues?: ITicketFormState
    action?: (...args) => void,
    files?: ITicketFileUIState[],
    afterActionCompleted?: (ticket: ITicketFormState) => void,
    autoAssign?: boolean,
}

const FORM_VALIDATE_TRIGGERS = ['onBlur', 'onSubmit']
const FIELD_NAMES = ['property', 'categoryClassifier']
const GUTTER_0_40 = [0, 40]
const GUTTER_0_15 = [0, 15]
const STYLE_MARGIN_0 = { margin: '0' }

export const BaseTicketForm: React.FC<ITicketFormProps> = (props) => {
    const intl = useIntl()
    const AddMessage = intl.formatMessage({ id: 'Add' })
    const AddressLabel = intl.formatMessage({ id: 'field.Address' })
    const AddressPlaceholder = intl.formatMessage({ id: 'placeholder.Address' })
    const AddressNotFoundContent = intl.formatMessage({ id: 'field.Address.notFound' })
    const AddressNotSelected = intl.formatMessage({ id: 'field.Property.nonSelectedError' })
    const PromptTitle = intl.formatMessage({ id: 'pages.condo.ticket.warning.modal.Title' })
    const PromptHelpMessage = intl.formatMessage({ id: 'pages.condo.ticket.warning.modal.HelpMessage' })
    const NoPropertiesMessage = intl.formatMessage({ id: 'pages.condo.ticket.alert.NoProperties' })
    const UserInfoTitle = intl.formatMessage({ id: 'ClientInfo' })

    const router = useRouter()

    const { action: _action, initialValues, organization, role, afterActionCompleted, files, autoAssign } = props
    const validations = useTicketValidations()
    const [selectedPropertyId, setSelectedPropertyId] = useState(get(initialValues, 'property'))
    const selectPropertyIdRef = useRef(selectedPropertyId)

    const { loading: organizationPropertiesLoading, objs: organizationProperties } = Property.useObjects({
        where: {
            organization: {
                id: organization ? organization.id : null,
            },
            deletedAt: null,
        },
    })

    const property = organizationProperties.find(property => property.id === selectedPropertyId)

    const [selectedUnitName, setSelectedUnitName] = useState(get(initialValues, 'unitName'))
    const selectedUnitNameRef = useRef(selectedUnitName)

    useEffect(() => {
        selectPropertyIdRef.current = selectedPropertyId
    }, [selectedPropertyId])

    useEffect(() => {
        selectedUnitNameRef.current = selectedUnitName
    }, [selectedUnitName])

    const { UploadComponent, syncModifiedFiles } = useMultipleFileUploadHook({
        Model: TicketFile,
        relationField: 'ticket',
        initialFileList: files,
        initialCreateValues: { organization: organization.id },
    })

    const { createContact, canCreateContact, ContactsEditorComponent } = useContactsEditorHook({
        organization: organization.id,
        role,
        allowLandLine: true,
    })

    const canCreateContactRef = useRef(canCreateContact)

    useEffect(() => {
        canCreateContactRef.current = canCreateContact
    }, [canCreateContact])

    const addressValidation = useCallback((_, value) => {
        const searchValueLength = get(value, 'length', 0)
        if (searchValueLength === 0) {
            return Promise.resolve()
        }

        return isUndefined(selectedPropertyId)
            ? Promise.resolve()
            : Promise.reject(AddressNotSelected)
    }, [selectedPropertyId])

    const propertyValidationRules = React.useMemo(
        () => [...validations.property, { validator: addressValidation }],
        [validations.property, addressValidation]
    )

    const action = async (variables, ...args) => {
        const { details, ...otherVariables } = variables
        let createdContact

        if (role.canManageContacts && canCreateContactRef.current) {
            createdContact = await createContact(organization.id, selectPropertyIdRef.current, selectedUnitNameRef.current)
        }

        const result = await _action({
            ...otherVariables,
            details: normalizeText(details),
            contact: get(createdContact, 'id') || variables.contact,
        }, ...args)

        await syncModifiedFiles(result.id)

        if (isFunction(afterActionCompleted)) {
            return afterActionCompleted(result)
        }
        return result
    }

    const mutateValues = React.useCallback((values) => {
        values.property = selectPropertyIdRef.current
        values.unitName = selectedUnitNameRef.current

        return values
    }, [])

    const handleAlertClick = React.useCallback(() => {
        router.push('/property/create')
    }, [router])

    return (
        <>
            <FormWithAction
                {...LAYOUT}
                action={action}
                initialValues={initialValues}
                validateTrigger={FORM_VALIDATE_TRIGGERS}
                formValuesToMutationDataPreprocessor={mutateValues}
            >
                {({ handleSave, isLoading, form }) => (
                    <>
                        <Prompt
                            title={PromptTitle}
                            form={form}
                            handleSave={handleSave}
                        >
                            <Typography.Paragraph>
                                {PromptHelpMessage}
                            </Typography.Paragraph>
                        </Prompt>
                        <Col lg={13} md={24}>
                            <Row gutter={GUTTER_0_40}>
                                <Col span={24}>
                                    <Row justify='space-between' gutter={GUTTER_0_15}>
                                        <Col span={24}>
                                            <Typography.Title level={5} style={STYLE_MARGIN_0}>
                                                {UserInfoTitle}
                                            </Typography.Title>
                                        </Col>
                                        {
                                            !organizationPropertiesLoading && organizationProperties.length === 0 ? (
                                                <Col span={24}>
                                                    <Alert
                                                        showIcon
                                                        type='warning'
                                                        message={
                                                            <>
                                                                {NoPropertiesMessage}&nbsp;
                                                                <Button
                                                                    type={'inlineLink'}
                                                                    size={'small'}
                                                                    onClick={handleAlertClick}
                                                                >
                                                                    {AddMessage}
                                                                </Button>
                                                            </>
                                                        }
                                                    />
                                                </Col>
                                            ) : null
                                        }
                                        <Col span={24}>
                                            <Form.Item
                                                name={'property'}
                                                label={AddressLabel}
                                                rules={propertyValidationRules}
                                            >
                                                <PropertyAddressSearchInput
                                                    organization={organization}
                                                    autoFocus={true}
                                                    onSelect={(_, option) => {
                                                        form.setFieldsValue({
                                                            unitName: null,
                                                            sectionName: null,
                                                            floorName: null,
                                                        })
                                                        setSelectedPropertyId(option.key)
                                                    }}
                                                    onClear={() => {
                                                        setSelectedPropertyId(null)
                                                    }}
                                                    placeholder={AddressPlaceholder}
                                                    notFoundContent={AddressNotFoundContent}
                                                />
                                            </Form.Item>
                                        </Col>
                                        {selectedPropertyId && (
                                            <UnitInfo
                                                property={property}
                                                loading={organizationPropertiesLoading}
                                                setSelectedUnitName={setSelectedUnitName}
                                                form={form}
                                            />
                                        )}
                                    </Row>
                                </Col>
                                <ContactsInfo
                                    ContactsEditorComponent={ContactsEditorComponent}
                                    form={form}
                                    initialValues={initialValues}
                                    selectedPropertyId={selectedPropertyId}
                                />
                                <Form.Item noStyle dependencies={FIELD_NAMES} shouldUpdate>
                                    {
                                        ({ getFieldsValue }) => {
                                            const {
                                                property,
                                                categoryClassifier,
                                            } = getFieldsValue(FIELD_NAMES)

                                            const disableUserInteraction = !property

                                            return (
                                                <Col span={24}>
                                                    <FrontLayerContainer showLayer={disableUserInteraction}>
                                                        <Row gutter={GUTTER_0_40}>
                                                            <TicketInfo
                                                                form={form}
                                                                UploadComponent={UploadComponent}
                                                                validations={validations}
                                                                organizationId={get(organization, 'id')}
                                                                initialValues={initialValues}
                                                                disableUserInteraction={disableUserInteraction}
                                                            />
                                                            <TicketAssignments
                                                                disableUserInteraction={disableUserInteraction}
                                                                validations={validations}
                                                                organizationId={get(organization, 'id')}
                                                                propertyId={selectedPropertyId}
                                                                autoAssign={autoAssign}
                                                                categoryClassifier={categoryClassifier}
                                                                form={form}
                                                            />
                                                        </Row>
                                                    </FrontLayerContainer>
                                                </Col>
                                            )
                                        }
                                    }
                                </Form.Item>
                            </Row>
                        </Col>
                        {props.children({ handleSave, isLoading, form })}
                    </>
                )}
            </FormWithAction>
        </>
    )
}

