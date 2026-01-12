import {
    useGetTicketSourcesQuery,
    useGetPropertyByIdQuery,
    useGetInvoicesByIdsQuery,
    CreateTicketMutation,
    UpdateTicketMutation,
} from '@app/condo/gql'
import {
    BuildingUnitSubType,
    Organization,
    TicketFile as TicketFileType,
    TicketStatusTypeType,
} from '@app/condo/schema'
import { Affix, Col, ColProps, Form, FormItemProps, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import dayjs from 'dayjs'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import isFunction from 'lodash/isFunction'
import isNull from 'lodash/isNull'
import omit from 'lodash/omit'
import throttle from 'lodash/throttle'
import React, { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { PlusCircle, QuestionCircle } from '@open-condo/icons'
import { useApolloClient } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import {
    Typography,
    Alert,
    Space,
    Tooltip,
    Checkbox,
} from '@open-condo/ui'

import { CONTEXT_FINISHED_STATUS } from '@condo/domains/acquiring/constants/context'
import { AcquiringIntegrationContext } from '@condo/domains/acquiring/utils/clientSchema'
import Input from '@condo/domains/common/components/antd/Input'
import Select from '@condo/domains/common/components/antd/Select'
import {
    FormWithAction,
    IFormWithActionChildren,
    OnCompletedMsgType,
} from '@condo/domains/common/components/containers/FormList'
import { FadeCol } from '@condo/domains/common/components/FadeCol/FadeCol'
import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import { FrontLayerContainer } from '@condo/domains/common/components/FrontLayerContainer'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { Loader } from '@condo/domains/common/components/Loader'
import { useMultipleFileUploadHook } from '@condo/domains/common/components/MultipleFileUpload'
import Prompt from '@condo/domains/common/components/Prompt'
import { PROPERTY_REQUIRED_ERROR } from '@condo/domains/common/constants/errors'
import { colors } from '@condo/domains/common/constants/style'
import { useInputWithCounter } from '@condo/domains/common/hooks/useInputWithCounter'
import { convertToOptions } from '@condo/domains/common/utils/filters.utils'
import { normalizeText } from '@condo/domains/common/utils/text'
import { useContactsEditorHook } from '@condo/domains/contact/components/ContactsEditor/useContactsEditorHook'
import { CreateInvoiceForm } from '@condo/domains/marketplace/components/Invoice/CreateInvoiceForm'
import { TicketInvoicesList } from '@condo/domains/marketplace/components/Invoice/TicketInvoicesList'
import { INVOICE_STATUS_DRAFT, INVOICE_STATUS_CANCELED } from '@condo/domains/marketplace/constants'
import { Invoice } from '@condo/domains/marketplace/utils/clientSchema'
import { MANAGING_COMPANY_TYPE, SERVICE_PROVIDER_TYPE } from '@condo/domains/organization/constants/common'
import { PropertyAddressSearchInput } from '@condo/domains/property/components/PropertyAddressSearchInput'
import { UnitInfo, UnitInfoMode } from '@condo/domains/property/components/UnitInfo'
import { PropertyFormItemTooltip } from '@condo/domains/property/PropertyFormItemTooltip'
import { NoSubscriptionTooltip } from '@condo/domains/subscription/components'
import { useOrganizationSubscription } from '@condo/domains/subscription/hooks'
import { IncidentHints } from '@condo/domains/ticket/components/IncidentHints'
import { useTicketThreeLevelsClassifierHook } from '@condo/domains/ticket/components/TicketClassifierSelect'
import {
    TicketFormContextProvider,
    useTicketFormContext,
} from '@condo/domains/ticket/components/TicketForm/TicketFormContext'
import { TicketPropertyHintCard } from '@condo/domains/ticket/components/TicketPropertyHint/TicketPropertyHintCard'
import { MAX_DETAILS_LENGTH } from '@condo/domains/ticket/constants'
import { VISIBLE_TICKET_SOURCE_IDS, TICKET_SOURCE_IDS_BY_TYPE } from '@condo/domains/ticket/constants/sources'
import { useActiveCall } from '@condo/domains/ticket/contexts/ActiveCallContext'
import { TicketFile } from '@condo/domains/ticket/utils/clientSchema'
import { ITicketFormState } from '@condo/domains/ticket/utils/clientSchema/Ticket'
import { getTicketDefaultDeadline } from '@condo/domains/ticket/utils/helpers'
import { RESIDENT } from '@condo/domains/user/constants/common'

import { TicketAssignments } from './TicketAssignments'
import { TicketDeadlineField } from './TicketDeadlineField'
import { TicketDeferredDateField } from './TicketDeferredDateField'
import { useTicketValidations } from './useTicketValidations'

const HINTS_COL_PROPS: ColProps = { span: 24 }
const CURRENT_FORM_VALUES_LOCAL_STORAGE_NAME = 'condoTicketCurrentFormValues'

export const IncidentHintsBlock = ({ organizationId, propertyId }) => {
    const { classifier } = useTicketFormContext()

    return (
        <>
            {
                propertyId && organizationId && (
                    <IncidentHints
                        propertyId={propertyId}
                        organizationId={organizationId}
                        classifier={classifier}
                        colProps={HINTS_COL_PROPS}
                    />
                )
            }
        </>
    )
}

export const ContactsInfo = ({ ContactsEditorComponent, form, selectedPropertyId, disabled = false, initialValues = {}, hasNotResidentTab = true, residentTitle = null, notResidentTitle = null }) => {
    const contactId = useMemo(() => get(initialValues, 'contact'), [initialValues])

    const value = useMemo(() => ({
        id: contactId,
        name: get(initialValues, 'clientName'),
        phone: get(initialValues, 'clientPhone'),
    }), [contactId, initialValues])
    const isResidentTicket = useMemo(() => get(initialValues, 'isResidentTicket'), [initialValues])

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
                initialIsResident={isResidentTicket}
                hasNotResidentTab={hasNotResidentTab}
                residentTitle={residentTitle}
                notResidentTitle={notResidentTitle}
                disabled={disabled}
            />
        )
    }, [ContactsEditorComponent, isResidentTicket, contactEditorComponentFields, disabled, form, hasNotResidentTab, notResidentTitle, residentTitle, selectedPropertyId, value])

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

