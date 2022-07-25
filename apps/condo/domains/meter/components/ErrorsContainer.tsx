import { useIntl } from '@core/next/intl'
import React from 'react'
import { ErrorsWrapper } from '@condo/domains/common/components/ErrorsWrapper'

interface IErrorsContainerProps {
    property: string
    unitName: string
    clientPhone: string
    clientName: string
}

export const ErrorsContainer: React.FC<IErrorsContainerProps> = ({ property, unitName, clientPhone, clientName  }) => {
    const intl = useIntl()
    const ErrorsContainerTitle = intl.formatMessage({ id: 'errorsContainer.requiredErrors' })
    const AddressLabel = intl.formatMessage({ id: 'field.Address' })
    const UnitMessage = intl.formatMessage({ id: 'field.UnitName' })
    const ClientPhoneMessage = intl.formatMessage({ id: 'field.Phone' })
    const ClientNameMessage = intl.formatMessage({ id: 'field.FullName.short' })

    const disableUserInteraction = !property || !unitName || !clientPhone || !clientName
    const propertyErrorMessage = !property && AddressLabel
    const unitErrorMessage = !unitName && UnitMessage
    const clientPhoneErrorMessage = !clientPhone && ClientPhoneMessage
    const clientNameErrorMessage = !clientName && ClientNameMessage
    const fieldsErrorMessages = [propertyErrorMessage, unitErrorMessage, clientPhoneErrorMessage, clientNameErrorMessage]
        .filter(Boolean)
        .map(errorField => errorField.toLowerCase())
        .join(', ')

    return (
        disableUserInteraction && fieldsErrorMessages && (
            <ErrorsWrapper>
                {ErrorsContainerTitle}&nbsp;
                {fieldsErrorMessages}
            </ErrorsWrapper>
        )
    )
}
