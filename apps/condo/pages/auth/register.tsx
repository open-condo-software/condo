import { useMemo, useState } from 'react'
import { Row, Col, Typography } from 'antd'
import { useIntl } from '@core/next/intl'

import { ConfirmPhoneView } from '@condo/domains/user/components/auth/ConfirmPhoneView'
import { RegisterPhoneView } from '@condo/domains/user/components/auth/register/RegisterPhoneView'
import { FillCredentialsView } from '@condo/domains/user/components/auth/register/FillCredentialsView'
import { RegisterPageStep } from '@condo/domains/user/components/auth/register/RegisterPageStep'
import { useConfirmIdentityPageStore } from '@condo/domains/user/components/auth/hooks'
import { ButtonHeaderAction } from '@condo/domains/common/components/HeaderActions'
import { AuthLayout } from '@condo/domains/user/components/containers/AuthLayout'
import { ConfirmIdentityContextProvider } from '@condo/domains/user/components/auth/ConfirmIdentityContext'

export default function RegisterPage () {
    const [step, setStep] = useState<RegisterPageStep>(RegisterPageStep.EnterPhone)

    const pageStore = useConfirmIdentityPageStore('registration_token', 'registration_step')

    const pageStepToViewMap = {
        [RegisterPageStep.EnterPhone]: <RegisterPhoneView />,
        [RegisterPageStep.ConfirmPhone]: <ConfirmPhoneView />,
        [RegisterPageStep.FillCredentials]: <FillCredentialsView />,
    }
    const viewToRender = useMemo(() => pageStepToViewMap[step], [step])
    const intl = useIntl()
    const RegistrationTitleMsg = intl.formatMessage({ id: 'pages.auth.RegistrationTitle' })

    return (
        <ConfirmIdentityContextProvider pageStore={pageStore} resetView={() => setStep(RegisterPageStep.EnterPhone)} setStep={setStep}>
            <Row gutter={[0, 24]}>
                <Col span={24}>
                    <Typography.Title>{RegistrationTitleMsg}</Typography.Title>
                </Col>
                <Col span={24}>
                    {viewToRender}
                </Col>
            </Row>
        </ConfirmIdentityContextProvider>
    )
}
RegisterPage.container = AuthLayout
RegisterPage.headerAction = <ButtonHeaderAction
    descriptor={{ id: 'pages.auth.AlreadyRegistered' }}
    path={'/auth/signin'}
/>