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
    phone: string
}

export const ErrorsContainer: React.FC<IErrorsContainerProps> = ({ phone }) => {
    const intl = useIntl()
    const ErrorsContainerTitle = intl.formatMessage({ id: 'errorsContainer.requiredErrors' })
    const PhoneLabel = intl.formatMessage({ id: 'Phone' })
    const disableUserInteraction = !phone

    const getEmptyRequiredFields = () => {
        if (!phone ) {
            return PhoneLabel
        }
    }

    return (
        disableUserInteraction && (
            <Col span={24}>
                <ErrorsWrapper>
                    {ErrorsContainerTitle}&nbsp;
                    {getEmptyRequiredFields()?.toLowerCase()}
                </ErrorsWrapper>
            </Col>
        )
    )
}