import { Form } from 'antd'
import { isEmpty } from 'lodash'
import React from 'react'

import { PlusCircle } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { ActionBar } from '@open-condo/ui'

import { ButtonWithDisabledTooltip } from '@condo/domains/common/components/ButtonWithDisabledTooltip'


const PROPERTY_DEPENDENCY = ['property']
const handleShouldUpdate = (prev, next) => prev.unitName !== next.unitName

export const CreateMeterReadingsActionBar = ({
    handleSave,
    handleAddMeterButtonClick,
    isLoading,
    newMeterReadings,
}) => {
    const intl = useIntl()
    const SendMetersReadingMessage = intl.formatMessage({ id: 'pages.condo.meter.SendMetersReading' })
    const AddMeterMessage = intl.formatMessage({ id: 'pages.condo.meter.AddMeter' })
    const AddressNotSelected = intl.formatMessage({ id: 'field.Property.nonSelectedError' })
    const ErrorsContainerTitle = intl.formatMessage({ id: 'errorsContainer.requiredErrors' })
    const AddressLabel = intl.formatMessage({ id: 'field.Address' })
    const UnitMessage = intl.formatMessage({ id: 'field.UnitName' })

    return (
        <Form.Item
            noStyle
            dependencies={PROPERTY_DEPENDENCY}
            shouldUpdate={handleShouldUpdate}
        >
            {
                ({ getFieldsValue, getFieldError }) => {
                    const { property, unitName } = getFieldsValue(['property', 'unitName'])
                    const isSubmitButtonDisabled = !property || !unitName || isEmpty(newMeterReadings)
                    const isCreateMeterButtonDisabled = !property || !unitName
                    const propertyMismatchError = getFieldError('property').find((error)=>error.includes(AddressNotSelected))
                    const propertyErrorMessage = !property && AddressLabel
                    const unitErrorMessage = !unitName && UnitMessage
                    const fieldsErrorMessages = [propertyErrorMessage, unitErrorMessage]
                        .filter(Boolean)
                        .map(errorField => errorField.toLowerCase())
                        .join(', ')
                    const requiredErrorMessage = fieldsErrorMessages && ErrorsContainerTitle.concat(' ', fieldsErrorMessages)

                    const errors = [requiredErrorMessage, propertyMismatchError].filter(Boolean).join(',')

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
