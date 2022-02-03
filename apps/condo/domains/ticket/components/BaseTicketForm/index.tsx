// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useIntl } from '@core/next/intl'
import { Checkbox, Col, Form, Input, Row, Typography, Tooltip, Tabs, Alert } from 'antd'
import get from 'lodash/get'
import { ITicketFormState } from '@condo/domains/ticket/utils/clientSchema/Ticket'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { PropertyAddressSearchInput } from '@condo/domains/property/components/PropertyAddressSearchInput'
import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import { useTicketValidations } from './useTicketValidations'
import { FrontLayerContainer } from '@condo/domains/common/components/FrontLayerContainer'
import { useMultipleFileUploadHook } from '@condo/domains/common/components/MultipleFileUpload'
import { TicketFile, ITicketFileUIState } from '@condo/domains/ticket/utils/clientSchema'
import { useContactsEditorHook } from '@condo/domains/contact/components/ContactsEditor/useContactsEditorHook'
import { useTicketThreeLevelsClassifierHook } from '@condo/domains/ticket/components/TicketClassifierSelect'
import { normalizeText } from '@condo/domains/common/utils/text'
import { InputWithCounter } from '@condo/domains/common/components/InputWithCounter'
import Prompt from '@condo/domains/common/components/Prompt'
import { IOrganizationEmployeeRoleUIState } from '@condo/domains/organization/utils/clientSchema/OrganizationEmployeeRole'
import { IOrganizationUIState } from '@condo/domains/organization/utils/clientSchema/Organization'
import { UnitInfo } from '@condo/domains/property/components/UnitInfo'
import { TicketAssignments } from './TicketAssignments'
import { Property } from '@condo/domains/property/utils/clientSchema'
import { Button } from '@condo/domains/common/components/Button'
import { useRouter } from 'next/router'
import { PropertyWhereInput } from '@app/condo/schema'

const { TabPane } = Tabs

export const LAYOUT = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 },
}

