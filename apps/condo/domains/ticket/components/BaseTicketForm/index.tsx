import {
    BuildingUnitSubType,
    Organization,
    OrganizationEmployeeRole,
    PropertyWhereInput,
    Ticket,
    TicketFile as TicketFileType,
    TicketStatusTypeType,
    TicketSource as TicketSourceType,
} from '@app/condo/schema'
import { Affix, Alert, Col, Form, FormItemProps, Row, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import dayjs from 'dayjs'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import isFunction from 'lodash/isFunction'
import isNull from 'lodash/isNull'
import omit from 'lodash/omit'
import { useRouter } from 'next/router'
import React, { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'

import Checkbox from '@condo/domains/common/components/antd/Checkbox'
import Input from '@condo/domains/common/components/antd/Input'
import Select from '@condo/domains/common/components/antd/Select'
import { Button } from '@condo/domains/common/components/Button'
import { FormWithAction, OnCompletedMsgType } from '@condo/domains/common/components/containers/FormList'
import { FrontLayerContainer } from '@condo/domains/common/components/FrontLayerContainer'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { useMultipleFileUploadHook } from '@condo/domains/common/components/MultipleFileUpload'
import Prompt from '@condo/domains/common/components/Prompt'
import { PROPERTY_REQUIRED_ERROR } from '@condo/domains/common/constants/errors'
import { colors } from '@condo/domains/common/constants/style'
import { useInputWithCounter } from '@condo/domains/common/hooks/useInputWithCounter'
import { convertToOptions } from '@condo/domains/common/utils/filters.utils'
import { normalizeText } from '@condo/domains/common/utils/text'
import { useContactsEditorHook } from '@condo/domains/contact/components/ContactsEditor/useContactsEditorHook'
import { PropertyAddressSearchInput } from '@condo/domains/property/components/PropertyAddressSearchInput'
import { UnitInfo, UnitInfoMode } from '@condo/domains/property/components/UnitInfo'
import { Property } from '@condo/domains/property/utils/clientSchema'
import { useTicketThreeLevelsClassifierHook } from '@condo/domains/ticket/components/TicketClassifierSelect'
import {
    TicketFormContextProvider,
    useTicketFormContext,
} from '@condo/domains/ticket/components/TicketForm/TicketFormContext'
import { TicketPropertyHintCard } from '@condo/domains/ticket/components/TicketPropertyHint/TicketPropertyHintCard'
import { VISIBLE_TICKET_SOURCE_TYPES_IN_TICKET_FORM } from '@condo/domains/ticket/constants/common'
import { TicketFile, TicketSource } from '@condo/domains/ticket/utils/clientSchema'
import { ITicketFormState } from '@condo/domains/ticket/utils/clientSchema/Ticket'
import { getTicketDefaultDeadline } from '@condo/domains/ticket/utils/helpers'
import { RESIDENT } from '@condo/domains/user/constants/common'

import { TicketAssignments } from './TicketAssignments'
import { TicketDeadlineField } from './TicketDeadlineField'
import { TicketDeferredDateField } from './TicketDeferredDateField'
import { useTicketValidations } from './useTicketValidations'

import { IncidentHints } from '../IncidentHints'

export const IncidentHintsBlock = ({ organizationId, propertyId }) => {
    const { classifier } = useTicketFormContext()

    return (
        <>
            {
                propertyId && organizationId && (
                    <Col span={24}>
                        <IncidentHints
                            propertyId={propertyId}
                            organizationId={organizationId}
                            classifier={classifier}
                            onlyActual
                        />
                    </Col>
                )
            }
        </>
    )
}

export const ContactsInfo = ({ ContactsEditorComponent, form, selectedPropertyId, initialValues = {}, hasNotResidentTab = true }) => {
    const contactId = useMemo(() => get(initialValues, 'contact'), [initialValues])

    const value = useMemo(() => ({
        id: contactId,
        name: get(initialValues, 'clientName'),
        phone: get(initialValues, 'clientPhone'),
    }), [contactId, initialValues])

    const contactEditorComponentFields = useMemo(() => ({
        id: 'contact',
        phone: 'clientPhone',
        name: 'clientName',
    }), [])

    const formItemContent = useMemo(() => ({ getFieldsValue }) => {
        const { unitName, unitType } = getFieldsValue(['unitName', 'unitType'])

        return (
            <ContactsEditorComponent
                form={form}
                fields={contactEditorComponentFields}
                value={value}
                // Local `property` cannot be used here, because `PropertyAddressSearchInput`
                // sets `Property.address` as its value, but we need `Property.id` here
                property={selectedPropertyId}
                unitName={unitName}
                unitType={unitType}
                hasNotResidentTab={hasNotResidentTab}
            />
        )
    }, [ContactsEditorComponent, contactEditorComponentFields, form, hasNotResidentTab, selectedPropertyId, value])

    return (
        <Col span={24}>
            <TicketFormItem shouldUpdate noStyle>
                {formItemContent}
            </TicketFormItem>
        </Col>
    )
}

const INPUT_WITH_COUNTER_STYLE = { height: '120px', width: '100%' }
const FORM_FILED_COL_PROPS = { style: { width: '100%', padding: 0 } }
const COUNTER_STYLES = { float: 'right' }
const UPLOAD_COMPONENT_WRAPPER_STYLES = { paddingTop: '24px' }
const SPAN_STYLES = { 'color': colors.brightRed }
const TICKET_INFO_FRONT_LAYOUT_CONTAINER_STYLE = { paddingBottom: 0 }

const BIG_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 60]
const MEDIUM_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 24]
const SMALL_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 10]
const BIG_HORIZONTAL_GUTTER: [Gutter, Gutter] = [60, 0]
const MEDIUM_HORIZONTAL_GUTTER: [Gutter, Gutter] = [40, 0]