const AddInvoiceButton = ({ initialValues, form, organizationId, ticketCreatedByResident }) => {
    const intl = useIntl()
    const AddInvoiceMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.ticketInvoice.form.addInvoice' })
    const CreateInvoiceModalTitle = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.create.title' })

    const { link } = useOrganization()
    const canManageInvoices = get(link, 'role.canManageInvoices', false)

    // Subscription check for marketplace feature
    const { isFeatureAvailable } = useOrganizationSubscription()
    const hasMarketplaceFeature = isFeatureAvailable('marketplace')

    const [createInvoiceModalOpen, setCreateInvoiceModalOpen] = useState<boolean>(false)

    const handleCreateInvoice = useCallback(async (values) => {
        const rawRows = get(values, 'rows', [])
        const processedRows = Invoice.processRowsFromInvoiceTicketForm(rawRows, intl)

        const invoiceValues = {
            ...values,
            organization: organizationId,
            rows: processedRows,
        }

        const newInvoices = form.getFieldValue('newInvoices') || []

        form.setFieldsValue({
            newInvoices: [
                ...newInvoices,
                invoiceValues,
            ],
        })

        setCreateInvoiceModalOpen(false)
        return
    }, [form, intl, organizationId])

    if (!canManageInvoices) {
        return null
    }

    if (!hasMarketplaceFeature) {
        return (
            <NoSubscriptionTooltip>
                <div>
                    <Col style={{ cursor: 'not-allowed' }}>
                        <Space size={4} direction='horizontal'>
                            <PlusCircle color={colors.gray[5]} />
                            <Typography.Text size='medium' strong type='secondary'>{AddInvoiceMessage}</Typography.Text>
                        </Space>
                    </Col>
                </div>
            </NoSubscriptionTooltip>
        )
    }

    return (
        <>
            <Col style={{ cursor: 'pointer' }} onClick={() => setCreateInvoiceModalOpen(true)}>
                <Space size={4} direction='horizontal'>
                    <PlusCircle />
                    <Typography.Text size='medium' strong>{AddInvoiceMessage}</Typography.Text>
                </Space>
            </Col>
            {
                createInvoiceModalOpen && (
                    <CreateInvoiceForm
                        organizationId={organizationId}
                        action={handleCreateInvoice}
                        initialValues={initialValues}
                        modalFormProps={{
                            ModalTitleMsg: CreateInvoiceModalTitle,
                            visible: createInvoiceModalOpen,
                            showCancelButton: false,
                            cancelModal: () => setCreateInvoiceModalOpen(false),
                            modalProps: { width: 'big', destroyOnClose: true },
                        }}
                        ticketCreatedByResident={ticketCreatedByResident}
                    />
                )
            }
        </>
    )
}

