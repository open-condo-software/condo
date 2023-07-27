import { Form } from 'antd'
import { isEmpty } from 'lodash'
import React from 'react'

import { PlusCircle } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { ActionBar } from '@open-condo/ui'

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
    const SendMetersReadingMessage = intl.formatMessage({ id: 'meter.sendMetersReading' })
    const AddMeterMessage = intl.formatMessage({ id: 'meter.addMeter' })
    const FieldIsRequiredMessage = intl.formatMessage({ id: 'fieldIsRequired' })
    const ErrorsContainerTitle = intl.formatMessage({ id: 'errorsContainer.requiredErrors' })
    const AddressLabel = intl.formatMessage({ id: 'field.address' })
    const UnitMessage = intl.formatMessage({ id: 'field.unitName' })

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
                                >
                                    {SendMetersReadingMessage}
                                </ButtonWithDisabledTooltip>,
                                <ButtonWithDisabledTooltip
                                    key='addMeter'
                                    title={requiredErrorMessage}
                                    onClick={handleAddMeterButtonClick}
                                    type='secondary'
                                    disabled={isCreateMeterButtonDisabled}
                                    icon={<PlusCircle size='medium'/>}
                                >
                                    {AddMeterMessage}
                                </ButtonWithDisabledTooltip>,
                            ]}
                        />
                    )
                }
            }
        </Form.Item>
    )
}
