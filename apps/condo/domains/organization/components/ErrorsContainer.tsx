import { Col } from 'antd'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import { ErrorsWrapper } from '@condo/domains/common/components/ErrorsWrapper'

interface IErrorsContainerProps {
    phone: string
}

export const ErrorsContainer: React.FC<IErrorsContainerProps> = ({ phone }) => {
    const intl = useIntl()
    const ErrorsContainerTitle = intl.formatMessage({ id: 'errorsContainer.requiredErrors' })
    const PhoneLabel = intl.formatMessage({ id: 'phone' })
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