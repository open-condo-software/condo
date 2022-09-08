import { useIntl } from '@condo/next/intl'
import isEmpty from 'lodash/isEmpty'
import React from 'react'
import { ErrorsWrapper } from '@condo/domains/common/components/ErrorsWrapper'

interface IErrorsContainerProps {
    isVisible: boolean
    property: string
    details: string,
    placeClassifier: string,
    categoryClassifier: string
    deadline: string
    propertyMismatchError: string
}

export const ErrorsContainer: React.FC<IErrorsContainerProps> = ({ isVisible, property, details, placeClassifier, categoryClassifier, deadline, propertyMismatchError }) => {
    const intl = useIntl()
    const ErrorsContainerTitle = intl.formatMessage({ id: 'errorsContainer.requiredErrors' })
    const AddressLabel = intl.formatMessage({ id: 'field.Address' })
    const DetailsLabel = intl.formatMessage({ id: 'pages.condo.ticket.field.Description' })
    const PlaceLabel = intl.formatMessage({ id: 'component.ticketclassifier.PlaceLabel' })
    const CategoryLabel = intl.formatMessage({ id: 'component.ticketclassifier.CategoryLabel' })
    const DeadlineLabel = intl.formatMessage({ id: 'TicketDeadline' })

    const emptyFieldMessages = [
        !property && AddressLabel,
        !details && DetailsLabel,
        !placeClassifier && PlaceLabel,
        !categoryClassifier && CategoryLabel,
        !deadline && DeadlineLabel,
    ].filter(Boolean)
        .join(', ')
    
    const requiredErrorMessage = !isEmpty(emptyFieldMessages) && ErrorsContainerTitle.concat(` ${emptyFieldMessages.toLowerCase()}`)


    return (
        isVisible && (
            <ErrorsWrapper>
                <div>{propertyMismatchError}</div>
                <div>{requiredErrorMessage}</div>
            </ErrorsWrapper>
        )
    )
}
