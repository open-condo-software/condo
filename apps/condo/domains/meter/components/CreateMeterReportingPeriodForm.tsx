/** @jsx jsx */
import { jsx } from '@emotion/react'
import { Col, Form, Row } from 'antd'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import { useRouter } from 'next/router'
import { Rule } from 'rc-field-form/lib/interface'
import React, { CSSProperties, useCallback, useEffect, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Select } from '@open-condo/ui'

import Checkbox from '@condo/domains/common/components/antd/Checkbox'
import { ButtonWithDisabledTooltip } from '@condo/domains/common/components/ButtonWithDisabledTooltip'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { fontSizes } from '@condo/domains/common/constants/style'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { DAY_SELECT_OPTIONS } from '@condo/domains/meter/constants/constants'
import { MeterReportingPeriod } from '@condo/domains/meter/utils/clientSchema'
import { usePropertyValidations } from '@condo/domains/property/components/BasePropertyForm/usePropertyValidations'
import { PropertyAddressSearchInput } from '@condo/domains/property/components/PropertyAddressSearchInput'


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

export const CreateMeterReportingPeriodForm: React.FC = () => {
    const intl = useIntl()

    const AddressPlaceholderMessage = intl.formatMessage({ id: 'placeholder.Address' })
    const AddressLabel = intl.formatMessage({ id: 'field.Address' })
    const OrMessage = intl.formatMessage({ id: 'Or' })
    const StartLabel = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.create.start' })
    const FinishLabel = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.create.finish' })
    const OrganizationLabel = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.create.organizationPeriod' })
    const ErrorsContainerTitle = intl.formatMessage({ id: 'errorsContainer.requiredErrors' })
    const SubmitButtonLabel = intl.formatMessage({ id: 'pages.condo.meter.index.reportingPeriod.EmptyList.create' })
    const IncorrectPeriodLabel = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.create.incorrectPeriod' })

    const { organization } = useOrganization()
    const router = useRouter()
    const [isMatchSelectedProperty, setIsMatchSelectedProperty] = useState(true)
    const [selectedPropertyId, setSelectedPropertyId] = useState(null)
    const [isOrganizationPeriod, setIsOrganizationPeriod] = useState(false)
    const [startNumber, setStartNumber] = useState<number>()
    const [finishNumber, setFinishNumber] = useState<number>()
    const [incorrectPeriodError, setIncorrectPeriodError] = useState(false)

    const organizationId = get(organization, 'id', null)

    const { requiredValidator } = useValidations()
    const { addressValidator } = usePropertyValidations()

    const validations: { [key: string]: Rule[] } = {
        property: [addressValidator(selectedPropertyId, isMatchSelectedProperty)],
        start: [requiredValidator],
        finish: [requiredValidator],
    }

    const handleCheckboxChange = useCallback((form) => {
        setIsOrganizationPeriod(!isOrganizationPeriod)
        if (!isOrganizationPeriod) {
            setSelectedPropertyId(null)
            form.resetFields(['property'])
        }
    }, [isOrganizationPeriod])

    const handleDayChange = useCallback( () => {
        if (startNumber > finishNumber) setIncorrectPeriodError(true)
        else setIncorrectPeriodError(false)
    }, [startNumber, finishNumber])

    const handleStartChange = useCallback((value) => {
        handleDayChange()
        setStartNumber(value)
    }, [startNumber])

    const handleFinishChange = useCallback((value) => {
        handleDayChange()
        setFinishNumber(value)
    }, [finishNumber])

    const action = MeterReportingPeriod.useCreate({}, () => router.push('/meter'))

    return (
        <FormWithAction
            action={action}
            layout='horizontal'
            validateTrigger={['onBlur', 'onSubmit']}
            colon={false}
            formValuesToMutationDataPreprocessor={(values) => {
                if (values.isOrganizationPeriod) {
                    values.property = undefined
                } else {
                    values.property = { connect: { id: selectedPropertyId } }
                }
                values.isOrganizationPeriod = undefined
                values.start = parseInt(values.start)
                values.finish = parseInt(values.finish)
                values.organization = { connect: { id: organizationId } }
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
                                            <PropertyAddressSearchInput
                                                organization={organization}
                                                setIsMatchSelectedProperty={setIsMatchSelectedProperty}
                                                onSelect={(_, option) => {
                                                    setSelectedPropertyId(option.key)
                                                }}
                                                onChange={() => {
                                                    setSelectedPropertyId(null)
                                                }}
                                                placeholder={AddressPlaceholderMessage}
                                            />
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
                                                onChange={() => handleCheckboxChange(form)}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item name='start' rules={validations.start} required label={StartLabel} {...INPUT_LAYOUT_PROPS}  labelAlign='left'>
                                            <Select
                                                options={DAY_SELECT_OPTIONS}
                                                value={startNumber}
                                                onChange={handleStartChange}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item name='finish' rules={validations.finish} required label={FinishLabel} {...INPUT_LAYOUT_PROPS} labelAlign='left'>
                                            <Select
                                                options={DAY_SELECT_OPTIONS}
                                                value={finishNumber}
                                                onChange={handleFinishChange}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item noStyle dependencies={['property', 'start', 'finish', 'isOrganizationPeriod']} shouldUpdate>
                                            {
                                                ({ getFieldsValue, getFieldError }) => {
                                                    const { property, start, finish, isOrganizationPeriod } = getFieldsValue(['property', 'start', 'finish', 'isOrganizationPeriod'])
                                                    const isDisabled = (!property && !isOrganizationPeriod) || !start || !finish

                                                    const messageLabels = []
                                                    if (!property && !isOrganizationPeriod) messageLabels.push(`"${AddressLabel}" ${OrMessage} "${OrganizationLabel}"`)
                                                    if (!start) messageLabels.push(`"${StartLabel}"`)
                                                    if (!finish) messageLabels.push(`"${FinishLabel}"`)

                                                    const requiredErrorMessage = !isEmpty(messageLabels) && ErrorsContainerTitle.concat(' ', messageLabels.join(', '))
                                                    const hasIncorrectPeriodError = incorrectPeriodError ? IncorrectPeriodLabel : undefined

                                                    const errors = [hasIncorrectPeriodError, requiredErrorMessage]
                                                        .filter(Boolean)
                                                        .join(', ')

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
