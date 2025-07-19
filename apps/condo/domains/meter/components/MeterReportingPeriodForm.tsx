import { MeterReportingPeriod as MeterReportingPeriodType } from '@app/condo/schema'
import { Col, Form, Row, RowProps, Typography } from 'antd'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import isNil from 'lodash/isNil'
import { useRouter } from 'next/router'
import React, { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Radio, RadioGroup, Select, Space, Alert, Checkbox } from '@open-condo/ui'

import { ButtonWithDisabledTooltip } from '@condo/domains/common/components/ButtonWithDisabledTooltip'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { DeleteButtonWithConfirmModal } from '@condo/domains/common/components/DeleteButtonWithConfirmModal'
import { GraphQlSearchInput } from '@condo/domains/common/components/GraphQlSearchInput'
import { GraphQlSearchInputWithCheckAll } from '@condo/domains/common/components/GraphQlSearchInputWithCheckAll'
import { LabelWithInfo } from '@condo/domains/common/components/LabelWithInfo'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { METER_REPORTING_PERIOD_STRICT_RULE } from '@condo/domains/common/constants/featureflags'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { DAY_SELECT_OPTIONS, RESTRICTION_END_DAY_DEFAULT } from '@condo/domains/meter/constants/constants'
import { METER_TAB_TYPES, METER_TYPES, MeterReportingPeriod } from '@condo/domains/meter/utils/clientSchema'
import { usePropertyValidations } from '@condo/domains/property/components/BasePropertyForm/usePropertyValidations'
import { searchOrganizationPropertyWithoutPropertyHint } from '@condo/domains/ticket/utils/clientSchema/search'

import type { FormRule as Rule } from 'antd'


const INPUT_LAYOUT_PROPS = {
    labelCol: {
        span: 8,
    },
    wrapperCol: {
        span: 8,
    },
}
const ADDRESS_LAYOUT_PROPS = {
    labelCol: {
        span: 8,
    },
    wrapperCol: {
        span: 14,
    },
}

const SELECT_POSTFIX_STYLE: CSSProperties = { margin: '0 0 0 10px' }
const ADDRESS_SEARCH_WRAPPER_COL = { span: 14 }
const STRICT_PERIOD_WRAPPER_COL = { span: 14 }
const VERTICAL_MEDIUM_GUTTER: RowProps['gutter'] = [0, 40]
const VERTICAL_BIG_GUTTER: RowProps['gutter'] = [0, 60]
const FULL_SPAN = 24

interface IMeterReportingPeriodForm {
    mode: 'create' | 'update'
    action: (data: any) => Promise<MeterReportingPeriodType> | Promise<void>
    reportingPeriodRecord?: MeterReportingPeriodType
}

