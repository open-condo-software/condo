/** @jsx jsx */
import { MeterReportingPeriod as MeterReportingPeriodType } from '@app/condo/schema'
import { jsx } from '@emotion/react'
import { Col, Form, Row } from 'antd'
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
        span: 4,
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

const ADDRESS_SEARCH_WRAPPER_COL = { span: 14 }

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
    const SubmitButtonLabel = intl.formatMessage({ id: 'ApplyChanges' })
    const AddressPlaceholderMessage = intl.formatMessage({ id: 'placeholder.Address' })
    const ErrorsContainerTitle = intl.formatMessage({ id: 'errorsContainer.requiredErrors' })
    const StartLabel = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.create.start' })
    const FinishLabel = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.create.finish' })
    const IncorrectPeriodLabel = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.create.IncorrectPeriod' })
    const OrganizationLabel = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.create.organizationPeriod' })
    const ConfirmDeleteTitle = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.update.ConfirmDeleteTitle' })
    const ConfirmDeleteMessage = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.update.ConfirmDeleteMessage' })

    const { organization } = useOrganization()
    const router = useRouter()
    const [form] = Form.useForm()

    const [isOrganizationPeriod, setIsOrganizationPeriod] = useState(false)
    const [incorrectPeriodError, setIncorrectPeriodError] = useState(false)
    const [selectedPropertyId, setSelectedPropertyId] = useState()

    const startNumberRef = useRef<number>()
    const finishNumberRef = useRef<number>()
    const selectedPropertyIdRef = useRef(selectedPropertyId)

    useEffect(() => {
        selectedPropertyIdRef.current = selectedPropertyId
    }, [selectedPropertyId])

    const organizationId = get(organization, 'id', null)
    const isCreateMode = mode === 'create'
    const formInitialValues = useMemo(() => ({
        start: get(reportingPeriodRecord, 'start'),
        finish: get(reportingPeriodRecord, 'finish'),
        property: get(reportingPeriodRecord, 'property.address'),
        isOrganizationPeriod: get(reportingPeriodRecord, 'property') === null,
    }), [reportingPeriodRecord])

    useEffect(() => {
        if (!isCreateMode) {
            setSelectedPropertyId(get(reportingPeriodRecord, 'property.id'))
            startNumberRef.current = formInitialValues.start
            finishNumberRef.current = formInitialValues.finish
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
        start: [requiredValidator, incorrectPeriodValidation(incorrectPeriodError)],
        finish: [requiredValidator, incorrectPeriodValidation(incorrectPeriodError)],
    }

    const handleCheckboxChange = useCallback(() => {
        setIsOrganizationPeriod(!isOrganizationPeriod)
        if (!isOrganizationPeriod) {
            setSelectedPropertyId(null)
            form.resetFields(['property'])
        }
    }, [isOrganizationPeriod])

    const handleDayChange = useCallback( () => {
        if (startNumberRef.current > finishNumberRef.current) setIncorrectPeriodError(true)
        else setIncorrectPeriodError(false)
    }, [startNumberRef, finishNumberRef])

    const handleStartChange = useCallback((value) => {
        startNumberRef.current = value
        handleDayChange()
    }, [])

    const handleFinishChange = useCallback((value) => {
        finishNumberRef.current = value
        handleDayChange()
    }, [])

    useEffect(() => {
        if (form.isFieldsTouched(['start', 'finish'])) form.validateFields(['start', 'finish'])
    }, [startNumberRef.current, finishNumberRef.current])

    const {
        loading: isPeriodsLoading,
        objs: reportingPeriods,
        error: periodsLoadingError,
    } = MeterReportingPeriod.useObjects({
        where: {
            property_is_null: false,
            organization: { id: organizationId },
        },
    },
    {
        fetchPolicy: 'network-only',
    })

    const search = useMemo(() => searchOrganizationPropertyWithoutPropertyHint(organizationId, reportingPeriods.map(period => period.property.id)),
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
            initialValues={isCreateMode ? undefined : formInitialValues}
            formValuesToMutationDataPreprocessor={(values) => {
                if (values.isOrganizationPeriod) {
                    values.property = undefined
                } else {
                    values.property = { connect: { id: selectedPropertyIdRef.current } }
                }
                values.isOrganizationPeriod = undefined
                values.start = parseInt(values.start)
                values.finish = parseInt(values.finish)

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
                                            label={OrganizationLabel}
                                            valuePropName='checked'
                                        >
                                            <Checkbox
                                                checked={isOrganizationPeriod}
                                                eventName='OrganizationReportingPeriodCheckbox'
                                                style={CHECKBOX_STYLE}
                                                onChange={handleCheckboxChange}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item
                                            name='start'
                                            rules={validations.start}
                                            label={StartLabel}
                                            {...INPUT_LAYOUT_PROPS}
                                            labelAlign='left'
                                            required
                                            shouldUpdate
                                            validateFirst
                                        >
                                            <Select
                                                displayMode='fit-content'
                                                options={DAY_SELECT_OPTIONS}
                                                value={startNumberRef.current}
                                                onChange={handleStartChange}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item
                                            name='finish'
                                            rules={validations.finish}
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
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item noStyle dependencies={['property', 'start', 'finish', 'isOrganizationPeriod']} shouldUpdate>
                                            {
                                                ({ getFieldsValue, getFieldError }) => {
                                                    const { property, start, finish, isOrganizationPeriod } = getFieldsValue(['property', 'start', 'finish', 'isOrganizationPeriod'])

                                                    const messageLabels = []
                                                    if (!property && !isOrganizationPeriod) messageLabels.push(`"${AddressLabel}" ${OrMessage} "${OrganizationLabel}"`)
                                                    if (!start) messageLabels.push(`"${StartLabel}"`)
                                                    if (!finish) messageLabels.push(`"${FinishLabel}"`)

                                                    const hasIncorrectPeriodError = incorrectPeriodError ? IncorrectPeriodLabel : undefined
                                                    const requiredErrorMessage = !isEmpty(messageLabels) && ErrorsContainerTitle.concat(' ', messageLabels.join(', '))
                                                    const errors = [hasIncorrectPeriodError, requiredErrorMessage]
                                                        .filter(Boolean)
                                                        .join(', ')

                                                    const isDisabled = (!property && !isOrganizationPeriod) || !start || !finish || hasIncorrectPeriodError

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
                                                                    {SubmitButtonLabel}
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
