import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import { ErrorsWrapper } from '@condo/domains/common/components/ErrorsWrapper'

interface IErrorsContainerProps {
    address: string
}

export const ErrorsContainer: React.FC<IErrorsContainerProps> = ({ address }) => {
    const intl = useIntl()
    const ErrorsContainerTitle = intl.formatMessage({ id: 'errorsContainer.requiredErrors' })
    const AddressLabel = intl.formatMessage({ id: 'field.Address' })
    const disableUserInteraction = !address

    return (
        disableUserInteraction && (
            <ErrorsWrapper>
                {ErrorsContainerTitle}&nbsp;
                {AddressLabel}
            </ErrorsWrapper>
        )
    )
}