export const TicketFormItem: React.FC<FormItemProps> = (props) => (
    <Form.Item labelCol={FORM_FILED_COL_PROPS} wrapperCol={FORM_FILED_COL_PROPS} {...props} />
)

export const TicketInfo = ({ form, validations, UploadComponent, initialValues, disableUserInteraction }) => {
    const intl = useIntl()
    const TicketDeadlineLabel = intl.formatMessage({ id: 'TicketDeadline' })
    const TicketDeferredDeadlineLabel = intl.formatMessage({ id: 'TicketDeferredDeadline' })
    const DescriptionLabel = intl.formatMessage({ id: 'pages.condo.ticket.field.Description' })
    const EmergencyLabel = intl.formatMessage({ id: 'Emergency' })
    const WarrantyLabel = intl.formatMessage({ id: 'Warranty' })
    const PaidLabel = intl.formatMessage({ id: 'Paid' })
    const DescriptionPlaceholder = intl.formatMessage({ id: 'placeholder.Description' })
    const ClassifierLabel = intl.formatMessage({ id: 'Classifier' })

    const { isSmall } = useLayoutContext()
    const { setIsAutoDetectedDeadlineValue, ticketSetting, setClassifier } = useTicketFormContext()

    const afterUpdateRuleId = useCallback(({ ruleId, placeId, categoryId, problemId }) => {
        setClassifier({
            id: ruleId,
            place: { id: placeId },
            category: { id: categoryId },
            problem: { id: problemId },
        })
    }, [setClassifier])

    const {
        ClassifiersEditorComponent,
        predictTicketClassifier,
    } = useTicketThreeLevelsClassifierHook({ initialValues, afterUpdateRuleId })

    const { InputWithCounter, Counter } = useInputWithCounter(Input.TextArea, 500)
    const handleInputBlur = useCallback(e => predictTicketClassifier(e.target.value), [predictTicketClassifier])

    const detailsColSpan = isSmall ? 24 : 20
    const classifierColSpan = isSmall ? 24 : 18
    const deadlineColSpan = isSmall ? 24 : 18

    const createdAt = get(initialValues, 'createdAt', null)

    const handleChangeType = useCallback(() => {
        const { isPaid, isEmergency, isWarranty } = form.getFieldsValue(['isPaid', 'isEmergency', 'isWarranty'])
        const autoAddDays = getTicketDefaultDeadline(ticketSetting, isPaid, isEmergency, isWarranty)
        const startDate = createdAt ? dayjs(createdAt) : dayjs()
        const autoDeadlineValue = isNull(autoAddDays) ? autoAddDays : startDate.add(autoAddDays, 'day')
        form.setFields([{ name: 'deadline', value: autoDeadlineValue }])
        setIsAutoDetectedDeadlineValue(true)
    }, [createdAt, form, setIsAutoDetectedDeadlineValue, ticketSetting])

    return (
        <Col span={24}>
            <Row gutter={BIG_VERTICAL_GUTTER}>
                <Col span={24}>
                    <Row gutter={MEDIUM_VERTICAL_GUTTER}>
                        <Col span={24}>
                            <Typography.Title level={3}>
                                {DescriptionLabel}
                                <span style={SPAN_STYLES}>*</span>
                            </Typography.Title>
                        </Col>
                        <Col span={detailsColSpan}>
                            <Row>
                                <Col span={24}>
                                    <TicketFormItem name='details' rules={validations.details}>
                                        <InputWithCounter
                                            onBlur={handleInputBlur}
                                            placeholder={DescriptionPlaceholder}
                                            style={INPUT_WITH_COUNTER_STYLE}
                                            data-cy='ticket__description-input'
                                        />
                                    </TicketFormItem>
                                    <Counter style={COUNTER_STYLES} />
                                </Col>
                                <Col span={24} style={UPLOAD_COMPONENT_WRAPPER_STYLES}>
                                    <TicketFormItem>
                                        <UploadComponent/>
                                    </TicketFormItem>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Col>
                <Col>
                    <FrontLayerContainer showLayer={disableUserInteraction} isSelectable={false} style={TICKET_INFO_FRONT_LAYOUT_CONTAINER_STYLE}>
                        <Row gutter={BIG_VERTICAL_GUTTER}>
                            <Col span={24}>
                                <Row gutter={MEDIUM_VERTICAL_GUTTER}>
                                    <Col span={24}>
                                        <Row gutter={SMALL_VERTICAL_GUTTER}>
                                            <Col span={24}>
                                                <Typography.Title level={3}>{ClassifierLabel}</Typography.Title>
                                            </Col>
                                            <Col span={classifierColSpan}>
                                                <ClassifiersEditorComponent form={form} disabled={disableUserInteraction}/>
                                            </Col>
                                        </Row>
                                    </Col>
                                    <Col span={24}>
                                        <Row gutter={MEDIUM_HORIZONTAL_GUTTER}>
                                            <Col span={24} lg={6}>
                                                <Form.Item name='isEmergency' valuePropName='checked'>
                                                    <Checkbox
                                                        disabled={disableUserInteraction}
                                                        eventName='TicketCreateCheckboxEmergency'
                                                        onChange={handleChangeType}
                                                    >
                                                        {EmergencyLabel}
                                                    </Checkbox>
                                                </Form.Item>
                                            </Col>
                                            <Col span={24} lg={6}>
                                                <Form.Item name='isPaid' valuePropName='checked'>
                                                    <Checkbox
                                                        disabled={disableUserInteraction}
                                                        eventName='TicketCreateCheckboxIsPaid'
                                                        onChange={handleChangeType}
                                                    >
                                                        {PaidLabel}
                                                    </Checkbox>
                                                </Form.Item>
                                            </Col>
                                            <Col span={24} lg={6}>
                                                <Form.Item name='isWarranty' valuePropName='checked'>
                                                    <Checkbox
                                                        disabled={disableUserInteraction}
                                                        eventName='TicketCreateCheckboxIsWarranty'
                                                        onChange={handleChangeType}
                                                    >
                                                        {WarrantyLabel}
                                                    </Checkbox>
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    </Col>
                                </Row>
                            </Col>
                            <Col span={deadlineColSpan}>
                                <Row gutter={SMALL_VERTICAL_GUTTER}>
                                    <Col span={24}>
                                        <Typography.Title level={3}>{TicketDeadlineLabel}</Typography.Title>
                                    </Col>
                                    <Col span={24}>
                                        <TicketDeadlineField
                                            initialValues={initialValues}
                                            form={form}
                                        />
                                    </Col>
                                </Row>
                            </Col>
                            {
                                initialValues.statusType === TicketStatusTypeType.Deferred &&
                                <Col span={deadlineColSpan}>
                                    <Row gutter={SMALL_VERTICAL_GUTTER}>
                                        <Col span={24}>
                                            <Typography.Title level={3}>{TicketDeferredDeadlineLabel}</Typography.Title>
                                        </Col>
                                        <Col span={24}>
                                            <TicketDeferredDateField />
                                        </Col>
                                    </Row>
                                </Col>
                            }
                        </Row>
                    </FrontLayerContainer>
                </Col>
            </Row>
        </Col>
    )
}