const TicketFormInvoicesEmptyContent = ({
    organizationId, initialValues, form, ticketCreatedByResident,
}) => {
    const intl = useIntl()
    const AlertMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.ticketInvoice.form.noContextAlert.message' })
    const AlertDescription = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.ticketInvoice.form.noContextAlert.description' })
    const AlertDescriptionLink = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.ticketInvoice.form.noContextAlert.descriptionLink' })
    const NoInvoicesMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.ticketInvoice.form.noInvoices' })

    const { obj: invoiceContext, loading } = AcquiringIntegrationContext.useObject({
        where: {
            organization: { id: organizationId },
            invoiceStatus: CONTEXT_FINISHED_STATUS,
        },
    })

    const { link } = useOrganization()
    const canManageInvoices = get(link, 'role.canManageInvoices', false)
    const canManageMarketPlace = get(link, 'role.canManageMarketplace', false)

    if (loading) return <Loader />
    if (!invoiceContext) {
        if (!canManageMarketPlace) {
            return <></>
        }

        return (
            <FadeCol span={24}>
                <Alert
                    type='warning'
                    showIcon
                    message={AlertMessage}
                    description={
                        <Space direction='vertical' size={4}>
                            <Typography.Paragraph size='medium'>
                                {AlertDescription}
                            </Typography.Paragraph>
                            <Typography.Link size='large' href='/marketplace' target='_blank'>
                                {AlertDescriptionLink}
                            </Typography.Link>
                        </Space>
                    }
                />
            </FadeCol>
        )
    }

    if (!canManageInvoices) {
        return <></>
    }

    return (
        <Col span={24} md={18}>
            <FocusContainer margin='0'>
                <Row gutter={[0, 40]}>
                    <Col span={24}>
                        <Typography.Text size='medium' type='secondary'>{NoInvoicesMessage}</Typography.Text>
                    </Col>
                    <Col span={24}>
                        <Row style={{ paddingBottom:'24px' }} justify='center' align='middle'>
                            <AddInvoiceButton
                                initialValues={initialValues}
                                form={form}
                                organizationId={organizationId}
                                ticketCreatedByResident={ticketCreatedByResident}
                            />
                        </Row>
                    </Col>
                </Row>
            </FocusContainer>
        </Col>
    )
}

const TicketFormInvoices = ({ newInvoices, existedInvoices, invoiceIds, organizationId, initialValues, ticketCreatedByResident, initialInvoiceIds, form }) => {
    const { persistor } = useCachePersistor()
    const {
        data: invoicesData,
    } = useGetInvoicesByIdsQuery({
        variables: {
            ids: invoiceIds,
        },
        skip: !persistor || !invoiceIds,
    })
    const invoices = useMemo(() => invoicesData?.invoices?.filter(Boolean) || [], [invoicesData?.invoices])

    const { link } = useOrganization()
    const canManageInvoices = get(link, 'role.canManageInvoices', false)
    const canReadInvoices = get(link, 'role.canReadInvoices', false)

    useDeepCompareEffect(() => {
        const initialInvoicesInNotDraftStatus = invoices.filter(invoice =>
            initialInvoiceIds && initialInvoiceIds.includes(invoice.id) && invoice.status !== INVOICE_STATUS_DRAFT
        )
        const invoicesInNotCanceledStatus = invoices.filter(invoice => invoice.status !== INVOICE_STATUS_CANCELED)

        form.setFieldsValue({
            initialNotDraftInvoices: initialInvoicesInNotDraftStatus.map(invoice => invoice.id),
            invoicesInNotCanceledStatus: invoicesInNotCanceledStatus.map(invoice => invoice.id),
            existedInvoices: invoices,
        })
    }, [invoices])

    if (isEmpty(invoiceIds) && isEmpty(newInvoices)) {
        return (
            <TicketFormInvoicesEmptyContent
                organizationId={organizationId}
                initialValues={initialValues}
                form={form}
                ticketCreatedByResident={ticketCreatedByResident}
            />
        )
    }

    if (!canReadInvoices) {
        return <></>
    }

    return (
        <Col span={24} md={18}>
            <Row gutter={[0, 40]}>
                <Col span={24}>
                    <TicketInvoicesList
                        organizationId={organizationId}
                        newInvoices={newInvoices}
                        form={form}
                        existedInvoices={existedInvoices}
                        initialValues={initialValues}
                        ticketCreatedByResident={ticketCreatedByResident}
                    />
                </Col>
                {
                    canManageInvoices && (
                        <AddInvoiceButton
                            initialValues={initialValues}
                            form={form}
                            organizationId={organizationId}
                            ticketCreatedByResident={ticketCreatedByResident}
                        />
                    )
                }
                <Form.Item hidden name='newInvoices' />
                <Form.Item hidden name='existedInvoices' />
                <Form.Item hidden name='initialNotDraftInvoices' />
                <Form.Item hidden name='invoicesInNotCanceledStatus' />
            </Row>
        </Col>
    )
}

