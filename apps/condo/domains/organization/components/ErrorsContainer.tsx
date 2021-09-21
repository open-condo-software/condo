import { useIntl } from '@core/next/intl'
import { Col } from 'antd'
import React from 'react'
import { ErrorsWrapper } from '@condo/domains/common/components/ErrorsWrapper'

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