const TICKET_SOURCE_SELECT_STYLE: React.CSSProperties = { width: '100%' }
const DEFAULT_TICKET_SOURCE_CALL_ID = '779d7bb6-b194-4d2c-a967-1f7321b2787f'

export const TicketSourceSelect: React.FC = () => {
    const intl = useIntl()
    const TicketSourceLabel = intl.formatMessage({ id: 'pages.condo.ticket.field.Source.label' })
    const LoadingMessage = intl.formatMessage({ id: 'Loading' })

    const { objs: sources, loading } = TicketSource.useObjects({
        where: { type_in: VISIBLE_TICKET_SOURCE_TYPES_IN_TICKET_FORM },
    })
    const sourceOptions = convertToOptions<TicketSourceType>(sources, 'name', 'id')

    const LoadingSelect = useMemo(() => (
        <Form.Item
            label={TicketSourceLabel}
            required
        >
            <Select
                style={TICKET_SOURCE_SELECT_STYLE}
                disabled={true}
                placeholder={LoadingMessage}
            />
        </Form.Item>
    ), [LoadingMessage, TicketSourceLabel])

    if (loading) return LoadingSelect

    return (
        <Form.Item
            label={TicketSourceLabel}
            required
            name='source'
            data-cy='ticket__source-item'
            initialValue={DEFAULT_TICKET_SOURCE_CALL_ID}
        >
            <Select
                style={TICKET_SOURCE_SELECT_STYLE}
                options={sourceOptions}
                defaultValue={DEFAULT_TICKET_SOURCE_CALL_ID}
                disabled={loading}
            />
        </Form.Item>
    )
}

