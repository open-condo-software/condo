import { useIntl } from '@core/next/intl'
import React from 'react'
import { ErrorsWrapper } from '@condo/domains/common/components/ErrorsWrapper'

interface IErrorsContainerProps {
    isVisible: boolean
    property: string
    details: string,
    placeClassifier: string,
    categoryClassifier: string
}

export const ErrorsContainer: React.FC<IErrorsContainerProps> = ({ isVisible, property, details, placeClassifier, categoryClassifier  }) => {
    const intl = useIntl()
    const ErrorsContainerTitle = intl.formatMessage({ id: 'errorsContainer.requiredErrors' })
    const AddressLabel = intl.formatMessage({ id: 'field.Address' })
    const DetailsLabel = intl.formatMessage({ id: 'pages.condo.ticket.field.Description' })
    const PlaceLabel = intl.formatMessage({ id: 'component.ticketclassifier.PlaceLabel' })
    const CategoryLabel = intl.formatMessage({ id: 'component.ticketclassifier.CategoryLabel' })

    const emptyFieldMessages = [
        !property && AddressLabel,
        !details && DetailsLabel,
        !placeClassifier && PlaceLabel,
        !categoryClassifier && CategoryLabel,
    ].filter(Boolean)

    const errorMessage = emptyFieldMessages && emptyFieldMessages.length > 0 &&
        emptyFieldMessages
            .reduce((firstError, secondError) => `${firstError}, ${secondError}`)
            .toLocaleLowerCase()
    
    return (
        isVisible && (
            <ErrorsWrapper>
                {ErrorsContainerTitle}&nbsp;
                {errorMessage}
            </ErrorsWrapper>
        )
    )
}
