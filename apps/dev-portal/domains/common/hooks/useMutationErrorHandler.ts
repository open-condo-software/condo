import { notification } from 'antd'
import { useCallback } from 'react'
import { useIntl } from 'react-intl'
import { z } from 'zod'

import type { ApolloError } from '@apollo/client'
import type { FormInstance } from 'antd'

type ErrorHandler = (error: ApolloError) => void

type UseMutationErrorHandlerArgs<FormType> = {
    form?: FormInstance<FormType>
    typeToFieldMapping?: Record<string, string>
}

const GQLErrorSchema = z.object({
    name: z.literal('GQLError'),
    extensions: z.object({
        type: z.string(),
        message: z.string(),
        messageForUser: z.string().optional(),
    }),
})

/**
 * Generates the error handler, which can be passed as onError prop for useMutation calls and does the following.
 * If there's a form and typeToFieldMapping props passed and some related to form errors happened, updates form status
 * Else if there's any GQLError thrown, extracts messageForUser and show "Server Error" notification
 * Else uses default message which is extracted from ApolloError
 * @param opts
 */
export function useMutationErrorHandler<FormType> (opts: UseMutationErrorHandlerArgs<FormType> = {}): ErrorHandler {
    const intl = useIntl()
    const ServerErrorMessage = intl.formatMessage({ id: 'global.errors.serverError.title' })
    const { form, typeToFieldMapping } = opts

    return useCallback((error) => {
        let messageToShow = error.message
        let formAffected = false
        for (const graphQLError of error.graphQLErrors) {
            const parseResult = GQLErrorSchema.safeParse(graphQLError)
            if (parseResult.success) {
                const { extensions: { type, message, messageForUser } } = parseResult.data
                const userMessage = messageForUser || message
                if (form && typeToFieldMapping && typeToFieldMapping.hasOwnProperty(type)) {
                    formAffected = true
                    const fieldName = typeToFieldMapping[type]
                    form.setFields([{
                        name: fieldName,
                        errors: [userMessage],
                    }])
                } else {
                    messageToShow = userMessage
                }
            }
        }
        if (!formAffected) {
            notification.error({ message: ServerErrorMessage, description: messageToShow })
        }
    }, [ServerErrorMessage, form, typeToFieldMapping])
}