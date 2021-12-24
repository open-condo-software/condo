import { Row, Col, Typography } from 'antd'
import { PropsWithChildren } from 'react'
import { useIntl } from '@core/next/intl'
import { RegisterContextProvider } from './RegisterContextProvider'
import AuthLayout from '../containers/AuthLayout'
import { ButtonHeaderAction } from '../../../common/components/HeaderActions'

export function RegisterLayout ({ children }: PropsWithChildren<any>) {
    const intl = useIntl()
    const RegistrationTitleMsg = intl.formatMessage({ id: 'pages.auth.RegistrationTitle' })

    return (
        <AuthLayout headerAction={
            <ButtonHeaderAction
                descriptor={{ id: 'pages.auth.AlreadyRegistered' }}
                path={'/auth/signin'}
            />}>
            <RegisterContextProvider>
                <Row gutter={[0, 24]}>
                    <Col span={24}>
                        <Typography.Title>{RegistrationTitleMsg}</Typography.Title>
                    </Col>
                    <Col span={24}>
                        {children}
                    </Col>
                </Row>
            </RegisterContextProvider>
        </AuthLayout>
    )
}
