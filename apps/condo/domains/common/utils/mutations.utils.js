import { notification } from 'antd'
import { NETWORK_ERROR } from '@condo/domains/common/constants/errors'
import find from 'lodash/find'
import get from 'lodash/get'

const getMessageFrom = (error) => (
    get(error, ['extensions', 'messageForUser']) ||
    get(error, ['extensions', 'message']) ||
    get(error.message)
)

/**
 * Mapping of error codes to field errors
 * Maps error codes to field names and list of errors, that **are declared on the client**
 *
 * !!! New errors syntax
 * A property `errors` is now optional, to get errors from server, leave it undefined
 *
 * @typedef {Object.<string, {name: String, [errors]: Array.<string>}>} ErrorToFormFieldMsgMapping
 */

/**
 * Sends provided mutation request to server and handles errors
 *
 * !!! New errors syntax
 * To display custom notification error, depending on what error server is returned,
 * pass an `NotificationErrorFilters` argument with array of filtering criterias.
 * Filtering criteria represents a fragment of `GQLError` object, that will be applied to `e.graphQLErrors.[].extensions` property.
 * Errors, filtered this way will be passed to Ant `notification` util.
 *
 * @param action - custom function to execute
 * @param mutation - result of `useMutation`
 * @param variables - gets passed to `mutation` function
 * @param onCompleted
 * @param onError
 * @param onFinally
 * @param intl
 * @param form
 * @param {ErrorToFormFieldMsgMapping} ErrorToFormFieldMsgMapping - mapping of errors either in old or new format
 * @param {null|String|} [OnErrorMsg] - controls passing errors to Ant `notification` util
 * @param {Array.<GQLError>} [NotificationErrorFilters] - maps errors by search criteria to `notification` util
 * @param OnCompletedMsg
 * @return {*}
 */
function runMutation ({ action, mutation, variables, onCompleted, onError, onFinally, intl, form, ErrorToFormFieldMsgMapping, NotificationErrorFilters, OnErrorMsg, OnCompletedMsg }) {
    if (!intl) throw new Error('intl prop required')
    if (!mutation && !action) throw new Error('mutation or action prop required')
    if (action && mutation) throw new Error('impossible to pass mutation and action prop')
    if (action && variables) throw new Error('impossible to pass action and variables prop')
    if (ErrorToFormFieldMsgMapping) {
        if (typeof ErrorToFormFieldMsgMapping !== 'object') throw new Error('ErrorToFormFieldMsgMapping prop is not an object')
        Object.entries(ErrorToFormFieldMsgMapping).forEach(([k, v]) => {
            if (typeof v !== 'object') throw new Error(`ErrorToFormFieldMsgMapping["${k}"] is not an object`)
            if (!v['name']) throw new Error(`ErrorToFormFieldMsgMapping["${k}"] has no "name" attr`)
        })
    }
    const DoneMsg = intl.formatMessage({ id: 'OperationCompleted' })
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
                    const errorString = e.graphQLErrors ? `${JSON.stringify(e)}` : `${e}`
                    Object.keys(ErrorToFormFieldMsgMapping).forEach((key) => {
                        const errorMap = ErrorToFormFieldMsgMapping[key]
                        // Custom errors are presented on the client
                        if (errorMap.errors) {
                            if (errorString.includes(key)) {
                                errors.push(errorMap)
                                if (errorMap && Array.isArray(errorMap.errors)) {
                                    friendlyDescription = errorMap.errors[0]
                                }
                            }
                        } else {
                            // Take errors from server
                            const graphQLError = find(e.graphQLErrors, { extensions: { type: key } })
                            if (graphQLError) {
                                errors.push({
                                    name: errorMap.name,
                                    errors: [getMessageFrom(graphQLError)],
                                })
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
                } else if (typeof OnErrorMsg === 'string') {
                    // custom notification message
                    // TODO(pahaz): think about more complex notifications. OnCompletedMsg many be an object! (if we want to have come actions inside a notification)
                    notificationContext = {
                        message: ServerErrorMsg,
                        description: OnErrorMsg,
                    }
                } else if (NotificationErrorFilters) {
                    for (let i = 0; i < NotificationErrorFilters.length; i++) {
                        let errorFilter = NotificationErrorFilters[i]
                        const errorForNotification = find(e.graphQLErrors, { extensions: errorFilter })
                        if (errorForNotification) {
                            notificationContext = {
                                message: ServerErrorMsg,
                                description: getMessageFrom(errorForNotification),
                            }
                            break
                        }
                    }
                } else {
                    // default notification message
                    if (e.message.toLowerCase() === NETWORK_ERROR) {
                        friendlyDescription = intl.formatMessage({ id: 'NetworkError' })
                    }
                    notificationContext = {
                        message: ServerErrorMsg,
                        description: friendlyDescription || e.message,
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
