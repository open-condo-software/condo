/** @jsx jsx */
import { MeterReportingPeriod as MeterReportingPeriodType } from '@app/condo/schema'
import { jsx } from '@emotion/react'
import { Col, Form, Row, Typography } from 'antd'
import compact from 'lodash/compact'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import { useRouter } from 'next/router'
import { Rule } from 'rc-field-form/lib/interface'
import React, { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Select } from '@open-condo/ui'

import Checkbox from '@condo/domains/common/components/antd/Checkbox'
import { ButtonWithDisabledTooltip } from '@condo/domains/common/components/ButtonWithDisabledTooltip'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { DeleteButtonWithConfirmModal } from '@condo/domains/common/components/DeleteButtonWithConfirmModal'
import { GraphQlSearchInput } from '@condo/domains/common/components/GraphQlSearchInput'
import { LabelWithInfo } from '@condo/domains/common/components/LabelWithInfo'
import { fontSizes } from '@condo/domains/common/constants/style'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { DAY_SELECT_OPTIONS } from '@condo/domains/meter/constants/constants'
import { MeterReportingPeriod } from '@condo/domains/meter/utils/clientSchema'
import { usePropertyValidations } from '@condo/domains/property/components/BasePropertyForm/usePropertyValidations'
import { searchOrganizationPropertyWithoutPropertyHint } from '@condo/domains/ticket/utils/clientSchema/search'


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

const CHECKBOX_STYLE: CSSProperties = { paddingLeft: '0px', fontSize: fontSizes.content }
const SELECT_POSTFIX_STYLE: CSSProperties = { margin: '0 0 0 10px' }
const ADDRESS_SEARCH_WRAPPER_COL = { span: 14 }
const DESCRIPTION_TEXT_STYLE = { alignSelf: 'start' }

interface IMeterReportingPeriodForm {
    mode: 'create' | 'update',
    action: (data: any) => Promise<MeterReportingPeriodType> | Promise<void>,
    reportingPeriodRecord?: MeterReportingPeriodType,
}

