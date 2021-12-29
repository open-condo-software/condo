import { ComponentProps, useCallback, useEffect, useMemo, useState } from 'react'
import { Row, Col, Typography } from 'antd'
import { useRouter } from 'next/router'
import { useIntl } from '@core/next/intl'
import { useMutation } from '@core/next/apollo'
import { ConfirmPhoneView } from '@condo/domains/user/components/auth/ConfirmPhoneView'
import { RegisterPhoneView } from '@condo/domains/user/components/auth/register/RegisterPhoneView'
import { FillCredentialsView } from '@condo/domains/user/components/auth/register/FillCredentialsView'
import { RegisterPageStep } from '@condo/domains/user/components/auth/register/RegisterPageStep'
import { useConfirmIdentityPageStore } from '@condo/domains/user/components/auth/hooks'
import { ButtonHeaderAction } from '@condo/domains/common/components/HeaderActions'
import { AuthLayout } from '@condo/domains/user/components/containers/AuthLayout'
import { ConfirmIdentityContextProvider } from '@condo/domains/user/components/auth/ConfirmIdentityContext'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { CREATE_ONBOARDING_MUTATION } from '@condo/domains/onboarding/gql'

export default function RegisterPage () {
    const intl = useIntl()
    const RegistrationTitleMsg = intl.formatMessage({ id: 'pages.auth.RegistrationTitle' })

    const [step, setStep] = useState<RegisterPageStep>()

    const pageStore = useConfirmIdentityPageStore('registration_token', 'registration_step')

    const router = useRouter()

    const [createOnBoarding] = useMutation(CREATE_ONBOARDING_MUTATION, {
        onCompleted: () => {
            router.push('/onboarding')
        },
    })

    const initOnBoarding = useCallback((userId: string) => {
        const onBoardingExtraData = {
            dv: 1,
            sender: getClientSideSenderInfo(),
        }
        const data = { ...onBoardingExtraData, type: 'ADMINISTRATOR', userId }
        runMutation({
            mutation: createOnBoarding,
            variables: { data },
            intl,
        })
    }, [createOnBoarding, intl])

    const onRegPhoneDone: ComponentProps<typeof RegisterPhoneView>['onDone']
        = useCallback((reason) => {
            if (reason === 'already_confirmed')
                return setStep(RegisterPageStep.FillCredentials)
            if (reason === 'success')
                return setStep(RegisterPageStep.ConfirmPhone)
        }, [])

    const onConfirmPhoneDone: ComponentProps<typeof ConfirmPhoneView>['onDone']
        = useCallback((reason) => {
            if (reason === 'no_data') {
                pageStore.forgetToken()
                pageStore.forgetStep()
                return setStep(RegisterPageStep.EnterPhone)
            }
            if (reason === 'change_phone') {
                pageStore.forgetToken()
                return setStep(RegisterPageStep.EnterPhone)
            }
            if (reason === 'already_confirmed') {
                return setStep(RegisterPageStep.FillCredentials)
            }
            if (reason === 'success' || reason === 'already_confirmed') {
                return setStep(RegisterPageStep.FillCredentials)
            }
        }, [pageStore])

    const onCredentialsDone: ComponentProps<typeof FillCredentialsView>['onDone']
        = useCallback((reason, userId) => {
            console.log(reason)
            if (reason === 'success') {
                pageStore.forgetToken()
                pageStore.forgetStep()
                return initOnBoarding(userId)
            }
            if (reason === 'no_data') {
                pageStore.forgetStep()
                return setStep(RegisterPageStep.EnterPhone)
            }
        }, [initOnBoarding, pageStore])

    const pageStepToViewMap = {
        [RegisterPageStep.EnterPhone]: <RegisterPhoneView onDone={onRegPhoneDone} />,
        [RegisterPageStep.ConfirmPhone]: <ConfirmPhoneView onDone={onConfirmPhoneDone} />,
        [RegisterPageStep.FillCredentials]: <FillCredentialsView onDone={onCredentialsDone} />,
    }
    const viewToRender = useMemo(() => pageStepToViewMap[step] || pageStepToViewMap[RegisterPageStep.EnterPhone], [step])

    useEffect(() => {
        const step = pageStore.loadStep<RegisterPageStep>()
        console.log('step from store', step)
        if (step && Object.values(RegisterPageStep).includes(step as RegisterPageStep)) {
            console.log('loaded step', step)
            setStep(step as RegisterPageStep)
        }
        else setStep(RegisterPageStep.EnterPhone)
    }, [])

    useEffect(() => {
        console.log('step changed!', step)
        if (step?.length > 0) pageStore.saveStep(step)
    }, [step])

    return (
        <ConfirmIdentityContextProvider pageStore={pageStore} resetView={() => setStep(RegisterPageStep.EnterPhone)}>
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