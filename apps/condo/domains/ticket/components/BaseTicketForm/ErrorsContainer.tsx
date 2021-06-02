import styled from '@emotion/styled'
import { useIntl } from '@core/next/intl'
import { Col } from 'antd'
import React from 'react'
import { colors } from '@condo/domains/common/constants/style'

export const ErrorsWrapper = styled.div`
  display: inline-block;
  padding: 9px 16px;
  border-radius: 8px;
  background-color: ${colors.beautifulBlue[5]};
`

interface IErrorsContainerProps {
    property: string
}

export const ErrorsContainer: React.FC<IErrorsContainerProps> = ({ property  }) => {
    const intl = useIntl()
    const ErrorsContainerTitle = intl.formatMessage({ id: 'errorsContainer.requiredErrors' })
    const AddressLabel = intl.formatMessage({ id: 'field.Address' })

    const disableUserInteraction = !property

    return (
        disableUserInteraction && (
            <Col span={24}>
                <ErrorsWrapper>
                    {ErrorsContainerTitle}&nbsp;
                    {(!property && AddressLabel).toLowerCase()}
                </ErrorsWrapper>
            </Col>
        )
    )
}