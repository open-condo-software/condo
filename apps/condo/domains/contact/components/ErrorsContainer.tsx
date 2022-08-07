import { useIntl } from '@condo/next/intl'
import React from 'react'
import { ErrorsWrapper } from '@condo/domains/common/components/ErrorsWrapper'

interface IErrorsContainerProps {
    address: string
    unit: string
    name: string
    phone: string
}

export const ErrorsContainer: React.FC<IErrorsContainerProps> = ({ address, unit, phone, name }) => {
    const intl = useIntl()
    const ErrorContainerTitle = intl.formatMessage({ id: 'errorsContainer.requiredErrors' })
    const AddressLabel = intl.formatMessage({ id: 'field.Address' })
    const UnitLabel = intl.formatMessage({ id: 'field.Unit' })
    const PhoneLabel = intl.formatMessage({ id: 'Phone' })
    const NameLabel = intl.formatMessage({ id: 'field.FullName.short' })

    const disabledUserInteractions = !address || !unit || !phone
    const messageLabels = []
    if (!address) messageLabels.push(`"${AddressLabel}"`)
    if (!unit) messageLabels.push(`"${UnitLabel}"`)
    if (!name) messageLabels.push(`"${NameLabel}"`)
    if (!phone) messageLabels.push(`"${PhoneLabel}"`)
    const message = messageLabels.join(', ')

    return (
        disabledUserInteractions && (
            <ErrorsWrapper>
                {ErrorContainerTitle}&nbsp;
                {message}
            </ErrorsWrapper>
        )
    )
}