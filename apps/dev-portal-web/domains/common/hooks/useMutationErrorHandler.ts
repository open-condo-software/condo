import { notification } from 'antd'
import get from 'lodash/get'
import { useCallback } from 'react'
import { useIntl } from 'react-intl'
import { z } from 'zod'

import type { ApolloError } from '@apollo/client'
import type { FormInstance } from 'antd'

const GQLErrorSchema = z.object({
    name: z.literal('GQLError'),
    extensions: z.object({
        type: z.string(),
        message: z.string(),
        messageForUser: z.string().optional(),
    }),
})

const ConstraintErrorSchema = z.object({
    name: z.literal('ApolloError'),
    extensions: z.object({
        code: z.literal('INTERNAL_SERVER_ERROR'),
    }),
    message: z.string().includes('violates unique constraint'),
})

export type ErrorHandler = (error: ApolloError) => void

type UseMutationErrorHandlerArgs = {
    form?: FormInstance
    typeToFieldMapping?: Record<string, string>
    constraintToMessageMapping?: Record<string, string>
    errorHandlers?: Record<string, (errorMessage: string) => void>
}

/**
 * Generates the error handler, which can be passed as onError prop for useMutation calls and does the following.
 * If there's a form and typeToFieldMapping props passed and some related to form errors happened, updates form status
 * Else if there's any GQLError thrown, extracts messageForUser and show "Server Error" notification
 * Else uses default message which is extracted from ApolloError
 * @param opts
 */
export function useMutationErrorHandler (opts: UseMutationErrorHandlerArgs = {}): ErrorHandler {
    const intl = useIntl()
    const ServerErrorMessage = intl.formatMessage({ id: 'global.errors.serverError.title' })
    const DefaultConstraintErrorDescription = intl.formatMessage({ id: 'global.errors.constraintError.default.description' })
    const { form, typeToFieldMapping, constraintToMessageMapping, errorHandlers } = opts

    return useCallback((error) => {
        let messageToShow = error.message
        let bypassNotification = false
        for (const graphQLError of error.graphQLErrors) {
            let errorMessage: string | undefined
            let errorType:  string | undefined

            const gqlErrorParseResult = GQLErrorSchema.safeParse(graphQLError)

            if (gqlErrorParseResult.success) {
                const { extensions: { type, message, messageForUser } } = gqlErrorParseResult.data
                errorMessage = messageForUser || message
                errorType = type

            } else {
                const constraintErrorParseResult = ConstraintErrorSchema.safeParse(graphQLError)
                if (constraintErrorParseResult.success) {
                    const { message } = constraintErrorParseResult.data
                    // NOTE: message includes '... violates unique constraint "constraint_name"'
                    const constraintName = (message.split(' ').pop() as string).slice(1, -1)
                    errorType = constraintName
                    errorMessage = get(constraintToMessageMapping, constraintName, DefaultConstraintErrorDescription)
                }
            }

            if (errorMessage) {
                if (errorType && form && typeToFieldMapping && typeToFieldMapping.hasOwnProperty(errorType)) {
                    bypassNotification = true
                    const fieldName = typeToFieldMapping[errorType]
                    form.setFields([{
                        name: fieldName,
                        errors: [errorMessage],
                    }])
                } else if (errorType && errorHandlers && errorHandlers.hasOwnProperty(errorType)) {
                    bypassNotification = true
                    errorHandlers[errorType](errorMessage)
                } else {
                    messageToShow = errorMessage
                }
            }
        }
        if (!bypassNotification) {
            notification.error({ message: ServerErrorMessage, description: messageToShow })
        }
    }, [
        ServerErrorMessage,
        DefaultConstraintErrorDescription,
        form,
        typeToFieldMapping,
        constraintToMessageMapping,
        errorHandlers,
    ])
}