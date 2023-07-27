import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import { ButtonWithDisabledTooltip } from '@condo/domains/common/components/ButtonWithDisabledTooltip'

interface IErrorsContainerProps {
    ApplyChangesMessage: string
    handleSave: () => void
    isLoading: boolean
    disabledCondition: boolean
    property: string
    details: string,
    placeClassifier: string,
    categoryClassifier: string
    deadline: string
    propertyMismatchError: string
    isRequiredDeadline?: boolean
}

export const TicketSubmitButton: React.FC<IErrorsContainerProps> = ({
    ApplyChangesMessage,
    handleSave,
    isLoading,
    disabledCondition,
    property,
    details,
    placeClassifier,
    categoryClassifier,
    deadline,
    propertyMismatchError,
    isRequiredDeadline,
    ...otherProps
}) => {
    const intl = useIntl()
    const ErrorsContainerTitle = intl.formatMessage({ id: 'errorsContainer.requiredErrors' })
    const AddressLabel = intl.formatMessage({ id: 'field.address' })
    const DetailsLabel = intl.formatMessage({ id: 'ticket.field.description' })
    const PlaceLabel = intl.formatMessage({ id: 'component.ticketclassifier.placeLabel' })
    const CategoryLabel = intl.formatMessage({ id: 'component.ticketclassifier.categoryLabel' })
    const DeadlineLabel = intl.formatMessage({ id: 'ticketDeadline' })

    const emptyFieldMessages = [
        !property && AddressLabel,
        !details && DetailsLabel,
        !placeClassifier && PlaceLabel,
        !categoryClassifier && CategoryLabel,
        (isRequiredDeadline && !deadline && DeadlineLabel),
    ].filter(Boolean)
        .join(', ')

    const requiredErrorMessage = !isEmpty(emptyFieldMessages) && ErrorsContainerTitle.concat(` ${emptyFieldMessages.toLowerCase()}`)
    const errors = [requiredErrorMessage, propertyMismatchError].filter(Boolean).join(',')

    return (
        <ButtonWithDisabledTooltip
            title={errors}
            onClick={handleSave}
            type='primary'
            loading={isLoading}
            disabled={disabledCondition}
            data-cy={get(otherProps, 'data-cy')}
        >
            {ApplyChangesMessage}
        </ButtonWithDisabledTooltip>
    )
}