const FORM_VALIDATE_TRIGGER = ['onBlur', 'onSubmit']
const TICKET_PROPERTY_HINT_STYLES: CSSProperties = { maxHeight: '11em', maxWidth: '250px' }
const HINTS_WRAPPER_STYLE: CSSProperties = { overflow: 'auto', maxHeight: 'calc(100vh - 128px)', paddingRight: 8 }

export interface ITicketFormProps {
    organization?: Organization
    role?: OrganizationEmployeeRole
    initialValues?: ITicketFormState
    action?: (...args) => Promise<Ticket>,
    files?: TicketFileType[],
    afterActionCompleted?: (ticket: Ticket) => void,
    OnCompletedMsg?: OnCompletedMsgType<Ticket>,
    autoAssign?: boolean,
    isExisted?: boolean
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

    const { isSmall, breakpoints } = useLayoutContext()

    const router = useRouter()

    const {
        action: _action,
        initialValues,
        organization,
        role,
        afterActionCompleted,
        files,
        autoAssign,
        OnCompletedMsg,
        isExisted,
    } = props
    const validations = useTicketValidations()
    const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(get(initialValues, 'property', null))
    const selectPropertyIdRef = useRef(selectedPropertyId)

    const propertyWhereQuery: PropertyWhereInput = useMemo(() => ({
        organization: {
            id: organization ? organization.id : null,
        },
        deletedAt: null,
    }), [organization])
    if (selectedPropertyId) {
        propertyWhereQuery['id_in'] = [selectedPropertyId]
    }