export const TicketInfo = ({ organizationId, form, validations, UploadComponent, initialValues, disableUserInteraction }) => {
    const intl = useIntl()
    const TicketDeadlineLabel = intl.formatMessage({ id: 'TicketDeadline' })
    const TicketDeferredDeadlineLabel = intl.formatMessage({ id: 'TicketDeferredDeadline' })
    const DescriptionLabel = intl.formatMessage({ id: 'pages.condo.ticket.field.Description' })
    const EmergencyLabel = intl.formatMessage({ id: 'Emergency' })
    const WarrantyLabel = intl.formatMessage({ id: 'Warranty' })
    const PayableLabel = intl.formatMessage({ id: 'Payable' })
    const DescriptionPlaceholder = intl.formatMessage({ id: 'placeholder.Description' })
    const ClassifierLabel = intl.formatMessage({ id: 'Classifier' })
    const CancelTicketInvoicesMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.ticketInvoice.form.disableIsPayableTooltip' })

    const { organization } = useOrganization()
    const { breakpoints } = useLayoutContext()
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

    const { InputWithCounter, Counter } = useInputWithCounter(Input.TextArea, MAX_DETAILS_LENGTH)
    const handleInputBlur = useCallback(e => predictTicketClassifier(e.target.value), [predictTicketClassifier])

    const createdAt = get(initialValues, 'createdAt', null)

    const handleChangeType = useCallback(() => {
        const { isPayable, isEmergency, isWarranty } = form.getFieldsValue(['isPayable', 'isEmergency', 'isWarranty'])
        const autoAddDays = getTicketDefaultDeadline(ticketSetting, isPayable, isEmergency, isWarranty)
        const startDate = createdAt ? dayjs(createdAt) : dayjs()
        const autoDeadlineValue = isNull(autoAddDays) ? autoAddDays : startDate.add(autoAddDays, 'day')
        form.setFields([{ name: 'deadline', value: autoDeadlineValue }])
        setIsAutoDetectedDeadlineValue(true)
    }, [createdAt, form, setIsAutoDetectedDeadlineValue, ticketSetting])

    const [isPayable, setIsPayable] = useState<boolean>(get(initialValues, 'isPayable'))

    const handlePayableChange = useCallback((e) => {
        const value = get(e, 'target.checked')

        setIsPayable(value)
        handleChangeType()
    }, [handleChangeType])

    const isNoServiceProviderOrganization = useMemo(() => (get(organization, 'type', MANAGING_COMPANY_TYPE) !== SERVICE_PROVIDER_TYPE), [organization])

    const invoicesInNotCanceledStatus = Form.useWatch('invoicesInNotCanceledStatus', form)
    const disableIsPayableCheckbox = useMemo(() =>
        isPayable && invoicesInNotCanceledStatus && invoicesInNotCanceledStatus.length > 0,
    [invoicesInNotCanceledStatus, isPayable])

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
                        <Col span={24}>
                            <Row>
                                <Col span={24}>
                                    <TicketFormItem name='details' rules={validations.details}>
                                        <InputWithCounter
                                            onBlur={handleInputBlur}
                                            placeholder={DescriptionPlaceholder}
                                            style={INPUT_WITH_COUNTER_STYLE}
                                            data-cy='ticket__description-input'
                                            autoSize={{ minRows: 4 }}
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
                                            <Col span={24}>
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
                                                        id='ticket-is-emergency'
                                                        onChange={handleChangeType}
                                                    >
                                                        {EmergencyLabel}
                                                    </Checkbox>
                                                </Form.Item>
                                            </Col>
                                            <Col span={24} lg={6}>
                                                <Tooltip title={disableIsPayableCheckbox && CancelTicketInvoicesMessage}>
                                                    <Form.Item
                                                        name='isPayable'
                                                        valuePropName='checked'
                                                    >
                                                        <Checkbox
                                                            disabled={disableUserInteraction || disableIsPayableCheckbox}
                                                            id='ticket-is-payable'
                                                            onChange={handlePayableChange}
                                                        >
                                                            {PayableLabel}
                                                        </Checkbox>
                                                    </Form.Item>
                                                </Tooltip>
                                            </Col>
                                            <Col span={24} lg={6}>
                                                <Form.Item name='isWarranty' valuePropName='checked'>
                                                    <Checkbox
                                                        disabled={disableUserInteraction}
                                                        id='ticket-is-warranty'
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
                            {
                                isNoServiceProviderOrganization && isPayable && (
                                    <>
                                        <Form.Item
                                            hidden
                                            noStyle
                                            name='invoices'
                                        />
                                        <Form.Item
                                            noStyle
                                            dependencies={['newInvoices', 'existedInvoices', 'invoices', 'property', 'unitName', 'unitType', 'clientPhone', 'clientName']}
                                        >
                                            {
                                                ({ getFieldsValue }) => {
                                                    const {
                                                        newInvoices,
                                                        existedInvoices,
                                                        invoices,
                                                        property,
                                                        unitName,
                                                        unitType,
                                                        clientPhone,
                                                        clientName,
                                                    } = getFieldsValue(['newInvoices', 'existedInvoices', 'invoices', 'property', 'unitName', 'unitType', 'clientPhone', 'clientName'])

                                                    const invoiceInitialValues = {
                                                        property,
                                                        unitName,
                                                        unitType,
                                                        clientPhone,
                                                        clientName,
                                                    }

                                                    return (
                                                        <TicketFormInvoices
                                                            newInvoices={newInvoices}
                                                            existedInvoices={existedInvoices}
                                                            invoiceIds={invoices}
                                                            organizationId={organizationId}
                                                            initialValues={invoiceInitialValues}
                                                            initialInvoiceIds={get(initialValues, 'invoices')}
                                                            ticketCreatedByResident={get(initialValues, 'createdByType') === RESIDENT}
                                                            form={form}
                                                        />
                                                    )
                                                }
                                            }
                                        </Form.Item>
                                    </>
                                )
                            }
                            <Col span={24}>
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
                                <Col span={24}>
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
const DEFAULT_TICKET_SOURCE_ID = TICKET_SOURCE_IDS_BY_TYPE.CALL

export const TicketSourceSelect: React.FC<{ initialSourceId?: string }> = ({
    initialSourceId,
}) => {
    const intl = useIntl()
    const TicketSourceLabel = intl.formatMessage({ id: 'pages.condo.ticket.field.Source.label' })
    const LoadingMessage = intl.formatMessage({ id: 'Loading' })

    const mergedTicketSourcesIds = useMemo(() => {
        const result = [...VISIBLE_TICKET_SOURCE_IDS]
        if (initialSourceId) result.push(initialSourceId)
        return result
    }, [initialSourceId])

    const {
        data: sourcesData,
        loading,
    } = useGetTicketSourcesQuery({
        variables: {
            where: {
                id_in: mergedTicketSourcesIds,
            },
        },
    })
    const isCustomInitialSource = useMemo(() => {
        const initSource = sourcesData?.sources?.find((source) => source.id === initialSourceId) || null
        return !!initSource && !initSource.isDefault
    }, [initialSourceId, sourcesData?.sources])
    const sources = useMemo(
        () => sourcesData?.sources?.filter(Boolean) || [],
        [sourcesData?.sources]
    )
    const sourceOptions = convertToOptions(sources, 'name', 'id')

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
            initialValue={DEFAULT_TICKET_SOURCE_ID}
        >
            <Select
                style={TICKET_SOURCE_SELECT_STYLE}
                options={sourceOptions}
                defaultValue={DEFAULT_TICKET_SOURCE_ID}
                disabled={loading || isCustomInitialSource}
            />
        </Form.Item>
    )
}

