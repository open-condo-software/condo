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
    focus?: boolean
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
        (isRequiredDeadline && !deadline && DeadlineLabel),
    ].filter(Boolean)
        .join(', ')

    const requiredErrorMessage = !isEmpty(emptyFieldMessages) && ErrorsContainerTitle.concat(` ${emptyFieldMessages.toLowerCase()}`)
    const errors = [requiredErrorMessage, propertyMismatchError].filter(Boolean).join(',')

    return (
        <ButtonWithDisabledTooltip
            {...otherProps}
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