    const { loading: organizationPropertiesLoading, objs: organizationProperties, refetch } = Property.useObjects({
        where: propertyWhereQuery,
        first: 1,
        skip: 0,
    })

    const property = useMemo(() => organizationProperties.find(property => property.id === selectedPropertyId), [organizationProperties, selectedPropertyId])

    const [isPropertyChanged, setIsPropertyChanged] = useState<boolean>(false)
    const initialTicketValues = useMemo(() => isPropertyChanged ? omit(initialValues, ['unitName', 'unitType']) : initialValues,
        [initialValues, isPropertyChanged])
    const [selectedUnitName, setSelectedUnitName] = useState(get(initialTicketValues, 'unitName'))
    const [selectedUnitType, setSelectedUnitType] = useState<BuildingUnitSubType>(get(initialTicketValues, 'unitType'))
    const [selectedSectionType, setSelectedSectionType] = useState(get(initialTicketValues, 'sectionType'))
    const [isMatchSelectedProperty, setIsMatchSelectedProperty] = useState(true)
    const selectedUnitNameRef = useRef(selectedUnitName)
    const selectedUnitTypeRef = useRef<BuildingUnitSubType>(selectedUnitType)
    const selectedSectionTypeRef = useRef(selectedSectionType)

    useEffect(() => {
        selectPropertyIdRef.current = selectedPropertyId
        refetch()
    }, [refetch, selectedPropertyId])

    useEffect(() => {
        selectedUnitNameRef.current = selectedUnitName

        if (isNull(selectedUnitName)) {
            setSelectedUnitType(null)
        }
    }, [selectedUnitName])

    useEffect(() => {
        selectedUnitTypeRef.current = selectedUnitType
    }, [selectedUnitType])

    useEffect(() => {
        selectedSectionTypeRef.current = selectedSectionType
    }, [selectedSectionType])

    const { UploadComponent, syncModifiedFiles } = useMultipleFileUploadHook({
        Model: TicketFile,
        relationField: 'ticket',
        initialFileList: files,
    })

    const { ContactsEditorComponent } = useContactsEditorHook({
        role,
        allowLandLine: true,
        initialQuery: { organization: { id: organization.id } },
    })

    const organizationId = get(property, ['organization', 'id'], null)

    const addressValidation = useCallback((_, value) => {
        const searchValueLength = get(value, 'length', 0)
        if (searchValueLength === 0) {
            return Promise.resolve()
        }
        return selectedPropertyId !== undefined && isMatchSelectedProperty
            ? Promise.resolve()
            : Promise.reject(AddressNotSelected)
    }, [selectedPropertyId, isMatchSelectedProperty])

    const PROPERTY_VALIDATION_RULES = useMemo(() => [...validations.property, { validator: addressValidation }], [addressValidation, validations.property])

    const action = async (variables, ...args) => {
        const { details, ...otherVariables } = variables

        const result = await _action({
            ...otherVariables,
            details: normalizeText(details),
        }, ...args)

        await syncModifiedFiles(result.id)

        if (afterActionCompleted) {
            return afterActionCompleted(result)
        }
        return result
    }

    const initialCanReadByResidentValue = useMemo(() => get(initialValues, 'canReadByResident', true), [initialValues])
    const isResidentTicket = useMemo(() => get(initialValues, ['createdBy', 'type']) === RESIDENT, [initialValues])
    const ErrorToFormFieldMsgMapping = useMemo(() => ({
        [PROPERTY_REQUIRED_ERROR]: {
            name: 'property',
            errors: [AddressNotSelected],
        },
    }), [AddressNotSelected])

