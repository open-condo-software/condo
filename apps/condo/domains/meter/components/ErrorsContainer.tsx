import { useIntl } from '@core/next/intl'
import React from 'react'
import { ErrorsWrapper } from '@condo/domains/common/components/ErrorsWrapper'
import { isEmpty } from 'lodash'

interface IErrorsContainerProps {
    property: string
    unitName: string
    newMeterReadings
}

export const ErrorsContainer: React.FC<IErrorsContainerProps> = ({ property, unitName, newMeterReadings  }) => {
    const intl = useIntl()
    const ErrorsContainerTitle = intl.formatMessage({ id: 'errorsContainer.requiredErrors' })
    const AddressLabel = intl.formatMessage({ id: 'field.Address' })

    const disableUserInteraction = !property || !unitName
    const propertyErrorMessage = !property && AddressLabel
    const unitErrorMessage = !unitName && 'Квартира'
    const newMeterReadingsErrorMessage = isEmpty(newMeterReadings) && 'Для отправки показаний введите хотя бы одно показание'
    const fieldsErrorMessages = [propertyErrorMessage, unitErrorMessage]
        .filter(Boolean)
        .map(errorField => errorField.toLowerCase())
        .join(', ')

    return (
        (disableUserInteraction || newMeterReadingsErrorMessage) && (
            <ErrorsWrapper>
                {
                    fieldsErrorMessages ? (
                        <>
                            {ErrorsContainerTitle}&nbsp;
                            {fieldsErrorMessages}
                        </>
                    ) : (
                        <>
                            { newMeterReadingsErrorMessage }
                        </>
                    )
                }
            </ErrorsWrapper>
        )
    )
}
