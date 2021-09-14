import { useIntl } from '@core/next/intl'
import React from 'react'
import { ErrorsWrapper } from '@condo/domains/common/components/ErrorsWrapper'

interface IErrorsContainerProps {
    properties: string,
    responsible: string,
}

export const ErrorsContainer: React.FC<IErrorsContainerProps> = ({ properties, responsible }) => {
    const intl = useIntl()
    const ErrorsContainerTitle = intl.formatMessage({ id: 'errorsContainer.requiredErrors' })
    const PropertiesLabel = intl.formatMessage({ id: 'division.field.properties' })
    const ResponsibleLabel = intl.formatMessage({ id: 'division.field.responsible' })
    const disableUserInteraction = !properties || properties.length === 0 || !responsible

    const errors = []
    if (properties && properties.length === 0)
        errors.push(PropertiesLabel)
    if (!responsible)
        errors.push(ResponsibleLabel)

    return (
        disableUserInteraction && (
            <ErrorsWrapper>
                {ErrorsContainerTitle}&nbsp;
                {errors.join(', ')}
            </ErrorsWrapper>
        )
    )
}