export const ContactsInfo = ({ ContactsEditorComponent, form, selectedPropertyId, initialValues }) => {
    const intl = useIntl()
    const NotImplementedYetMessage = intl.formatMessage({ id: 'NotImplementedYet' })
    const TicketFromResidentMessage = intl.formatMessage({ id: 'pages.condo.ticket.title.TicketFromResident' })
    const TicketNotFromResidentMessage = intl.formatMessage({ id: 'pages.condo.ticket.title.TicketNotFromResident' })

    return (
        <Col span={24}>
            <Form.Item shouldUpdate noStyle>
                {({ getFieldsValue }) => {
                    const { property, unitName } = getFieldsValue(['property', 'unitName'])

                    const value = {
                        id: get(initialValues, ['contact', 'id']),
                        name: get(initialValues, 'clientName'),
                        phone: get(initialValues, 'clientPhone'),
                    }

                    return (
                        <FocusContainer className={!property && 'disabled'}>
                            <Tabs defaultActiveKey="1" style={{ width: '100%' }}>
                                <TabPane tab={TicketFromResidentMessage} key="1">
                                    <ContactsEditorComponent
                                        form={form}
                                        fields={{
                                            id: 'contact',
                                            phone: 'clientPhone',
                                            name: 'clientName',
                                        }}
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

export const TicketInfo = ({ form, validations, UploadComponent, initialValues, disableUserInteraction }) => {
    const intl = useIntl()
    const TicketInfoTitle = intl.formatMessage({ id: 'pages.condo.ticket.title.TicketInfo' })
    const AttachedFilesLabel = intl.formatMessage({ id: 'component.uploadlist.AttachedFilesLabel' })
    const DescriptionLabel = intl.formatMessage({ id: 'pages.condo.ticket.field.Description' })
    const EmergencyLabel = intl.formatMessage({ id: 'Emergency' })
    const WarrantyLabel = intl.formatMessage({ id: 'Warranty' })
    const PaidLabel = intl.formatMessage({ id: 'Paid' })
    const DescriptionPlaceholder = intl.formatMessage({ id: 'placeholder.Description' })

    const { ClassifiersEditorComponent } = useTicketThreeLevelsClassifierHook({ initialValues })

    const details = get(initialValues, 'details')
    const [currentDetailsLength, setCurrentDetailsLength] = useState<number>(details ? details.length : 0)

    return (
        <>
            <Col span={24}>
                <Row gutter={[0, 24]}>
                    <Col span={24}>
                        <Typography.Title level={5} style={{ margin: '0' }}>{TicketInfoTitle}</Typography.Title>
                    </Col>
                    <ClassifiersEditorComponent form={form} disabled={disableUserInteraction}/>
                    <Col span={24}>
                        <Row>
                            <Col span={24} lg={6}>
                                <Form.Item name={'isEmergency'} valuePropName='checked'>
                                    <Checkbox disabled={disableUserInteraction}>{EmergencyLabel}</Checkbox>
                                </Form.Item>
                            </Col>
                            <Col span={24} lg={6}>
                                <Form.Item name={'isPaid'} valuePropName='checked'>
                                    <Checkbox disabled={disableUserInteraction}>{PaidLabel}</Checkbox>
                                </Form.Item>
                            </Col>
                            <Col span={24} lg={6}>
                                <Form.Item name={'isWarranty'} valuePropName='checked'>
                                    <Checkbox disabled={disableUserInteraction}>{WarrantyLabel}</Checkbox>
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
                                onChange={e => setCurrentDetailsLength(e.target.value.length)}
                                placeholder={DescriptionPlaceholder}
                                disabled={disableUserInteraction}
                            />
                        </Form.Item>
                    </Col>
                    <Col flex={0}>
                        <Form.Item
                            label={AttachedFilesLabel}
                        >
                            <UploadComponent/>
                        </Form.Item>
                    </Col>
                </Row>
            </Col>
        </>
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
    const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(get(initialValues, 'property', null))
    const selectPropertyIdRef = useRef(selectedPropertyId)

    const propertyWhereQuery: PropertyWhereInput = {
        organization: {
            id: organization ? organization.id : null,
        },
        deletedAt: null,

    }
    if (selectedPropertyId) {
        propertyWhereQuery['id_in'] = [selectedPropertyId]
    }

    const { loading: organizationPropertiesLoading, objs: organizationProperties, refetch } = Property.useObjects({
        where: propertyWhereQuery,
        first: 1,
        skip: 0,
    } )

    const property = organizationProperties.find(property => property.id === selectedPropertyId)

    const [selectedUnitName, setSelectedUnitName] = useState(get(initialValues, 'unitName'))
    const selectedUnitNameRef = useRef(selectedUnitName)

    useEffect(() => {
        selectPropertyIdRef.current = selectedPropertyId
        refetch()
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

        return selectedPropertyId !== undefined
            ? Promise.resolve()
            : Promise.reject(AddressNotSelected)
    }, [selectedPropertyId])

    const PROPERTY_VALIDATION_RULES = [...validations.property, { validator: addressValidation }]

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

        if (afterActionCompleted) {
            return afterActionCompleted(result)
        }
        return result
    }

    return (
        <>
            <FormWithAction
                action={action}
                initialValues={initialValues}
                validateTrigger={['onBlur', 'onSubmit']}
                formValuesToMutationDataPreprocessor={(values) => {
                    values.property = selectPropertyIdRef.current
                    values.unitName = selectedUnitNameRef.current
                    return values
                }}
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
                            <Row gutter={[0, 40]}>
                                <Col span={24}>
                                    <Row justify={'space-between'} gutter={[0, 15]}>
                                        <Col span={24}>
                                            <Typography.Title level={5}
                                                style={{ margin: '0' }}>{UserInfoTitle}</Typography.Title>
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
                                                                    onClick={() => router.push('/property/create')}
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
                                                rules={PROPERTY_VALIDATION_RULES}
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
                                <Form.Item noStyle dependencies={['property', 'categoryClassifier']} shouldUpdate>
                                    {
                                        ({ getFieldsValue }) => {
                                            const {
                                                property,
                                                categoryClassifier,
                                            } = getFieldsValue(['property', 'categoryClassifier'])

                                            const disableUserInteraction = !property

                                            return (
                                                <Col span={24}>
                                                    <FrontLayerContainer showLayer={disableUserInteraction} isSelectable={false}>
                                                        <Row gutter={[0, 40]}>
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

