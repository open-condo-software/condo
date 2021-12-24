import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { RegisterForm } from '@condo/domains/user/components/auth/RegisterForm'
import { useRouter } from 'next/router'
import { useCallback, useEffect } from 'react'
import { useMutation } from '@core/next/apollo'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { useIntl } from '@core/next/intl'
import { CREATE_ONBOARDING_MUTATION } from '@condo/domains/onboarding/gql'
import { RegisterLayout } from '@condo/domains/user/components/auth/RegisterLayout'
import { useRegisterContext } from '@condo/domains/user/components/auth/RegisterContextProvider'

export default function RegisterPage () {
    const intl = useIntl()
    const { token, tokenLoading, isConfirmed, setToken } = useRegisterContext()
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

    const onRegisterFinish = useCallback((userId: string) => {
        setToken(null)
        initOnBoarding(userId)
    }, [initOnBoarding, setToken])

    useEffect(() => {
        if (!tokenLoading && (!token || !isConfirmed)) {
            router.push('/auth/input')
        }
    }, [tokenLoading, token, isConfirmed, router])

    return (
        <RegisterForm onFinish={onRegisterFinish} />
    )
}
RegisterPage.container = RegisterLayout