export const MeterReportingPeriodForm: React.FC<IMeterReportingPeriodForm> = ({ mode, reportingPeriodRecord, action }) => {
    const intl = useIntl()

    const OrMessage = intl.formatMessage({ id: 'Or' })
    const DeleteButtonLabel = intl.formatMessage({ id: 'Delete' })
    const AddressLabel = intl.formatMessage({ id: 'field.Address' })
    const SubmitButtonApplyLabel = intl.formatMessage({ id: 'ApplyChanges' })
    const SubmitButtonCreateLabel = intl.formatMessage({ id: 'Create' })
    const AddressPlaceholderMessage = intl.formatMessage({ id: 'placeholder.Address' })
    const ErrorsContainerTitle = intl.formatMessage({ id: 'errorsContainer.requiredErrors' })
    const StartLabel = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.create.start' })
    const FinishLabel = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.create.finish' })
    const AddressPlaceholderLabel = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.create.addressPlaceholder' })
    const AddressPlaceholderDefaultPeriodLabel = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.create.addressPlaceholderIfDefaultPeriod' })
    const IncorrectPeriodLabel = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.create.incorrectPeriod' })
    const OrganizationLabel = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.create.organizationPeriod' })
    const OrganizationTooltipMessage = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.create.organizationTooltip' })
    const DescriptionMessage = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.create.descriptionMessage' })
    const InputPostfixMessage = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.create.inputPostfix' })
    const ConfirmDeleteTitle = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.update.ConfirmDeleteTitle' })
    const ConfirmDeleteMessage = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.update.ConfirmDeleteMessage' })

    const { organization } = useOrganization()
    const router = useRouter()
    const [form] = Form.useForm()

    const [isOrganizationPeriod, setIsOrganizationPeriod] = useState(false)
    const [incorrectPeriodError, setIncorrectPeriodError] = useState(false)
    const [selectedPropertyId, setSelectedPropertyId] = useState()

    const isCreateMode = mode === 'create'
    const formInitialValues = useMemo(() => ({
        notifyStartDay: isCreateMode ? 20 : get(reportingPeriodRecord, 'notifyStartDay'),
        notifyEndDay: isCreateMode ? 25 : get(reportingPeriodRecord, 'notifyEndDay'),
        property: isCreateMode ? undefined : get(reportingPeriodRecord, 'property.address'),
        isOrganizationPeriod: isCreateMode ? false : get(reportingPeriodRecord, 'property') === null,
    }), [reportingPeriodRecord, mode])

    const startNumberRef = useRef<number>(formInitialValues.notifyStartDay)
    const finishNumberRef = useRef<number>(formInitialValues.notifyEndDay)
    const [selectRerender, execSelectRerender] = useState()
    const selectedPropertyIdRef = useRef(selectedPropertyId)

    useEffect(() => {
        selectedPropertyIdRef.current = selectedPropertyId
    }, [selectedPropertyId])

    const organizationId = get(organization, 'id', null)

    useEffect(() => {
        if (!isCreateMode) {
            setSelectedPropertyId(get(reportingPeriodRecord, 'property.id'))
            setIsOrganizationPeriod(formInitialValues.isOrganizationPeriod)
        }
    }, [])

    const { requiredValidator } = useValidations()
    const { addressValidator } = usePropertyValidations()
    const incorrectPeriodValidation: (hasError: boolean) => Rule = (hasError) => {
        if (hasError) {
            return { message: IncorrectPeriodLabel }
        }
    }

    const validations: { [key: string]: Rule[] } = {
        property: [addressValidator(selectedPropertyId, true)],
        notifyStartDay: [requiredValidator, incorrectPeriodValidation(incorrectPeriodError)],
        notifyEndDay: [requiredValidator, incorrectPeriodValidation(incorrectPeriodError)],
    }

    const handleCheckboxChange = useCallback(() => {
        setIsOrganizationPeriod(!isOrganizationPeriod)
        if (!isOrganizationPeriod) {
            setSelectedPropertyId(undefined)
            form.setFieldValue('property', undefined)
        }
    }, [isOrganizationPeriod])

    const handleDayChange = useCallback( () => {
        if (startNumberRef.current > finishNumberRef.current) setIncorrectPeriodError(true)
        else setIncorrectPeriodError(false)
    }, [startNumberRef, finishNumberRef])

    const handleStartChange = useCallback((value) => {
        startNumberRef.current = value
        execSelectRerender(value)
        handleDayChange()
    }, [])

    const handleFinishChange = useCallback((value) => {
        finishNumberRef.current = value
        execSelectRerender(value)
        handleDayChange()
    }, [])

    useEffect(() => {
        if (form.isFieldsTouched(['notifyStartDay', 'notifyEndDay'])) form.validateFields(['notifyStartDay', 'notifyEndDay'])
    }, [startNumberRef.current, finishNumberRef.current])

    const {
        loading: isPeriodsLoading,
        objs: reportingPeriods,
        error: periodsLoadingError,
    } = MeterReportingPeriod.useObjects({
        where: {
            organization: { id: organizationId },
        },
    },
    {
        fetchPolicy: 'network-only',
    })

    const hasOrganizationPeriod = Boolean(reportingPeriods.find(period => period.property === null && period.organization !== null))

    const periodsWithProperty = compact(reportingPeriods.map(period => period.property && period))

    const search = useMemo(() => searchOrganizationPropertyWithoutPropertyHint(organizationId, periodsWithProperty.map(period => period.property.id)),
        [organization, isPeriodsLoading])

    const handelGQLInputChange = () => {
        setSelectedPropertyId(form.getFieldValue('property'))
    }

    const deleteAction = MeterReportingPeriod.useSoftDelete()
    const handleDeleteButtonClick = useCallback(async () => {
        await deleteAction(reportingPeriodRecord)
        await router.push('/meter')
    }, [deleteAction, reportingPeriodRecord])

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
                } else {
                    values.property = { connect: { id: selectedPropertyIdRef.current } }
                }
                values.isOrganizationPeriod = undefined
                values.notifyStartDay = startNumberRef.current
                values.notifyEndDay = finishNumberRef.current

                if (isCreateMode) {
                    values.organization = { connect: { id: organizationId } }
                } else {
                    values.organization = undefined
                }

                return values
            }}
        >
            {
                ({ handleSave, isLoading, form }) => {
                    return (
                        <>
                            <Col span={24}>
                                <Row gutter={[0, 40]}>
                                    <Typography.Text style={DESCRIPTION_TEXT_STYLE} type='secondary' >
                                        {DescriptionMessage}
                                    </Typography.Text>
                                    <Col span={24}>
                                        <Form.Item
                                            name='property'
                                            label={AddressLabel}
                                            labelAlign='left'
                                            validateFirst
                                            rules={validations.property}
                                            {...ADDRESS_LAYOUT_PROPS}
                                            wrapperCol={ADDRESS_SEARCH_WRAPPER_COL}>
                                            {
                                                !isPeriodsLoading &&
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
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item
                                            {...INPUT_LAYOUT_PROPS}
                                            labelAlign='left'
                                            name='isOrganizationPeriod'
                                            label={<LabelWithInfo title={OrganizationTooltipMessage} message={OrganizationLabel}/>}
                                            valuePropName='checked'
                                        >
                                            <Checkbox
                                                checked={isOrganizationPeriod}
                                                disabled={hasOrganizationPeriod}
                                                eventName='OrganizationReportingPeriodCheckbox'
                                                style={CHECKBOX_STYLE}
                                                onChange={handleCheckboxChange}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
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
                                    <Col span={24}>
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
                                    <Col span={24}>
                                        <Form.Item
                                            noStyle
                                            dependencies={['property', 'notifyStartDay', 'notifyEndDay', 'isOrganizationPeriod']}
                                            shouldUpdate>
                                            {
                                                ({ getFieldsValue, getFieldError }) => {
                                                    const { property, notifyStartDay, notifyEndDay, isOrganizationPeriod } = getFieldsValue(['property', 'notifyStartDay', 'notifyEndDay', 'isOrganizationPeriod'])

                                                    const messageLabels = []
                                                    if (!property && !isOrganizationPeriod) messageLabels.push(`"${AddressLabel}" ${OrMessage} "${OrganizationLabel}"`)
                                                    if (!notifyStartDay) messageLabels.push(`"${StartLabel}"`)
                                                    if (!notifyEndDay) messageLabels.push(`"${FinishLabel}"`)

                                                    const hasIncorrectPeriodError = incorrectPeriodError ? IncorrectPeriodLabel : undefined
                                                    const requiredErrorMessage = !isEmpty(messageLabels) && ErrorsContainerTitle.concat(' ', messageLabels.join(', '))
                                                    const errors = [hasIncorrectPeriodError, requiredErrorMessage]
                                                        .filter(Boolean)
                                                        .join(', ')

                                                    const isDisabled = (!property && !isOrganizationPeriod) || !notifyStartDay || !notifyEndDay || hasIncorrectPeriodError

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
                            </Col>
                        </>
                    )
                }
            }
        </FormWithAction>
    )
}
