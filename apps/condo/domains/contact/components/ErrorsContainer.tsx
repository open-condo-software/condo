import isEmpty from 'lodash/isEmpty'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import { ErrorsWrapper } from '@condo/domains/common/components/ErrorsWrapper'

interface IErrorsContainerProps {
    address: string
    unit: string
    name: string
    phone: string
    propertyMismatchError: string
    hasContactDuplicate: boolean
    hasNameSpecCharError: boolean
    hasNameTrimValidateError: boolean
}

export const ErrorsContainer: React.FC<IErrorsContainerProps> = (props) => {
    const {
        address,
        unit,
        phone,
        name,
        propertyMismatchError,
        hasContactDuplicate,
        hasNameSpecCharError,
        hasNameTrimValidateError,
    } = props
    const intl = useIntl()
    const ErrorsContainerTitle = intl.formatMessage({ id: 'errorsContainer.requiredErrors' })
    const AddressLabel = intl.formatMessage({ id: 'field.address' })
    const UnitLabel = intl.formatMessage({ id: 'field.unit' })
    const PhoneLabel = intl.formatMessage({ id: 'phone' })
    const NameLabel = intl.formatMessage({ id: 'field.fullName.short' })
    const contactDuplicateMessage = intl.formatMessage({ id: 'contact.contactDuplicateError' })
    const FullNameInvalidCharMessage = intl.formatMessage({ id:'field.FullName.invalidChar' })

    const disabledUserInteractions = !address || !unit || !phone || !!propertyMismatchError || hasContactDuplicate || hasNameSpecCharError || hasNameTrimValidateError
    const messageLabels = []
    if (!address) messageLabels.push(`"${AddressLabel}"`)
    if (!unit) messageLabels.push(`"${UnitLabel}"`)
    if (hasNameTrimValidateError) messageLabels.push(`"${NameLabel}"`)
    if (!phone) messageLabels.push(`"${PhoneLabel}"`)

    const requiredErrorMessage = !isEmpty(messageLabels) && ErrorsContainerTitle.concat(' ', messageLabels.join(', '))
    const contactDuplicateError = hasContactDuplicate ? contactDuplicateMessage : undefined
    const nameSpecCharError = hasNameSpecCharError ? FullNameInvalidCharMessage : undefined

    return (
        disabledUserInteractions && (
            <ErrorsWrapper>
                <div>{contactDuplicateError}</div>
                <div>{nameSpecCharError}</div>
                <div>{propertyMismatchError}</div>
                <div>{requiredErrorMessage}</div>
            </ErrorsWrapper>
        )
    )
}