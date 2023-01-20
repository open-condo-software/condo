import { notification } from 'antd'
import find from 'lodash/find'
import get from 'lodash/get'
import isFunction from 'lodash/isFunction'

import { NETWORK_ERROR } from '@condo/domains/common/constants/errors'

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
 * @example
 * Pass to `notification` only messages with `extensions.type = 'TOKEN_NOT_FOUND'`:
 * ```js
 * const NotificationErrorFilters = [
 *     { type: TOKEN_NOT_FOUND },
 * ]
 * ```
 * Skip notifications:
 * ```js
 * NotificationErrorFilters = null
 * ```
 *
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
 * @param OnCompletedMsg
 * @return {*}
 */
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
                } else if (isFunction(OnCompletedMsg)) {
                    // custom notification message
                    notification.success(OnCompletedMsg(data))
                } else {
                    notification.success({ message: OnCompletedMsg })
                }

                if (onCompleted) return onCompleted(data)
                else return data
            },
            (e) => {
                const errors = []
                const errorString = e.graphQLErrors ? JSON.stringify(e) : String(e)
                console.error('mutation error:', errorString)
                let friendlyDescription = null
                let notificationContext = null

                if (e.graphQLErrors) {
                    // NOTE(pahaz): old style errors (or overridden server errors)
                    if (ErrorToFormFieldMsgMapping) {
                        Object.keys(ErrorToFormFieldMsgMapping).forEach((key) => {
                            const errorMap = ErrorToFormFieldMsgMapping[key]
                            if (!errorMap.errors || !errorMap.name) {
                                console.warn('@DEPRECATED ErrorToFormFieldMsgMapping format!', errorMap)
                                return
                            }
                            // Custom errors are presented on the client
                            if (errorString.includes(key)) {
                                errors.push(errorMap)
                                if (errorMap && Array.isArray(errorMap.errors)) {
                                    friendlyDescription = errorMap.errors[0]
                                }
                            }
                        })
                    }

                    // NOTE(pahaz): new localized errors
                    const newStyleErrors = e.graphQLErrors.filter((x) => x.name === 'GQLError')
                    if (newStyleErrors.length) {
                        newStyleErrors.forEach(error => {
                            const messageForUser = get(error, 'extensions.messageForUser', '')
                            if (!messageForUser) return

                            friendlyDescription = messageForUser

                            const fieldPath = get(error, 'extensions.variable', [])
                            if (fieldPath && fieldPath.length) {
                                errors.push({
                                    name: fieldPath[fieldPath.length - 1],
                                    errors: [messageForUser],
                                })
                            }
                        })
                    }
                }

                // TODO(pahaz): if there is some error without ErrorToFormFieldMsgMapping. We should add NON FIELD FORM ERROR? Is the ant support it?
                if (form && errors.length) {
                    form.setFields(errors)
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
