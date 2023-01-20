import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import { ErrorsWrapper } from '@condo/domains/common/components/ErrorsWrapper'

interface IErrorsContainerProps {
    property: string
    unitName: string
    propertyMismatchError: string
}

export const ErrorsContainer: React.FC<IErrorsContainerProps> = ({ property, unitName, propertyMismatchError  }) => {
    const intl = useIntl()
    const ErrorsContainerTitle = intl.formatMessage({ id: 'errorsContainer.requiredErrors' })
    const AddressLabel = intl.formatMessage({ id: 'field.Address' })
    const UnitMessage = intl.formatMessage({ id: 'field.UnitName' })

    const disableUserInteraction = !property || !unitName
    const propertyErrorMessage = !property && AddressLabel
    const unitErrorMessage = !unitName && UnitMessage
    const fieldsErrorMessages = [propertyErrorMessage, unitErrorMessage]
        .filter(Boolean)
        .map(errorField => errorField.toLowerCase())
        .join(', ')
    const requiredErrorMessage = fieldsErrorMessages && ErrorsContainerTitle.concat(' ', fieldsErrorMessages)

    return (
        disableUserInteraction && fieldsErrorMessages && (
            <ErrorsWrapper>
                <div>{propertyMismatchError}</div>
                <div>{requiredErrorMessage}</div>
            </ErrorsWrapper>
        )
    )
}
