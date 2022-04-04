// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useIntl } from '@core/next/intl'
import { Checkbox, Col, Form, Input, Row, Typography, Tooltip, Tabs, Alert, FormItemProps } from 'antd'
import { get, isEmpty }  from 'lodash'
import styled from '@emotion/styled'
import { useRouter } from 'next/router'
import { BuildingUnitType, PropertyWhereInput } from '@app/condo/schema'

import { ITicketFormState } from '@condo/domains/ticket/utils/clientSchema/Ticket'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { PropertyAddressSearchInput } from '@condo/domains/property/components/PropertyAddressSearchInput'
import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import { FrontLayerContainer } from '@condo/domains/common/components/FrontLayerContainer'
import { useMultipleFileUploadHook } from '@condo/domains/common/components/MultipleFileUpload'
import { TicketFile, ITicketFileUIState } from '@condo/domains/ticket/utils/clientSchema'
import { useContactsEditorHook } from '@condo/domains/contact/components/ContactsEditor/useContactsEditorHook'
import { useTicketThreeLevelsClassifierHook } from '@condo/domains/ticket/components/TicketClassifierSelect'
import { normalizeText } from '@condo/domains/common/utils/text'
import Prompt from '@condo/domains/common/components/Prompt'
import { IOrganizationEmployeeRoleUIState } from '@condo/domains/organization/utils/clientSchema/OrganizationEmployeeRole'
import { IOrganizationUIState } from '@condo/domains/organization/utils/clientSchema/Organization'
import { UnitInfo } from '@condo/domains/property/components/UnitInfo'
import { Property } from '@condo/domains/property/utils/clientSchema'
import { Button } from '@condo/domains/common/components/Button'
import { colors } from '@condo/domains/common/constants/style'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { RESIDENT } from '@condo/domains/user/constants/common'
const { PROPERTY_REQUIRED_ERROR } = require('@condo/domains/common/constants/errors')

import { TicketDeadlineField } from './TicketDeadlineField'
import { useTicketValidations } from './useTicketValidations'
import { TicketAssignments } from './TicketAssignments'
import { useInputWithCounter } from '../../../common/hooks/useInputWithCounter'
const { TabPane } = Tabs

const ContactsInfoFocusContainer = styled(FocusContainer)`
  position: relative;
  left: ${({ padding }) => padding ? padding : '24px'};
  box-sizing: border-box;
  width: 100%;
  background: ${colors.backgroundLightGrey};
`

export const ContactsInfo = ({ ContactsEditorComponent, form, selectedPropertyId, initialValues }) => {
    const contactId = useMemo(() => get(initialValues, 'contact'), [initialValues])

    const value = useMemo(() => ({
        id: contactId,
        name: get(initialValues, 'clientName'),
        phone: get(initialValues, 'clientPhone'),
    }), [contactId, initialValues])

    return (
        <Col span={24}>
            <TicketFormItem shouldUpdate noStyle>
                {({ getFieldsValue }) => {
                    const { property, unitName } = getFieldsValue(['property', 'unitName'])

                    return (
                        <ContactsInfoFocusContainer className={!property && 'disabled'}>
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
                        </ContactsInfoFocusContainer>
                    )
                }}
            </TicketFormItem>
        </Col>
    )
}

const INPUT_WITH_COUNTER_STYLE = { height: '120px', width: '100%', color: colors.sberGrey[5], fontSize: '12px' }
const FORM_FILED_COL_PROPS = { style: { width: '100%', padding: 0 } }

export const TicketFormItem: React.FC<FormItemProps> = (props) => (
    <Form.Item labelCol={FORM_FILED_COL_PROPS} wrapperCol={FORM_FILED_COL_PROPS} {...props} />
)

