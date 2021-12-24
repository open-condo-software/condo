import { ConfirmPhoneForm } from '@condo/domains/user/components/auth/ConfirmPhoneForm'
import { RegisterLayout } from '@condo/domains/user/components/auth/RegisterLayout'
import { useRouter } from 'next/router'

export default function ConfirmPage () {
    const router = useRouter()
    return (
        <ConfirmPhoneForm
            onFinish={() => router.push('/auth/register')}
            onReset={() => {
                router.push('/auth/input')
            }}
        />)
}

ConfirmPage.container = RegisterLayout