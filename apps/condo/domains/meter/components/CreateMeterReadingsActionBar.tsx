import { Form } from 'antd'
import { isEmpty } from 'lodash'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { ActionBar, Tour } from '@open-condo/ui'

import { ButtonWithDisabledTooltip } from '@condo/domains/common/components/ButtonWithDisabledTooltip'
import { MeterPageTypes, METER_TAB_TYPES } from '@condo/domains/meter/utils/clientSchema'


const PROPERTY_DEPENDENCY = ['property']
const handleShouldUpdate = (prev, next) => prev.unitName !== next.unitName
type CreateMeterReadingsActionBarProps = {
    handleSave: () => void
    isLoading: boolean,
    newMeterReadings: Array<unknown> | unknown
    meterType: MeterPageTypes,
}

export const CreateMeterReadingsActionBar = ({
    handleSave,
    isLoading,
    newMeterReadings,
    meterType,
}: CreateMeterReadingsActionBarProps): JSX.Element => {
    const intl = useIntl()
    const SendMetersReadingMessage = intl.formatMessage({ id: 'pages.condo.meter.SendMetersReading' })
    const FieldIsRequiredMessage = intl.formatMessage({ id: 'FieldIsRequired' })
    const ErrorsContainerTitle = intl.formatMessage({ id: 'errorsContainer.requiredErrors' })
    const AddressLabel = intl.formatMessage({ id: 'field.Address' })
    const UnitMessage = intl.formatMessage({ id: 'field.UnitName' })

    const { currentStep } = Tour.useTourContext()

    return (
        <Form.Item
            noStyle
            dependencies={PROPERTY_DEPENDENCY}
            shouldUpdate={handleShouldUpdate}
        >
            {
                ({ getFieldsValue, getFieldValue, getFieldError }) => {
                    let isSubmitButtonDisabled, isCreateMeterButtonDisabled, errors, requiredErrorMessage
                    if (meterType === METER_TAB_TYPES.meter) {
                        const { property, unitName } = getFieldsValue(['property', 'unitName'])
                        isSubmitButtonDisabled = !property || !unitName || isEmpty(newMeterReadings)
                        isCreateMeterButtonDisabled = !property || !unitName
                        const propertyMismatchError = getFieldError('property').find((error) => error.includes(FieldIsRequiredMessage))
                        const propertyErrorMessage = !property && AddressLabel
                        const unitErrorMessage = !unitName && UnitMessage
                        const fieldsErrorMessages = [propertyErrorMessage, unitErrorMessage]
                            .filter(Boolean)
                            .map(errorField => errorField.toLowerCase())
                            .join(', ')
                        const requiredErrorMessage = fieldsErrorMessages && ErrorsContainerTitle.concat(' ', fieldsErrorMessages)

                        errors = [requiredErrorMessage, propertyMismatchError].filter(Boolean).join(',')
                    } else {
                        const property = getFieldValue('property')
                        const propertyMismatchError = getFieldError('property').find((error) => error.includes(FieldIsRequiredMessage))
                        const propertyErrorMessage = !property && AddressLabel
                        isSubmitButtonDisabled = !property || isEmpty(newMeterReadings)
                        isCreateMeterButtonDisabled = !property
                        requiredErrorMessage = propertyErrorMessage && ErrorsContainerTitle.concat(' ', propertyErrorMessage)

                        errors = [requiredErrorMessage, propertyMismatchError].filter(Boolean).join(',')
                    }


                    return (
                        <ActionBar
                            actions={[
                                <ButtonWithDisabledTooltip
                                    key='sendReadings'
                                    title={errors}
                                    onClick={handleSave}
                                    type='primary'
                                    loading={isLoading}
                                    disabled={isSubmitButtonDisabled}
                                    focus={currentStep === 3}
                                >
                                    {SendMetersReadingMessage}
                                </ButtonWithDisabledTooltip>,
                            ]}
                        />
                    )
                }
            }
        </Form.Item>
    )
}
