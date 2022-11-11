import { useIntl } from '@open-condo/next/intl'
import React from 'react'
import { ErrorsWrapper } from '@condo/domains/common/components/ErrorsWrapper'

interface IErrorsContainerProps {
    name: string,
    properties: string,
    responsible: string,
    executors: string
}

export const ErrorsContainer: React.FC<IErrorsContainerProps> = ({ name, properties, responsible, executors }) => {
    const intl = useIntl()
    const ErrorsContainerTitle = intl.formatMessage({ id: 'errorsContainer.requiredErrors' })

    const NameLabel = intl.formatMessage({ id: 'division.field.name' })
    const PropertiesLabel = intl.formatMessage({ id: 'division.field.properties' })
    const ResponsibleLabel = intl.formatMessage({ id: 'division.field.responsible' })
    const ExecutorLabel = intl.formatMessage({ id: 'division.field.executors' })
    const disableUserInteraction = name.length === 0
        || !properties || properties.length === 0
        || !responsible
        || !executors || executors.length === 0

    const errors = []
    if (name.length === 0) {
        errors.push(NameLabel)
    }
    if (!properties || properties && properties.length === 0)
        errors.push(PropertiesLabel)
    if (!responsible)
        errors.push(ResponsibleLabel)
    if (!executors || executors && executors.length === 0) {
        errors.push(ExecutorLabel)
    }

    return (
        disableUserInteraction && (
            <ErrorsWrapper>
                {ErrorsContainerTitle}&nbsp;
                {errors.join(', ')}
            </ErrorsWrapper>
        )
    )
}
