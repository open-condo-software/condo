import styled from '@emotion/styled'
import { useIntl } from '@core/next/intl'
import React from 'react'
import { colors } from '@condo/domains/common/constants/style'

export const ErrorsWrapper = styled.div`
  display: inline-block;
  padding: 9px 16px;
  border-radius: 8px;
  background-color: ${colors.beautifulBlue[5]};
`

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