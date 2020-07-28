import { notification } from 'antd'

function runMutation ({ mutation, variables, onCompleted, onError, onFinally, intl, form, ErrorToFormFieldMsgMapping, OnErrorMsg, OnCompletedMsg }) {
    if (!intl) throw new Error('intl prop required')
    const DoneMsg = intl.formatMessage({ id: 'Done' })
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })

    return mutation({ variables })
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
                console.error(`mutation error:`, e)
                if (OnErrorMsg === null) {
                    // we want to SKIP any notifications
                } else if (typeof OnErrorMsg === 'undefined') {
                    // default notification message
                    notification.error({
                        message: ServerErrorMsg,
                        description: e.message,
                    })
                } else {
                    // custom notification message
                    // TODO(pahaz): think about more complex notifications. OnCompletedMsg many be an object! (if we want to have come actions inside a notification)
                    notification.error({
                        message: ServerErrorMsg,
                        description: OnErrorMsg,
                    })
                }

                if (form && ErrorToFormFieldMsgMapping) {
                    const errors = []
                    const errorString = `${e}`
                    Object.keys(ErrorToFormFieldMsgMapping).forEach((msg) => {
                        if (errorString.includes(msg)) {
                            errors.push(ErrorToFormFieldMsgMapping[msg])
                        }
                    })
                    // TODO(pahaz): if there is some error without ErrorToFormFieldMsgMapping. We should add NON FIELD FORM ERROR? Is the ant support it?
                    if (errors.length) {
                        form.setFields(errors)
                    }
                }

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
