
import React, { ComponentProps, useCallback, useMemo, useState } from 'react'
import { ResetPasswordPhoneView } from '@condo/domains/user/components/auth/forgot/ResetPasswordPhoneView'
import { ConfirmPhoneView } from '@condo/domains/user/components/auth/ConfirmPhoneView'
import { ChangePasswordView } from '@condo/domains/user/components/auth/forgot/ChangePasswordView'
import { ResetPasswordStep } from '@condo/domains/user/components/auth/forgot/ResetPasswordStep'
import { AuthLayout } from '@condo/domains/user/components/containers/AuthLayout'
import { ButtonHeaderAction } from '@condo/domains/common/components/HeaderActions'
import { ConfirmIdentityContextProvider } from '@condo/domains/user/components/auth/ConfirmIdentityContext'
import { useConfirmIdentityPageStore } from '@condo/domains/user/components/auth/hooks'

const ForgotPasswordPage = () => {
    const [step, setStep] = useState<ResetPasswordStep>(ResetPasswordStep.EnterPhone)

    const pageStore = useConfirmIdentityPageStore('forgot_token', 'forgot_step')

    const onRegPhoneDone: ComponentProps<typeof ResetPasswordPhoneView>['onDone']
        = useCallback((reason) => {
            if (reason === 'success') {
                setStep(ResetPasswordStep.ConfirmPhone)
            }
        }, [])

    const onConfirmPhoneDone: ComponentProps<typeof ConfirmPhoneView>['onDone']
        = useCallback((reason) => {

        }, [pageStore])

    const onChangePasswordDone: ComponentProps<typeof ChangePasswordView>['onDone']
        = useCallback((reason) => {
            console.log(reason)
        }, [pageStore])

    const pageStepToViewMap = {
        [ResetPasswordStep.EnterPhone]: <ResetPasswordPhoneView onDone={onRegPhoneDone} />,
        [ResetPasswordStep.ConfirmPhone]: <ConfirmPhoneView onDone={onConfirmPhoneDone} />,
        [ResetPasswordStep.EnterNewPassword]: <ChangePasswordView onDone={onChangePasswordDone} />,
    }
    const viewToRender = useMemo(() => pageStepToViewMap[step], [step])

    return (
        <ConfirmIdentityContextProvider pageStore={pageStore} resetView={() => setStep(ResetPasswordStep.EnterPhone)}>
            {viewToRender}
        </ConfirmIdentityContextProvider>
    )
}
ForgotPasswordPage.container = AuthLayout
ForgotPasswordPage.headerAction = <ButtonHeaderAction descriptor={{ id: 'pages.auth.Register' }} path={'/auth/register'} />

export default ForgotPasswordPage