export const MeterReportingPeriodForm: React.FC<IMeterReportingPeriodForm> = ({ mode, reportingPeriodRecord, action }) => {
    const intl = useIntl()

    const OrMessage = intl.formatMessage({ id: 'Or' })
    const DeleteButtonLabel = intl.formatMessage({ id: 'Delete' })
    const AddressLabel = intl.formatMessage({ id: 'field.Address' })
    const SubmitButtonApplyLabel = intl.formatMessage({ id: 'ApplyChanges' })
    const SubmitButtonCreateLabel = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.create.save.button' })
    const AddressPlaceholderMessage = intl.formatMessage({ id: 'placeholder.Address' })
    const ErrorsContainerTitle = intl.formatMessage({ id: 'errorsContainer.requiredErrors' })
    const StartLabel = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.create.start' })
    const FinishLabel = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.create.finish' })
    const AddressPlaceholderLabel = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.create.addressPlaceholder' })
    const AddressPlaceholderDefaultPeriodLabel = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.create.addressPlaceholderIfDefaultPeriod' })
    const OrganizationLabel = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.create.organizationPeriod' })
    const OrganizationTooltipMessage = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.create.organizationTooltip' })
    const DescriptionMessage = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.create.descriptionMessage' })
    const InputPostfixMessage = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.create.inputPostfix' })
    const StrictPeriodMessage = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.create.settings.periodType.strict' })
    const NotStrictPeriodMessage = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.create.settings.periodType.notStrict' })
    const PeriodTypeLabel = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.create.settings.periodType' })
    const ResitrictionsSetupTitle = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.create.settings.title' })
    const NotStrictPeriodTooltip = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.create.settings.notStrict.tooltip' })
    const StrictPeriodNotAllowedTooltip = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.create.settings.strictPeriodRestricted.tooltip' })
    const ResitrictionsSetupAlert = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.create.settings.alert' })
    const ConfirmDeleteTitle = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.update.ConfirmDeleteTitle' })
    const ConfirmDeleteMessage = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.update.ConfirmDeleteMessage' })
    
    const { organization } = useOrganization()
    const router = useRouter()
    const { useFlag } = useFeatureFlags()
    const [form] = Form.useForm()

    const [isOrganizationPeriod, setIsOrganizationPeriod] = useState(false)
    const [selectedPropertyId, setSelectedPropertyId] = useState()
    const [restrictionEndDay, setRestrictionEndDay] = useState(null)

    const { breakpoints } = useLayoutContext()
    const isSmallWindow = !breakpoints.TABLET_LARGE

    const isCreateMode = mode === 'create'
    const formInitialValues = useMemo(() => ({
        notifyStartDay: isCreateMode ? 20 : get(reportingPeriodRecord, 'notifyStartDay'),
        notifyEndDay: isCreateMode ? 25 : get(reportingPeriodRecord, 'notifyEndDay'),
        property: isCreateMode ? undefined : get(reportingPeriodRecord, 'property.address'),
        isOrganizationPeriod: isCreateMode ? false : get(reportingPeriodRecord, 'property') === null,
        restrictionEndDay: isCreateMode ? null : get(reportingPeriodRecord, 'restrictionEndDay'),
    }), [isCreateMode, reportingPeriodRecord])

    const startNumberRef = useRef<number>(formInitialValues.notifyStartDay)
    const finishNumberRef = useRef<number>(formInitialValues.notifyEndDay)
    const [selectRerender, execSelectRerender] = useState()
    const selectedPropertyIdRef = useRef(selectedPropertyId)
    const restrictionEndDayRef = useRef(restrictionEndDay)
    const StrictPeriodTooltip = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.create.settings.strict.tooltip' }, { notifyEndDay: finishNumberRef.current })

    const isMeterReportingPeriodStrictRuleEnabled = useFlag(METER_REPORTING_PERIOD_STRICT_RULE)

    useEffect(() => {
        selectedPropertyIdRef.current = selectedPropertyId
        restrictionEndDayRef.current = restrictionEndDay
    }, [selectedPropertyId, restrictionEndDay])

    const organizationId = get(organization, 'id', null)

    useEffect(() => {
        if (!isCreateMode) {
            setSelectedPropertyId(get(reportingPeriodRecord, 'property.id'))
            setIsOrganizationPeriod(formInitialValues.isOrganizationPeriod)
        }
    }, [])

    const { requiredValidator } = useValidations()
    const { addressValidator } = usePropertyValidations()

    const validations: { [key: string]: Rule[] } = {
        property: [addressValidator(selectedPropertyId, true)],
        notifyStartDay: [requiredValidator],
        notifyEndDay: [requiredValidator],
    }

    const handleCheckboxChange = useCallback(() => {
        setIsOrganizationPeriod(!isOrganizationPeriod)
        if (!isOrganizationPeriod) {
            setSelectedPropertyId(undefined)
            form.setFieldValue('property', undefined)
        }
    }, [isOrganizationPeriod])


    const handleStartChange = useCallback((value) => {
        startNumberRef.current = value
        execSelectRerender(value)
    }, [])

    const handleFinishChange = useCallback((value) => {
        finishNumberRef.current = value
        execSelectRerender(value)
    }, [])

    useEffect(() => {
        if (form.isFieldsTouched(['notifyStartDay', 'notifyEndDay'])) form.validateFields(['notifyStartDay', 'notifyEndDay'])
        if (startNumberRef.current > finishNumberRef.current) {
            setRestrictionEndDay(null)
            form.setFieldValue('restrictionEndDay', null)
        }
    }, [startNumberRef.current, finishNumberRef.current])

    const {
        loading: isPeriodsLoading,
        objs: reportingPeriods,
    } = MeterReportingPeriod.useObjects({
        where: {
            organization: { id: organizationId },
        },
    },
    {
        fetchPolicy: 'network-only',
    })

    const hasOrganizationPeriod = useMemo(() => Boolean(
        reportingPeriods.find(period => isNil(period.property) && !isNil(period.organization) && period.id !== get(reportingPeriodRecord, 'id'))),
    [reportingPeriodRecord, reportingPeriods]
    )

    const periodsWithProperty = reportingPeriods.filter(period => !isNil(period.property))

    const search = useMemo(() => searchOrganizationPropertyWithoutPropertyHint(organizationId, periodsWithProperty.map(period => period.property.id)),
        [organizationId, periodsWithProperty])

    const propertiesFormItemProps = useMemo(() => ({
        name: 'properties',
        label: AddressPlaceholderMessage,
        ...ADDRESS_LAYOUT_PROPS,
    }), [AddressPlaceholderMessage])

    const propertiesSelectProps = useMemo(() => ({
        initialValue: [],
        search,
        disabled: !organizationId,
        eventName: 'PropertyScopeFormSelectProperty',
    }), [organizationId, search])
    
    const handelGQLInputChange = () => {
        setSelectedPropertyId(form.getFieldValue('property'))
    }

    const deleteAction = MeterReportingPeriod.useSoftDelete()
    const handleDeleteButtonClick = useCallback(async () => {
        await deleteAction(reportingPeriodRecord)
        await router.push(`/meter?tab=${METER_TAB_TYPES.reportingPeriod}&type=${METER_TYPES.unit}`)
    }, [deleteAction, reportingPeriodRecord, router])

    return (
        <FormWithAction
            action={action}
            formInstance={form}
            layout='horizontal'
            validateTrigger={['onBlur', 'onSubmit']}
            colon={false}
            initialValues={formInitialValues}
            formValuesToMutationDataPreprocessor={(values) => {
                if (values.isOrganizationPeriod) {
                    values.property = { disconnectAll: true }
                    values.properties = undefined
                } else {
                    values.property = { connect: { id: selectedPropertyIdRef.current } }
                }
                values.isOrganizationPeriod = undefined
                values.notifyStartDay = startNumberRef.current
                values.notifyEndDay = finishNumberRef.current
                values.restrictionEndDay = restrictionEndDayRef.current

                if (isCreateMode) {
                    if (values.properties) {
                        values.property = { disconnectAll: true }
                    }
                    values.organization = { connect: { id: organizationId } }
                } else {
                    values.organization = undefined
                }

                return values
            }}
        >
            {({ handleSave, isLoading }) => {
                return (
                    <Row gutter={VERTICAL_MEDIUM_GUTTER}>
                        <Col span={FULL_SPAN}>
                            <Row gutter={VERTICAL_BIG_GUTTER}>
                                <Col span={FULL_SPAN}>
                                    <Row gutter={VERTICAL_MEDIUM_GUTTER}>
                                        <Col span={FULL_SPAN}>
                                            {isCreateMode && !isPeriodsLoading && 
                                                <GraphQlSearchInputWithCheckAll
                                                    checkAllFieldName='isOrganizationPeriod'
                                                    checkAllInitialValue={formInitialValues.isOrganizationPeriod}
                                                    selectFormItemProps={propertiesFormItemProps}
                                                    selectProps={propertiesSelectProps}
                                                    checkBoxOffset={breakpoints.TABLET_LARGE && 8}
                                                    CheckAllMessage={OrganizationLabel}
                                                    form={form}
                                                    checkboxDisabled={hasOrganizationPeriod}
                                                    onCheckBoxChange={handleCheckboxChange}
                                                />
                                            }
                                            {!isCreateMode && <Form.Item
                                                name='property'
                                                label={AddressLabel}
                                                labelAlign='left'
                                                validateFirst
                                                rules={validations.property}
                                                {...ADDRESS_LAYOUT_PROPS}
                                                wrapperCol={ADDRESS_SEARCH_WRAPPER_COL}>
                                                {!isPeriodsLoading &&
                                                    <GraphQlSearchInput
                                                        label={AddressPlaceholderMessage}
                                                        showArrow={false}
                                                        placeholder={isOrganizationPeriod ? AddressPlaceholderDefaultPeriodLabel : AddressPlaceholderLabel}
                                                        disabled={isOrganizationPeriod}
                                                        onChange={handelGQLInputChange}
                                                        initialValue={isCreateMode ? undefined : selectedPropertyId}
                                                        search={search}
                                                        searchMoreFirst={300}
                                                    />
                                                }
                                            </Form.Item>}
                                        </Col>
                                        {!isCreateMode && <Col span={FULL_SPAN}>
                                            <Form.Item
                                                {...INPUT_LAYOUT_PROPS}
                                                labelAlign='left'
                                                name='isOrganizationPeriod'
                                                label={<LabelWithInfo title={OrganizationTooltipMessage} message={OrganizationLabel} />}
                                                valuePropName='checked'
                                            >
                                                <Checkbox
                                                    checked={isOrganizationPeriod}
                                                    disabled={hasOrganizationPeriod}
                                                    onChange={handleCheckboxChange}
                                                />
                                            </Form.Item>
                                        </Col>}
                                        <Col span={FULL_SPAN}>
                                            <Form.Item
                                                name='notifyStartDay'
                                                rules={validations.notifyStartDay}
                                                label={StartLabel}
                                                {...INPUT_LAYOUT_PROPS}
                                                labelAlign='left'
                                                required
                                                validateFirst
                                            >
                                                <Select
                                                    displayMode='fit-content'
                                                    options={DAY_SELECT_OPTIONS}
                                                    value={startNumberRef.current}
                                                    onChange={handleStartChange}
                                                />
                                                <Typography.Text style={SELECT_POSTFIX_STYLE} type='secondary' >
                                                    {InputPostfixMessage}
                                                </Typography.Text>
                                            </Form.Item>
                                        </Col>
                                        <Col span={FULL_SPAN}>
                                            <Form.Item
                                                name='notifyEndDay'
                                                rules={validations.notifyEndDay}
                                                label={FinishLabel}
                                                {...INPUT_LAYOUT_PROPS}
                                                labelAlign='left'
                                                required
                                                shouldUpdate
                                                validateFirst
                                            >
                                                <Select
                                                    displayMode='fit-content'
                                                    options={DAY_SELECT_OPTIONS}
                                                    value={finishNumberRef.current}
                                                    onChange={handleFinishChange}
                                                />
                                                <Typography.Text style={SELECT_POSTFIX_STYLE} type='secondary' >
                                                    {InputPostfixMessage}
                                                </Typography.Text>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Col>
                                {isMeterReportingPeriodStrictRuleEnabled && (
                                    <Col span={FULL_SPAN}>
                                        <Row gutter={VERTICAL_MEDIUM_GUTTER}>
                                            <Col span={24}>
                                                <Typography.Title level={2}>
                                                    {ResitrictionsSetupTitle}
                                                </Typography.Title>
                                            </Col>
                                            <Col span={24}>
                                                <Form.Item
                                                    {...INPUT_LAYOUT_PROPS}
                                                    wrapperCol={STRICT_PERIOD_WRAPPER_COL}
                                                    labelAlign='left'
                                                    name='restrictionEndDay'
                                                    label={PeriodTypeLabel}
                                                >
                                                    <RadioGroup
                                                        onChange={(event) => {
                                                            const value = event.target.value
                                                            setRestrictionEndDay(value)
                                                        }}
                                                    >
                                                        <Space size={isSmallWindow ? 16 : 40}>
                                                            <Radio
                                                                key='not-strict'
                                                                value={null}
                                                                label={<LabelWithInfo title={NotStrictPeriodTooltip} message={NotStrictPeriodMessage} />}
                                                            />
                                                            <Radio
                                                                key='strict'
                                                                value={RESTRICTION_END_DAY_DEFAULT}
                                                                disabled={startNumberRef.current > finishNumberRef.current}
                                                                label={<LabelWithInfo title={startNumberRef.current < finishNumberRef.current ? StrictPeriodTooltip : StrictPeriodNotAllowedTooltip} message={StrictPeriodMessage} />}
                                                            />
                                                        </Space>
                                                    </RadioGroup>
                                                </Form.Item>
                                            </Col>
                                            {restrictionEndDay !== null && <Col span={18}>
                                                <Alert
                                                    type='info'
                                                    showIcon
                                                    description={ResitrictionsSetupAlert}
                                                />
                                            </Col>}
                                        </Row>
                                    </Col>)}
                            </Row>
                        </Col>
                        <Col span={FULL_SPAN}>
                            <Form.Item
                                noStyle
                                dependencies={['property', 'notifyStartDay', 'notifyEndDay', 'isOrganizationPeriod', 'restrictionEndDay']}
                                shouldUpdate>
                                {
                                    ({ getFieldsValue }) => {
                                        const { property, properties, notifyStartDay, notifyEndDay, isOrganizationPeriod } = getFieldsValue(['property', 'notifyStartDay', 'notifyEndDay', 'isOrganizationPeriod', 'properties'])

                                        const messageLabels = []
                                        if (!property && !isOrganizationPeriod) messageLabels.push(`"${AddressLabel}" ${OrMessage} "${OrganizationLabel}"`)
                                        if (!notifyStartDay) messageLabels.push(`"${StartLabel}"`)
                                        if (!notifyEndDay) messageLabels.push(`"${FinishLabel}"`)

                                        const requiredErrorMessage = !isEmpty(messageLabels) && ErrorsContainerTitle.concat(' ', messageLabels.join(', '))
                                        const errors = [requiredErrorMessage].filter(Boolean).join('')

                                        const isDisabled = (!property && !isOrganizationPeriod && !properties) || !notifyStartDay || !notifyEndDay

                                        return (
                                            <ActionBar
                                                actions={[
                                                    <ButtonWithDisabledTooltip
                                                        key='submit'
                                                        type='primary'
                                                        disabled={isDisabled}
                                                        title={errors}
                                                        onClick={handleSave}
                                                        loading={isLoading}
                                                    >
                                                        {isCreateMode ? SubmitButtonCreateLabel : SubmitButtonApplyLabel}
                                                    </ButtonWithDisabledTooltip>,
                                                    isCreateMode ? <></> : <DeleteButtonWithConfirmModal
                                                        key='delete'
                                                        title={ConfirmDeleteTitle}
                                                        message={ConfirmDeleteMessage}
                                                        okButtonLabel={DeleteButtonLabel}
                                                        action={handleDeleteButtonClick}
                                                        buttonContent={DeleteButtonLabel}
                                                    />,
                                                ]}
                                            />
                                        )
                                    }
                                }
                            </Form.Item>
                        </Col>
                    </Row>
                )
            }}
        </FormWithAction>
    )
}
