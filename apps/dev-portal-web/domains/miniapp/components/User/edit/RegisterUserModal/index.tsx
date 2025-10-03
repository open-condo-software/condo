import { Form, notification } from 'antd'
import React, { useCallback, useMemo, useState } from 'react'
import { useIntl } from 'react-intl'
import { useCountdown } from 'usehooks-ts'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { Modal, Button } from '@open-condo/ui'
import type { ModalProps } from '@open-condo/ui'

import { useMutationErrorHandler, ErrorHandler } from '@/domains/common/hooks/useMutationErrorHandler'
import { CONFIRM_EMAIL_ACTION_TTL_IN_SEC } from '@dev-portal-api/domains/user/constants'
import { INVALID_EMAIL, ACTION_NOT_FOUND, INVALID_CODE, CONDO_USER_ALREADY_EXISTS } from '@dev-portal-api/domains/user/constants/errors'

import { CodeInputStep } from './CodeInputStep'
import { EmailInputStep } from './EmailInputStep'

import type { CodeInputStepProps } from './CodeInputStep'
import type { EmailInputStepProps } from './EmailInputStep'

import {
    AppEnvironment,
    useStartConfirmEmailActionMutation,
    StartConfirmEmailActionMutation,
    useCompleteConfirmEmailActionMutation,
    useRegisterAppUserServiceMutation,
    AllB2CAppAccessRightsDocument,
} from '@/gql'

// NOTE: Code is alive for 5 minutes, but we cut it on front-end side to reduce long awaiting
const RESET_MAX_TIMEOUT_IN_SEC = 120
const RESET_TIMEOUT_IN_SEC = Math.min(RESET_MAX_TIMEOUT_IN_SEC, CONFIRM_EMAIL_ACTION_TTL_IN_SEC)

type RegisterUserModalProps = Pick<ModalProps, 'open'> & {
    id: string
    environment: AppEnvironment
    onClose: () => void
}

type ConfirmAction = {
    actionId: string
    email: string
}

const EMAIL_FORM_ERRORS_TO_FIELDS_MAP = {
    [INVALID_EMAIL]: 'email',
}

const CODE_FORM_ERRORS_TO_FIELDS_MAP = {
    [ACTION_NOT_FOUND]: 'code',
    [INVALID_CODE]: 'code',
}

