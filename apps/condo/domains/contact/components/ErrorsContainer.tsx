import styled from '@emotion/styled'
import { useIntl } from '@core/next/intl'
import React from 'react'
import { colors } from '@condo/domains/common/constants/style'

const ErrorsWrapper = styled.div`
  display: inline-block;
  padding: 9px 16px;
  border-radius: 8px;
  background-color: ${colors.beautifulBlue[5]};
`

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