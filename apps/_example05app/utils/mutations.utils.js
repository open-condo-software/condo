import { notification } from 'antd'

function runMutation ({ action, mutation, variables, onCompleted, onError, onFinally, intl, form, ErrorToFormFieldMsgMapping, OnErrorMsg, OnCompletedMsg }) {
    if (!intl) throw new Error('intl prop required')
    if (!mutation && !action) throw new Error('mutation or action prop required')
    if (action && mutation) throw new Error('impossible to pass mutation and action prop')
    if (action && variables) throw new Error('impossible to pass action and variables prop')
    if (ErrorToFormFieldMsgMapping) {
        if (typeof ErrorToFormFieldMsgMapping !== 'object') throw new Error('ErrorToFormFieldMsgMapping prop is not an object')
        Object.entries(ErrorToFormFieldMsgMapping).forEach(([k, v]) => {
            if (typeof v !== 'object') throw new Error(`ErrorToFormFieldMsgMapping["${k}"] is not an object`)
            if (!v['name']) throw new Error(`ErrorToFormFieldMsgMapping["${k}"] has no "name" attr`)
            if (!v['errors']) throw new Error(`ErrorToFormFieldMsgMapping["${k}"] has no "errors" attr`)
            if (!Array.isArray(v['errors'])) throw new Error(`ErrorToFormFieldMsgMapping["${k}"]["errors"] is not an array`)
        })
    }
    const DoneMsg = intl.formatMessage({ id: 'Done' })
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })

    action = (action) ? action : () => mutation({ variables })

    return action()
        .then(
            (data) => {
                if (OnCompletedMsg === null) {
                    // we want to SKIP any notifications
                } else if (typeof OnCompletedMsg === 'undefined') {
                    // default notification message
                    notification.success({ message: DoneMsg })
                } else {
                    // custom notification message
                    // TODO(pahaz): think about more complex notifications. OnCompletedMsg many be an object! (if we want to have come actions inside a notification)
                    notification.success({ message: OnCompletedMsg })
                }

                if (onCompleted) return onCompleted(data)
                else return data
            },
            (e) => {
                console.error('mutation error:', e)

                let friendlyDescription = null
                let notificationContext = null
                if (ErrorToFormFieldMsgMapping) {
                    const errors = []
                    const errorString = `${e}`
                    Object.keys(ErrorToFormFieldMsgMapping).forEach((msg) => {
                        if (errorString.includes(msg)) {
                            errors.push(ErrorToFormFieldMsgMapping[msg])
                            if (ErrorToFormFieldMsgMapping[msg] && Array.isArray(ErrorToFormFieldMsgMapping[msg].errors)) {
                                friendlyDescription = ErrorToFormFieldMsgMapping[msg].errors[0]
                            }
                        }
                    })
                    // TODO(pahaz): if there is some error without ErrorToFormFieldMsgMapping. We should add NON FIELD FORM ERROR? Is the ant support it?
                    if (form && errors.length) {
                        form.setFields(errors)
                    }
                }

                if (OnErrorMsg === null) {
                    // we want to SKIP any notifications
                } else if (typeof OnErrorMsg === 'undefined') {
                    // default notification message
                    notificationContext = {
                        message: ServerErrorMsg,
                        description: friendlyDescription || e.message,
                    }
                } else {
                    // custom notification message
                    // TODO(pahaz): think about more complex notifications. OnCompletedMsg many be an object! (if we want to have come actions inside a notification)
                    notificationContext = {
                        message: ServerErrorMsg,
                        description: OnErrorMsg,
                    }
                }

                e.notification = notificationContext
                e.friendlyDescription = friendlyDescription
                if (notificationContext) notification.error(notificationContext)
                if (onError) return onError(e)
                else throw e
            })
        .finally(() => {
            if (onFinally) return onFinally()
        })
}

export {
    runMutation,
}