export const RegisterUserModal: React.FC<RegisterUserModalProps> = ({ onClose, open, id, environment }) => {
    const intl = useIntl()
    const ModalTitle = intl.formatMessage({ id: 'pages.apps.any.id.sections.serviceUser.userSettings.registerUserForm.modal.title' })
    const ContinueActionLabel = intl.formatMessage({ id: 'pages.apps.any.id.sections.serviceUser.userSettings.registerUserForm.actions.continue' })
    const SuccessNotificationTitle = intl.formatMessage({ id: 'pages.apps.any.id.sections.serviceUser.userSettings.registerUserForm.notifications.success.title' })
    const SuccessNotificationDescription = intl.formatMessage({ id: 'pages.apps.any.id.sections.serviceUser.userSettings.registerUserForm.notifications.success.description' })

    const [form] = Form.useForm()

    const [actionTTL, { startCountdown, resetCountdown }] = useCountdown({
        countStart: RESET_TIMEOUT_IN_SEC,
        intervalMs: 1000,
    })

    const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
    // NOTE: Used to display error in email form in case of error in registerServiceUser
    const [registerError, setRegisterError] = useState<string | null>(null)

    const resetConfirmAction = useCallback(() => {
        setConfirmAction(null)
    }, [])

    const onStartConfirmEmailActionError = useMutationErrorHandler({
        form,
        typeToFieldMapping: EMAIL_FORM_ERRORS_TO_FIELDS_MAP,
    })
    const onStartConfirmEmailActionCompleted = useCallback((data: StartConfirmEmailActionMutation) => {
        if (data.startConfirmEmailAction?.actionId && data.startConfirmEmailAction.email) {
            setConfirmAction(data.startConfirmEmailAction)
            resetCountdown()
            startCountdown()
        }
    }, [resetCountdown, startCountdown])
    const [startConfirmEmailActionMutation] = useStartConfirmEmailActionMutation({
        onError: onStartConfirmEmailActionError,
        onCompleted: onStartConfirmEmailActionCompleted,
    })

    const startConfirmEmailAction: EmailInputStepProps['onFinish'] = useCallback(({ email }) => {
        setRegisterError(null)
        startConfirmEmailActionMutation({
            variables: {
                data: {
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                    email,
                },
            },
        })
    }, [startConfirmEmailActionMutation])

    const registerServiceUserErrorHandlers = useMemo(() => ({
        [CONDO_USER_ALREADY_EXISTS]: (errorMessage: string) => {
            setRegisterError(errorMessage)
        },
    }), [])
    const registerServiceUserErrorHandler = useMutationErrorHandler({
        errorHandlers: registerServiceUserErrorHandlers,
    })
    const onRegisterServiceUserError: ErrorHandler = useCallback((error) => {
        // At this stage code is valid, so we need to move back to email form in case of error
        setConfirmAction(null)
        registerServiceUserErrorHandler(error)
    }, [registerServiceUserErrorHandler])
    const onRegisterServiceUserCompleted = useCallback(() => {
        notification.success({ message: SuccessNotificationTitle, description: SuccessNotificationDescription, duration: 15 })
        onClose()
    }, [SuccessNotificationDescription, SuccessNotificationTitle, onClose])
    const [registerServiceUserMutation] = useRegisterAppUserServiceMutation({
        onError: onRegisterServiceUserError,
        onCompleted: onRegisterServiceUserCompleted,
        refetchQueries: [
            { query: AllB2CAppAccessRightsDocument, variables: { environment, appId: id } },
        ],
    })

    const onCompleteConfirmEmailActionError = useMutationErrorHandler({
        form,
        typeToFieldMapping: CODE_FORM_ERRORS_TO_FIELDS_MAP,
    })
    const onCompleteConfirmEmailActionCompleted = useCallback(() => {
        if (confirmAction) {
            registerServiceUserMutation({
                variables: {
                    data: {
                        dv: 1,
                        sender: getClientSideSenderInfo(),
                        app: { id },
                        environment,
                        confirmEmailAction: { id: confirmAction.actionId },
                    },
                },
            })
        }
    }, [confirmAction, registerServiceUserMutation, id, environment])
    const [completeConfirmEmailActionMutation] = useCompleteConfirmEmailActionMutation({
        onError: onCompleteConfirmEmailActionError,
        onCompleted: onCompleteConfirmEmailActionCompleted,
    })

    const completeConfirmEmailAction: CodeInputStepProps['onFinish'] = useCallback(({ code }) => {
        if (confirmAction) {
            completeConfirmEmailActionMutation({
                variables: {
                    data: {
                        dv: 1,
                        sender: getClientSideSenderInfo(),
                        actionId: confirmAction.actionId,
                        code,
                    },
                },
            })
        }
    }, [confirmAction, completeConfirmEmailActionMutation])

    const handleResendEmailAction = useCallback(() => {
        if (confirmAction) {
            startConfirmEmailAction({ email: confirmAction.email })
        }
    }, [confirmAction, startConfirmEmailAction])


    const [modalContent, modalFooter] = useMemo<[React.ReactNode, React.ReactNode]>(() => {
        if (!confirmAction) {
            return [
                <EmailInputStep key='email-form' form={form} onFinish={startConfirmEmailAction} errorMsg={registerError}/>,
                <Button key='action' type='primary' onClick={form.submit}>{ContinueActionLabel}</Button>,
            ]
        }

        return [
            <CodeInputStep
                key={`code-form-${confirmAction.actionId}`}
                actionId={confirmAction.actionId}
                form={form}
                email={confirmAction.email}
                onEmailChange={resetConfirmAction}
                actionTTL={actionTTL}
                onResendEmailClick={handleResendEmailAction}
                onFinish={completeConfirmEmailAction}
            />,
            null,
        ]
    }, [
        confirmAction,
        resetConfirmAction,
        startConfirmEmailAction,
        handleResendEmailAction,
        completeConfirmEmailAction,
        form,
        actionTTL,
        registerError,
        ContinueActionLabel,
    ])

    return (
        <Modal
            open={open}
            onCancel={onClose}
            title={ModalTitle}
            footer={modalFooter}
        >
            {modalContent}
        </Modal>
    )
}