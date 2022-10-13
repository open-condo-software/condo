import { useIntl } from '@condo/next/intl'
import isEmpty from 'lodash/isEmpty'
import React from 'react'
import { ErrorsWrapper } from '@condo/domains/common/components/ErrorsWrapper'

interface IErrorsContainerProps {
    address: string
    unit: string
    name: string
    phone: string
    propertyMismatchError: string
    hasContactDuplicate: boolean
    nameSpecCharError: boolean
}

export const ErrorsContainer: React.FC<IErrorsContainerProps> = ({ address, unit, phone, name, propertyMismatchError, hasContactDuplicate, nameSpecCharError }) => {
    const intl = useIntl()
    const ErrorsContainerTitle = intl.formatMessage({ id: 'errorsContainer.requiredErrors' })
    const AddressLabel = intl.formatMessage({ id: 'field.Address' })
    const UnitLabel = intl.formatMessage({ id: 'field.Unit' })
    const PhoneLabel = intl.formatMessage({ id: 'Phone' })
    const NameLabel = intl.formatMessage({ id: 'field.FullName.short' })
    const contactDuplicateMessage = intl.formatMessage({ id: 'contact.ContactDuplicateError' })
    const FullNameInvalidCharMessage = intl.formatMessage({ id:'field.FullName.invalidChar' })

    const disabledUserInteractions = !address || !unit || !phone || !!propertyMismatchError || hasContactDuplicate
    const messageLabels = []
    if (!address) messageLabels.push(`"${AddressLabel}"`)
    if (!unit) messageLabels.push(`"${UnitLabel}"`)
    if (!name) messageLabels.push(`"${NameLabel}"`)
    if (!phone) messageLabels.push(`"${PhoneLabel}"`)

    const requiredErrorMessage = !isEmpty(messageLabels) && ErrorsContainerTitle.concat(' ', messageLabels.join(', '))
    const contactDuplicateError = hasContactDuplicate ? contactDuplicateMessage : undefined
    const hasNameSpecCharError = nameSpecCharError ? FullNameInvalidCharMessage : undefined

    return (
        disabledUserInteractions && (
            <ErrorsWrapper>
                <div>{contactDuplicateError}</div>
                <div>{hasNameSpecCharError}</div>
                <div>{propertyMismatchError}</div>
                <div>{requiredErrorMessage}</div>
            </ErrorsWrapper>
        )
    )
}