    const formValuesToMutationDataPreprocessor = useCallback((values) => {
        values.property = selectPropertyIdRef.current
        values.unitName = selectedUnitNameRef.current
        values.unitType = selectedUnitTypeRef.current
        values.sectionType = selectedSectionTypeRef.current
        values.categoryClassifier = undefined // It is necessary for the front to save the logic of work. But use in mutation is not allowed
        values.placeClassifier = undefined // It is necessary for the front to save the logic of work. But use in mutation is not allowed
        values.problemClassifier = undefined // It is necessary for the front to save the logic of work. But use in mutation is not allowed
        values.executor = values.executor ? values.executor : null
        return values
    }, [])

    const handleAddPropertiesClick = useCallback(() => router.push('/property/create'), [router])
    const NoPropertiesAlert = useMemo(() => !organizationPropertiesLoading && isEmpty(organizationProperties) ? (
        <Col span={isSmall ? 24 : 20}>
            <Alert
                showIcon
                type='warning'
                message={
                    <>
                        {NoPropertiesMessage}&nbsp;
                        <Button
                            type='inlineLink'
                            size='small'
                            onClick={handleAddPropertiesClick}
                        >
                            {AddMessage}
                        </Button>
                    </>
                }
            />
        </Col>
    ) : null, [AddMessage, NoPropertiesMessage, handleAddPropertiesClick, isSmall, organizationProperties, organizationPropertiesLoading])

    const handlePropertySelectChange = useCallback((form) => (_, option) => {
        setIsPropertyChanged(true)
        form.setFieldsValue({
            unitName: null,
            unitType: null,
            sectionName: null,
            floorName: null,
        })
        setSelectedUnitName(null)
        setSelectedPropertyId(option.key)
    }, [])

    const handlePropertiesSelectClear = useCallback((form) => () => {
        setIsPropertyChanged(true)
        form.setFieldsValue({
            unitName: null,
            unitType: null,
            sectionName: null,
            floorName: null,
        })
        setSelectedUnitName(null)
        setSelectedPropertyId(null)
    }, [])

    const propertyInfoColSpan = isSmall ? 24 : 17