export const TicketInfo = ({ form, validations, UploadComponent, initialValues, disableUserInteraction }) => {
    const intl = useIntl()
    const TicketDeadlineLabel = intl.formatMessage({ id: 'TicketDeadline' })
    const DescriptionLabel = intl.formatMessage({ id: 'pages.condo.ticket.field.Description' })
    const EmergencyLabel = intl.formatMessage({ id: 'Emergency' })
    const WarrantyLabel = intl.formatMessage({ id: 'Warranty' })
    const PaidLabel = intl.formatMessage({ id: 'Paid' })
    const DescriptionPlaceholder = intl.formatMessage({ id: 'placeholder.Description' })
    const ClassifierLabel = intl.formatMessage({ id: 'Classifier' })

    const { isSmall } = useLayoutContext()

    const {
        ClassifiersEditorComponent,
        predictTicketClassifier,
    } = useTicketThreeLevelsClassifierHook({ initialValues })

    const { InputWithCounter, Counter } = useInputWithCounter(Input.TextArea, 500)

    return (
        <Col span={24}>
            <Row gutter={[0, 60]}>
                <Col span={24}>
                    <Row gutter={[0, 24]}>
                        <Col span={24}>
                            <Typography.Title level={3}><span style={{ 'color': colors.brightRed }}>*</span>{DescriptionLabel}</Typography.Title>
                        </Col>
                        <Col span={isSmall ? 24 : 20}>
                            <Row>
                                <Col span={24}>
                                    <TicketFormItem name={'details'} rules={validations.details}>
                                        <InputWithCounter
                                            InputComponent={Input.TextArea}
                                            onBlur={e => predictTicketClassifier(e.target.value)}
                                            placeholder={DescriptionPlaceholder}
                                            disabled={disableUserInteraction}
                                            style={INPUT_WITH_COUNTER_STYLE}
                                            data-cy={'ticket__description-input'}
                                        />
                                        <Counter style={{ float: 'right' }} />
                                    </TicketFormItem>
                                </Col>
                                <Col span={24} style={{ 'padding-top': '24px' }}>
                                    <TicketFormItem>
                                        <UploadComponent/>
                                    </TicketFormItem>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <Row gutter={[0, 24]}>
                        <Col span={24}>
                            <Row gutter={[0, 10]}>
                                <Col span={24}>
                                    <Typography.Title level={3}>{ClassifierLabel}</Typography.Title>
                                </Col>
                                <Col span={isSmall ? 24 : 18}>
                                    <ClassifiersEditorComponent form={form} disabled={disableUserInteraction}/>
                                </Col>
                            </Row>
                        </Col>
                        <Col span={24}>
                            <Row gutter={[40, 0]}>
                                <Col span={24} lg={4}>
                                    <Form.Item name={'isEmergency'} valuePropName='checked'>
                                        <Checkbox disabled={disableUserInteraction}>{EmergencyLabel}</Checkbox>
                                    </Form.Item>
                                </Col>
                                <Col span={24} lg={4}>
                                    <Form.Item name={'isPaid'} valuePropName='checked'>
                                        <Checkbox disabled={disableUserInteraction}>{PaidLabel}</Checkbox>
                                    </Form.Item>
                                </Col>
                                <Col span={24} lg={4}>
                                    <Form.Item name={'isWarranty'} valuePropName='checked'>
                                        <Checkbox disabled={disableUserInteraction}>{WarrantyLabel}</Checkbox>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Col>
                <Col span={isSmall ? 24 : 18}>
                    <Row gutter={[0, 10]}>
                        <Col span={24}>
                            <Typography.Title level={3}>{TicketDeadlineLabel}</Typography.Title>
                        </Col>
                        <Col span={24}>
                            <TicketDeadlineField initialValues={initialValues} />
                        </Col>
                    </Row>
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
    const CanReadByResidentMessage = intl.formatMessage({ id: 'pages.condo.ticket.field.CanReadByResident' })

    const { isSmall } = useLayoutContext()

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
    const [selectedUnitType, setSelectedUnitType] = useState<BuildingUnitType>(get(initialValues, 'unitType', BuildingUnitType.Flat))
    const selectedUnitNameRef = useRef(selectedUnitName)
    const selectedUnitTypeRef = useRef<BuildingUnitType>(selectedUnitType)

    useEffect(() => {
        selectPropertyIdRef.current = selectedPropertyId
        refetch()
    }, [selectedPropertyId])

    useEffect(() => {
        selectedUnitNameRef.current = selectedUnitName
    }, [selectedUnitName])

    useEffect(() => {
        selectedUnitTypeRef.current = selectedUnitType
    }, [selectedUnitType])

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
        const deadline = get(variables, 'deadline')
        let createdContact

        if (role.canManageContacts && canCreateContactRef.current) {
            createdContact = await createContact(organization.id, selectPropertyIdRef.current, selectedUnitNameRef.current)
        }

        const result = await _action({
            ...otherVariables,
            details: normalizeText(details),
            contact: get(createdContact, 'id') || variables.contact,
            deadline: deadline && deadline.startOf('day'),
        }, ...args)

        await syncModifiedFiles(result.id)

        if (afterActionCompleted) {
            return afterActionCompleted(result)
        }
        return result
    }

    const initialCanReadByResidentValue = useMemo(() => get(initialValues, 'canReadByResident', true), [initialValues])
    const isResidentTicket = useMemo(() => get(initialValues, ['createdBy', 'type']) === RESIDENT, [initialValues])
    const ErrorToFormFieldMsgMapping = {
        [PROPERTY_REQUIRED_ERROR]: {
            name: 'property',
            errors: [AddressNotSelected],
        },
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
                    values.unitType = selectedUnitTypeRef.current
                    return values
                }}
                ErrorToFormFieldMsgMapping={ErrorToFormFieldMsgMapping}
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
                        <Col lg={17} md={24}>
                            <Row gutter={[0, 60]}>
                                <Col span={24}>
                                    <Row gutter={[0, 6]}>
                                        {
                                            !organizationPropertiesLoading && isEmpty(organizationProperties) ? (
                                                <Col span={isSmall ? 24 : 20}>
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
                                        <Col span={isSmall ? 24 : 20} data-cy={'ticket__property-address-search-input'}>
                                            <TicketFormItem
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
                                            </TicketFormItem>
                                        </Col>
                                        {selectedPropertyId && (
                                            <UnitInfo
                                                property={property}
                                                loading={organizationPropertiesLoading}
                                                setSelectedUnitName={setSelectedUnitName}
                                                setSelectedUnitType={setSelectedUnitType}
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
                                <Col span={24}>
                                    <Form.Item noStyle dependencies={['property', 'categoryClassifier']} shouldUpdate>
                                        {
                                            ({ getFieldsValue }) => {
                                                const {
                                                    property,
                                                    categoryClassifier,
                                                } = getFieldsValue(['property', 'categoryClassifier'])

                                                const disableUserInteraction = !property

                                                return (
                                                    <FrontLayerContainer showLayer={disableUserInteraction} isSelectable={false}>
                                                        <Row gutter={[0, 60]}>
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
                                                            {
                                                                !isResidentTicket && (
                                                                    <Col span={24}>
                                                                        <Form.Item name={'canReadByResident'} valuePropName='checked' initialValue={initialCanReadByResidentValue}>
                                                                            <Checkbox disabled={disableUserInteraction}>{CanReadByResidentMessage}</Checkbox>
                                                                        </Form.Item>
                                                                    </Col>
                                                                )
                                                            }
                                                        </Row>
                                                    </FrontLayerContainer>
                                                )
                                            }
                                        }
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Col>
                        {props.children({ handleSave, isLoading, form })}
                    </>
                )}
            </FormWithAction>
        </>
    )
}
