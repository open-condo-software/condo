import { Form } from 'antd'
import { isEmpty } from 'lodash'
import get from 'lodash/get'
import React from 'react'

import { PlusCircle } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Tour } from '@open-condo/ui'

import { ButtonWithDisabledTooltip } from '@condo/domains/common/components/ButtonWithDisabledTooltip'
import { METER_PAGE_TYPES } from '@condo/domains/meter/utils/clientSchema'


const PROPERTY_DEPENDENCY = ['property']
const handleShouldUpdate = (prev, next) => prev.unitName !== next.unitName

export const CreateMeterReadingsActionBar = ({
    handleSave,
    handleAddMeterButtonClick,
    isLoading,
    newMeterReadings,
    meterType,
}) => {
    const intl = useIntl()
    const SendMetersReadingMessage = intl.formatMessage({ id: 'pages.condo.meter.SendMetersReading' })
    const AddMeterMessage = intl.formatMessage({ id: 'pages.condo.meter.AddMeter' })
    const FieldIsRequiredMessage = intl.formatMessage({ id: 'FieldIsRequired' })
    const ErrorsContainerTitle = intl.formatMessage({ id: 'errorsContainer.requiredErrors' })
    const AddressLabel = intl.formatMessage({ id: 'field.Address' })
    const UnitMessage = intl.formatMessage({ id: 'field.UnitName' })
    const AddMeterTourStepTitle = intl.formatMessage({ id: 'pages.condo.meter.create.AddMeterTourStepTitle' })
    const AddMeterTourStepMessage = intl.formatMessage({ id: 'pages.condo.meter.create.AddMeterTourStepMessage' })

    const { link } = useOrganization()
    const canManageMeters = get(link, 'role.canManageMeters', false)
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
                    if (meterType === METER_PAGE_TYPES.meter) {
                        const { property, unitName } = getFieldsValue(['property', 'unitName'])
                        isSubmitButtonDisabled = !property || !unitName || isEmpty(newMeterReadings)
                        isCreateMeterButtonDisabled = !property || !unitName
                        const propertyMismatchError = getFieldError('property').find((error)=>error.includes(FieldIsRequiredMessage))
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
                        const propertyMismatchError = getFieldError('property').find((error)=>error.includes(FieldIsRequiredMessage))
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
                                canManageMeters && (
                                    <Tour.TourStep
                                        step={1}
                                        title={AddMeterTourStepTitle}
                                        message={AddMeterTourStepMessage}
                                    >
                                        <ButtonWithDisabledTooltip
                                            key='addMeter'
                                            title={requiredErrorMessage}
                                            onClick={handleAddMeterButtonClick}
                                            type='secondary'
                                            disabled={isCreateMeterButtonDisabled}
                                            icon={<PlusCircle size='medium'/>}
                                            focus={currentStep === 1}
                                        >
                                            {AddMeterMessage}
                                        </ButtonWithDisabledTooltip>
                                    </Tour.TourStep>
                                ),
                            ]}
                        />
                    )
                }
            }
        </Form.Item>
    )
}