const FORM_VALIDATE_TRIGGER = ['onBlur', 'onSubmit']
const TICKET_PROPERTY_HINT_STYLES: CSSProperties = { maxHeight: '11em', maxWidth: '250px' }
const HINTS_WRAPPER_STYLE: CSSProperties = { overflow: 'auto', maxHeight: 'calc(100vh - 220px)', paddingRight: 8 }
const CAN_READ_BY_RESIDENT_WRAPPER_STYLE: CSSProperties = { display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }
const CAN_READ_BY_RESIDENT_ICON_WRAPPER_STYLE: CSSProperties = { padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }

export interface ITicketFormProps {
    organization?: Pick<Organization, 'id'>
    initialValues?: ITicketFormState
    action?: (...args) => Promise<CreateTicketMutation['ticket'] | UpdateTicketMutation['ticket']>
    files?: TicketFileType[]
    afterActionCompleted?: (ticket: CreateTicketMutation['ticket'] | UpdateTicketMutation['ticket']) => void
    OnCompletedMsg?: OnCompletedMsgType<CreateTicketMutation['ticket'] | UpdateTicketMutation['ticket']>
    autoAssign?: boolean
    isExisted?: boolean
    children: React.ReactNode | IFormWithActionChildren
}

export const BaseTicketForm: React.FC<ITicketFormProps> = (props) => {
    const intl = useIntl()
    const AddressLabel = intl.formatMessage({ id: 'field.Address' })
    const AddressPlaceholder = intl.formatMessage({ id: 'placeholder.Address' })
    const AddressNotSelected = intl.formatMessage({ id: 'field.Property.nonSelectedError' })
    const PromptTitle = intl.formatMessage({ id: 'pages.condo.ticket.warning.modal.Title' })
    const PromptHelpMessage = intl.formatMessage({ id: 'pages.condo.ticket.warning.modal.HelpMessage' })
    const CanReadByResidentMessage = intl.formatMessage({ id: 'pages.condo.ticket.field.CanReadByResident' })
    const AttachCallRecordMessage = intl.formatMessage({ id: 'pages.condo.ticket.field.AttachCallRecord' })
    const CanReadByResidentTooltip = intl.formatMessage({ id: 'pages.condo.ticket.field.CanReadByResident.tooltip' })
    const TicketNotFromResidentMessage = intl.formatMessage({ id: 'pages.condo.ticket.title.TicketNotFromResident' })
    const TicketFromResidentMessage = intl.formatMessage({ id: 'pages.condo.ticket.title.TicketFromResident' })

    const client = useApolloClient()
    const { breakpoints } = useLayoutContext()
    const { isCallActive } = useActiveCall()
    const { persistor } = useCachePersistor()

    const {
        action: _action,
        initialValues,
        organization,
        afterActionCompleted,
        files,
        autoAssign,
        OnCompletedMsg,
        isExisted,
    } = props
    const validations = useTicketValidations()
    const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(get(initialValues, 'property', null))
    const selectPropertyIdRef = useRef(selectedPropertyId)

    const initialTicketSourceId = useMemo(() => initialValues?.source, [initialValues?.source])

    const {
        data: propertyByIdData,
        loading: organizationPropertiesLoading,
        refetch,
    } = useGetPropertyByIdQuery({
        variables: {
            id: selectedPropertyId,
        },
        skip: !persistor || !selectedPropertyId,
    })
    const property = useMemo(() => propertyByIdData?.properties?.filter(Boolean)[0], [propertyByIdData?.properties])

    const [isPropertyChanged, setIsPropertyChanged] = useState<boolean>(false)
    const initialTicketValues = useMemo(() => isPropertyChanged ? omit(initialValues, ['unitName', 'unitType']) : initialValues, [initialValues, isPropertyChanged])
    const [selectedUnitName, setSelectedUnitName] = useState(get(initialTicketValues, 'unitName'))
    const [selectedUnitType, setSelectedUnitType] = useState<BuildingUnitSubType>(get(initialTicketValues, 'unitType'))
    const [selectedSectionType, setSelectedSectionType] = useState(get(initialTicketValues, 'sectionType'))
    const selectedUnitNameRef = useRef(selectedUnitName)
    const selectedUnitTypeRef = useRef<BuildingUnitSubType>(selectedUnitType)
    const selectedSectionTypeRef = useRef(selectedSectionType)

    useEffect(() => {
        selectPropertyIdRef.current = selectedPropertyId
        if (selectPropertyIdRef.current) {
            refetch()
        }
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
        initialQuery: { organization: { id: organization.id } },
    })

    const organizationId = get(property, ['organization', 'id'], null)

    const addressValidation = useCallback((_, value) => {
        const searchValueLength = get(value, 'length', 0)
        if (searchValueLength === 0) {
            return Promise.resolve()
        }

        return !isEmpty(selectedPropertyId) ? Promise.resolve() : Promise.reject(AddressNotSelected)
    }, [selectedPropertyId, AddressNotSelected])

    const PROPERTY_VALIDATION_RULES = useMemo(() => [...validations.property, { validator: addressValidation }], [addressValidation, validations.property])

    const action = async (variables, ...args) => {
        const { details, ...otherVariables } = variables

        const result = await _action({
            ...otherVariables,
            details: normalizeText(details),
        }, ...args)

        await syncModifiedFiles(result.id)

        // NOTE: remove any current values from local storage
        if (typeof window !== 'undefined' && !isExisted) {
            window.localStorage.removeItem(CURRENT_FORM_VALUES_LOCAL_STORAGE_NAME)
        }

        // NOTE: update queries, related to objects, which may be created in ticket form
        client.cache.evict({ id: 'ROOT_QUERY', fieldName: 'allTickets' })
        client.cache.evict({ id: 'ROOT_QUERY', fieldName: 'allTicketObservers' })
        client.cache.evict({ id: 'ROOT_QUERY', fieldName: '_allTicketsMeta' })
        client.cache.evict({ id: 'ROOT_QUERY', fieldName: 'allTicketChanges' })
        client.cache.evict({ id: 'ROOT_QUERY', fieldName: 'allTicketFiles' })
        client.cache.evict({ id: 'ROOT_QUERY', fieldName: 'allContacts' })
        client.cache.evict({ id: 'ROOT_QUERY', fieldName: 'allInvoices' })
        client.cache.gc()

        if (afterActionCompleted) {
            return afterActionCompleted(result)
        }

        return result
    }

    const initialCanReadByResidentValue = useMemo(() => get(initialValues, 'canReadByResident', true), [initialValues])

    const isResidentTicket = useMemo(() => get(initialValues, ['createdByType']) === RESIDENT, [initialValues])
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
        values.assignee = values.assignee ? values.assignee : null
        return values
    }, [])

    const handlePropertySelectChange = useCallback((form) => (_, option) => {
        setIsPropertyChanged(true)
        form.setFieldsValue({
            unitName: null,
            unitType: null,
            sectionName: null,
            sectionType: null,
            floorName: null,
            property: option.key,
        })
        setSelectedUnitName(null)
        setSelectedUnitType(null)
        setSelectedSectionType(null)
        setSelectedPropertyId(option.key)
    }, [])

    const handlePropertiesSelectClear = useCallback((form) => () => {
        setIsPropertyChanged(true)
        form.setFieldsValue({
            unitName: null,
            unitType: null,
            sectionName: null,
            sectionType: null,
            floorName: null,
            property: null,
        })
        setSelectedUnitName(null)
        setSelectedUnitType(null)
        setSelectedSectionType(null)
        setSelectedPropertyId(null)
    }, [])

    const propertyInfoColSpan = !breakpoints.TABLET_LARGE ? 24 : 17

    const hintsBlock = useMemo(() => (
        <Row gutter={MEDIUM_VERTICAL_GUTTER}>
            <TicketPropertyHintCard
                propertyId={selectedPropertyId}
                hintContentStyle={TICKET_PROPERTY_HINT_STYLES}
                colProps={HINTS_COL_PROPS}
            />
            <IncidentHintsBlock
                organizationId={organizationId}
                propertyId={selectedPropertyId}
            />
        </Row>
    ), [organizationId, selectedPropertyId])

    const [form] = Form.useForm()

    const invoices = Form.useWatch('invoices', form)
    const initialNotDraftInvoices = Form.useWatch('initialNotDraftInvoices', form)

    useEffect(() => {
        if (typeof window !== 'undefined' && !isExisted) {
            try {
                const localStorageValues = window.localStorage.getItem(CURRENT_FORM_VALUES_LOCAL_STORAGE_NAME)
                if (localStorageValues) {
                    const localStorageValuesParsed = JSON.parse(localStorageValues)

                    form.setFieldsValue({
                        details: localStorageValuesParsed.details,
                    })
                }
            } catch (err) {
                console.error(err)
            } finally {
                window.localStorage.removeItem(CURRENT_FORM_VALUES_LOCAL_STORAGE_NAME)
            }
        }
    }, [form])

    const saveFormValuesToLocalStorage = (event) => {
        if (typeof window !== 'undefined' && !isExisted) {
            const currentValue = window.localStorage.getItem(CURRENT_FORM_VALUES_LOCAL_STORAGE_NAME) || '{}'
            try {
                const newValue = JSON.parse(currentValue)
                const fieldNames = Object.keys(event)

                fieldNames.forEach((fieldName) => {
                    const value = event[fieldName]
                    if (!fieldName) { return }
                    newValue[fieldName] = value
                })

                window.localStorage.setItem(CURRENT_FORM_VALUES_LOCAL_STORAGE_NAME, JSON.stringify(newValue))
            } catch (err) {
                window.localStorage.removeItem(CURRENT_FORM_VALUES_LOCAL_STORAGE_NAME)
                console.error(err)
            }
        }
    }

    const formWithAction =  (
        <>
            <FormWithAction
                action={action}
                initialValues={initialTicketValues}
                validateTrigger={FORM_VALIDATE_TRIGGER}
                formValuesToMutationDataPreprocessor={formValuesToMutationDataPreprocessor}
                ErrorToFormFieldMsgMapping={ErrorToFormFieldMsgMapping}
                OnCompletedMsg={OnCompletedMsg}
                formInstance={form}
                onValuesChange={throttle(saveFormValuesToLocalStorage, 100)}
            >
                {({ handleSave, isLoading, form }) => (
                    <>
                        <Prompt
                            title={PromptTitle}
                            form={form}
                            handleSave={handleSave}
                        >
                            <Typography.Paragraph type='secondary'>
                                {PromptHelpMessage}
                            </Typography.Paragraph>
                        </Prompt>
                        <Col span={24}>
                            <Row gutter={BIG_HORIZONTAL_GUTTER} justify='space-between'>
                                <Col span={propertyInfoColSpan}>
                                    <Row gutter={[0, 20]}>
                                        <Col>
                                            <Row gutter={BIG_VERTICAL_GUTTER}>
                                                <Col span={24} lg={7}>
                                                    <TicketSourceSelect initialSourceId={initialTicketSourceId} />
                                                </Col>
                                                <Col span={24}>
                                                    <Row gutter={BIG_HORIZONTAL_GUTTER} justify='space-between'>
                                                        <Col span={24}>
                                                            <Row gutter={BIG_VERTICAL_GUTTER}>
                                                                <Col span={24}>
                                                                    <Row gutter={SMALL_VERTICAL_GUTTER}>
                                                                        <Col span={24} data-cy='ticket__property-address-search-input'>
                                                                            <TicketFormItem
                                                                                name='property'
                                                                                label={AddressLabel}
                                                                                rules={PROPERTY_VALIDATION_RULES}
                                                                                tooltip={<PropertyFormItemTooltip />}
                                                                            >
                                                                                <PropertyAddressSearchInput
                                                                                    organizationId={get(organization, 'id')}
                                                                                    autoFocus
                                                                                    onSelect={handlePropertySelectChange(form)}
                                                                                    onClear={handlePropertiesSelectClear(form)}
                                                                                    placeholder={AddressPlaceholder}
                                                                                    disabled={!isEmpty(invoices)}
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
                                                                                disabled={!isEmpty(initialNotDraftInvoices)}
                                                                            />
                                                                        )}
                                                                    </Row>
                                                                </Col>
                                                                {
                                                                    selectedPropertyId && !breakpoints.DESKTOP_LARGE && (
                                                                        <Col span={24}>
                                                                            {hintsBlock}
                                                                        </Col>
                                                                    )
                                                                }
                                                                <ContactsInfo
                                                                    ContactsEditorComponent={ContactsEditorComponent}
                                                                    form={form}
                                                                    initialValues={initialTicketValues}
                                                                    selectedPropertyId={selectedPropertyId}
                                                                    disabled={!isEmpty(initialNotDraftInvoices)}
                                                                    residentTitle={TicketFromResidentMessage}
                                                                    notResidentTitle={TicketNotFromResidentMessage}
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
                                                                            organizationId={organizationId}
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
                                                                                                        id='ticket-can-read-by-resident'
                                                                                                    >
                                                                                                        <div style={CAN_READ_BY_RESIDENT_WRAPPER_STYLE}>
                                                                                                            <Typography.Text>
                                                                                                                {CanReadByResidentMessage}
                                                                                                            </Typography.Text>
                                                                                                            <Tooltip title={CanReadByResidentTooltip}>
                                                                                                                <div style={CAN_READ_BY_RESIDENT_ICON_WRAPPER_STYLE}>
                                                                                                                    <QuestionCircle size='small' />
                                                                                                                </div>
                                                                                                            </Tooltip>
                                                                                                        </div>
                                                                                                    </Checkbox>
                                                                                                </Form.Item>
                                                                                            </Col>
                                                                                        )
                                                                                    }
                                                                                    {
                                                                                        !isExisted && isCallActive && (
                                                                                            <Col span={24}>
                                                                                                <Form.Item name='attachCallRecord' valuePropName='checked' initialValue={true}>
                                                                                                    <Checkbox
                                                                                                        disabled={disableUserInteraction}
                                                                                                        id='ticket-attach-call-record'
                                                                                                    >
                                                                                                        {AttachCallRecordMessage}
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
                                            </Row>
                                        </Col>
                                        {isFunction(props.children) && (
                                            <Col span={24}>
                                                {props.children({ handleSave, isLoading, form })}
                                            </Col>
                                        )}
                                    </Row>
                                </Col>

                                <Col span={24 - propertyInfoColSpan}>
                                    {
                                        selectedPropertyId && breakpoints.DESKTOP_LARGE && (
                                            <Affix offsetTop={60}>
                                                <div style={HINTS_WRAPPER_STYLE}>
                                                    {hintsBlock}
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
