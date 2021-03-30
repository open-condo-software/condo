import styled from '@emotion/styled'
import { useIntl } from '@core/next/intl'
import { Col } from 'antd'
import React from 'react'
import { colors } from '../../../../constants/style'

export const ErrorsWrapper = styled.div`
  display: inline-block;
  padding: 9px 16px;
  border-radius: 8px;
  background-color: ${colors.beautifulBlue[5]};
`

interface IErrorsContainerProps {
    property: string
    unitName: string
}

export const ErrorsContainer: React.FC<IErrorsContainerProps> = ({ property, unitName }) => {
    const intl = useIntl()
    const ErrorsContainerTitle = intl.formatMessage({ id: 'errorsContainer.requiredErrors' })
    const AddressLabel = intl.formatMessage({ id: 'field.Address' })
    const FlatNumberLabel = intl.formatMessage({ id: 'field.FlatNumber' })

    const disableUserInteraction = !property || !unitName

    return (
        disableUserInteraction && (
            <Col span={24}>
                <ErrorsWrapper>
                    {ErrorsContainerTitle}&nbsp;
                    {(!property && AddressLabel || !unitName && FlatNumberLabel).toLowerCase()}
                </ErrorsWrapper>
            </Col>
        )
    )
}