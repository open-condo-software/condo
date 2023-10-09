import React, { useCallback, useState } from 'react'
import { useCountdown } from 'usehooks-ts'

import { CONFIRM_ACTION_TTL_IN_SEC } from '@dev-api/domains/user/constants'

import { CodeInputStep } from './CodeInputStep'
import { PhoneInputStep } from './PhoneInputStep'

import type { PhoneInputStepProps } from './PhoneInputStep'

// NOTE: ConfirmPhoneAction is valid for 5 min, but registration form filling time is included in it
// So, we need to cut this time a bit, so user can resend code earlier (in case on delivery failure)
const RESET_MAX_TIMEOUT_IN_SEC = 90
const RESET_TIMEOUT_IN_SEC = Math.min(RESET_MAX_TIMEOUT_IN_SEC, CONFIRM_ACTION_TTL_IN_SEC)

type ConfirmActionType =  {
    phone: string
    actionId: string
    formattedPhone?: string
}

export const RegisterForm: React.FC = () => {
    const [confirmAction, setConfirmAction] = useState<ConfirmActionType | null>(null)
    const [isPhoneConfirmed, setIsPhoneConfirmed] = useState(false)

    const [actionTTL, { startCountdown, resetCountdown }] = useCountdown({
        countStart: RESET_TIMEOUT_IN_SEC,
        intervalMs: 1000,
    })

    const handlePhoneInputComplete = useCallback<PhoneInputStepProps['onComplete']>(({ phone, formattedPhone, actionId }) => {
        setConfirmAction({ phone, actionId, formattedPhone })
        startCountdown()
    }, [startCountdown])

    const handleCodeInputComplete = useCallback(() => {
        setIsPhoneConfirmed(true)
    }, [])

    const handlePhoneChange = useCallback(() => {
        setConfirmAction(null)
        resetCountdown()
    }, [resetCountdown])

    const handleResendActionComplete = useCallback((newActionId: string) => {
        if (confirmAction) {
            setConfirmAction({ ...confirmAction, actionId: newActionId })
        }
        resetCountdown()
        startCountdown()
    }, [confirmAction, resetCountdown, startCountdown])

    if (!confirmAction) {
        return <PhoneInputStep onComplete={handlePhoneInputComplete} />
    }

    if (!isPhoneConfirmed) {
        return (
            <CodeInputStep
                actionId={confirmAction.actionId}
                phone={confirmAction.phone}
                formattedPhone={confirmAction.formattedPhone}
                actionTTL={actionTTL}
                onComplete={handleCodeInputComplete}
                onCodeResendComplete={handleResendActionComplete}
                phoneChangeAction={handlePhoneChange}
            />
        )
    }



    return null
}