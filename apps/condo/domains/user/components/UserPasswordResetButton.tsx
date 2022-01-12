import { Typography } from 'antd'
import get from 'lodash/get'
import React from 'react'
import { useMutation } from '@core/next/apollo'
import { useIntl } from '@core/next/intl'
import { Button } from '@condo/domains/common/components/Button'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { useAuth } from '@core/next/auth'
import { CountDownTimer } from '../../common/components/CountDownTimer'
import { START_PASSWORD_RECOVERY_MUTATION } from '../gql'
import { getClientSideSenderInfo } from '../../common/utils/userid.utils'

export const UserPasswordResetButton = () => {
    const intl = useIntl()
    const ChangePasswordLabel = intl.formatMessage({ id: 'profile.ChangePassword' })
    const SecondsLabel = intl.formatMessage({ id: 'Seconds' })

    const { user } = useAuth()
    const [startPasswordRecovery] = useMutation(START_PASSWORD_RECOVERY_MUTATION)

    const updatePassword = () => {
        const sender = getClientSideSenderInfo()
        const meta = { dv: 1, sender }
        // @ts-ignore TODO(Dimitreee): remove after runMutation typo
        return runMutation({
            mutation: startPasswordRecovery,
            variables: {
                data: {
                    phone: get(user, 'phone'),
                    ...meta,
                },
            },
            intl,
        })
    }

    return (
        <CountDownTimer action={updatePassword} id={'RESET_PASSWORD_BY_EMAIL'}>
            {({ countdown, runAction, loading }) => {
                const isCountDownActive = countdown > 0

                return (
                    <Button onClick={runAction} type={'inlineLink'} loading={loading} disabled={isCountDownActive}>
                        {ChangePasswordLabel}
                        {isCountDownActive && (
                            <Typography.Text type={'secondary'}>
                                &nbsp; ({countdown} {SecondsLabel})
                            </Typography.Text>
                        )}
                    </Button>
                )
            }}
        </CountDownTimer>
    )
}