    const formWithAction =  (
        <>
            <FormWithAction
                action={action}
                initialValues={initialTicketValues}
                validateTrigger={FORM_VALIDATE_TRIGGER}
                formValuesToMutationDataPreprocessor={formValuesToMutationDataPreprocessor}
                ErrorToFormFieldMsgMapping={ErrorToFormFieldMsgMapping}
                OnCompletedMsg={OnCompletedMsg}
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
                        <Col span={24}>
                            <Row gutter={BIG_HORIZONTAL_GUTTER} justify='space-between'>
                                <Col span={propertyInfoColSpan}>
                                    <Row gutter={BIG_VERTICAL_GUTTER}>
                                        <Col span={24} lg={7}>
                                            <TicketSourceSelect />
                                        </Col>
                                        <Col span={24}>
                                            <Row gutter={BIG_HORIZONTAL_GUTTER} justify='space-between'>
                                                <Col span={24}>
                                                    <Row gutter={BIG_VERTICAL_GUTTER}>
                                                        <Col span={24}>
                                                            <Row gutter={SMALL_VERTICAL_GUTTER}>
                                                                {NoPropertiesAlert}
                                                                <Col span={24} data-cy='ticket__property-address-search-input'>
                                                                    <TicketFormItem
                                                                        name='property'
                                                                        label={AddressLabel}
                                                                        rules={PROPERTY_VALIDATION_RULES}
                                                                    >
                                                                        <PropertyAddressSearchInput
                                                                            organization={organization}
                                                                            autoFocus
                                                                            onSelect={handlePropertySelectChange(form)}
                                                                            onClear={handlePropertiesSelectClear(form)}
                                                                            placeholder={AddressPlaceholder}
                                                                            notFoundContent={AddressNotFoundContent}
                                                                            setIsMatchSelectedProperty={setIsMatchSelectedProperty}
                                                                        />
                                                                    </TicketFormItem>
                                                                </Col>
                                                                {selectedPropertyId && (
                                                                    <UnitInfo
                                                                        property={property}
                                                                        loading={organizationPropertiesLoading}
                                                                        setSelectedUnitName={setSelectedUnitName}
                                                                        setSelectedUnitType={setSelectedUnitType}
                                                                        selectedUnitName={selectedUnitName}
                                                                        setSelectedSectionType={setSelectedSectionType}
                                                                        selectedSectionType={selectedSectionType}
                                                                        mode={UnitInfoMode.All}
                                                                        initialValues={initialTicketValues}
                                                                        form={form}
                                                                    />
                                                                )}
                                                            </Row>
                                                        </Col>
                                                        {
                                                            selectedPropertyId && !breakpoints.xl && (
                                                                <Col span={24}>
                                                                    <Row gutter={[0, 24]}>
                                                                        <Col span={24}>
                                                                            <TicketPropertyHintCard
                                                                                propertyId={selectedPropertyId}
                                                                                hintContentStyle={TICKET_PROPERTY_HINT_STYLES}
                                                                            />
                                                                        </Col>
                                                                        <Col span={24}>
                                                                            <IncidentHintsBlock
                                                                                organizationId={organizationId}
                                                                                propertyId={selectedPropertyId}
                                                                            />
                                                                        </Col>
                                                                    </Row>
                                                                </Col>
                                                            )
                                                        }
                                                        <ContactsInfo
                                                            ContactsEditorComponent={ContactsEditorComponent}
                                                            form={form}
                                                            initialValues={initialTicketValues}
                                                            selectedPropertyId={selectedPropertyId}
                                                        />
                                                    </Row>
                                                </Col>

                                            </Row>
                                        </Col>
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
                                                            <Row gutter={BIG_VERTICAL_GUTTER}>
                                                                <TicketInfo
                                                                    form={form}
                                                                    UploadComponent={UploadComponent}
                                                                    validations={validations}
                                                                    initialValues={initialValues}
                                                                    disableUserInteraction={disableUserInteraction}
                                                                />
                                                                <Col>
                                                                    <FrontLayerContainer showLayer={disableUserInteraction} isSelectable={false}>
                                                                        <Row gutter={BIG_VERTICAL_GUTTER}>
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
                                                                                        <Form.Item name='canReadByResident' valuePropName='checked' initialValue={initialCanReadByResidentValue}>
                                                                                            <Checkbox
                                                                                                disabled={disableUserInteraction}
                                                                                                eventName='TicketCreateCheckboxCanReadByResident'
                                                                                            >
                                                                                                {CanReadByResidentMessage}
                                                                                            </Checkbox>
                                                                                        </Form.Item>
                                                                                    </Col>
                                                                                )
                                                                            }
                                                                        </Row>
                                                                    </FrontLayerContainer>
                                                                </Col>
                                                            </Row>
                                                        )
                                                    }
                                                }
                                            </Form.Item>
                                        </Col>
                                        {isFunction(props.children) && (
                                            props.children({ handleSave, isLoading, form })
                                        )}
                                    </Row>
                                </Col>

                                <Col span={24 - propertyInfoColSpan}>
                                    {
                                        selectedPropertyId && breakpoints.xl && (
                                            <Affix offsetTop={60}>
                                                <div style={HINTS_WRAPPER_STYLE}>
                                                    <Row gutter={[0, 24]}>
                                                        <Col span={24}>
                                                            <TicketPropertyHintCard
                                                                propertyId={selectedPropertyId}
                                                                hintContentStyle={TICKET_PROPERTY_HINT_STYLES}
                                                            />
                                                        </Col>
                                                        <Col span={24}>
                                                            <IncidentHintsBlock
                                                                organizationId={organizationId}
                                                                propertyId={selectedPropertyId}
                                                            />
                                                        </Col>
                                                    </Row>
                                                </div>
                                            </Affix>
                                        )
                                    }
                                </Col>
                            </Row>
                        </Col>
                    </>
                )}
            </FormWithAction>
        </>
    )

    return (
        <TicketFormContextProvider organizationId={organizationId} isExistedTicket={isExisted}>
            {formWithAction}
        </TicketFormContextProvider>
    )
}
