import { notification } from 'antd'
import get from 'lodash/get'
import { useCallback } from 'react'
import { z } from 'zod'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import type { ApolloError } from '@apollo/client'
import type { FormInstance } from 'antd'

type ErrorHandler = (error: ApolloError) => void

type UseMutationErrorHandlerArgs<FormType> = {
    form?: FormInstance<FormType>
    typeToFieldMapping?: Record<string, string>
    constraintToMessageMapping?: Record<string, string>
}

const GQLErrorSchema = z.object({
    name: z.literal('GQLError'),
    extensions: z.object({
        type: z.string(),
        message: z.string(),
        messageForUser: z.string().optional(),
        variable: z.array(z.string()).optional(),
    }),
})

const ConstraintErrorSchema = z.object({
    name: z.literal('GraphQLError'),
    extensions: z.object({
        code: z.literal('INTERNAL_SERVER_ERROR'),
    }),
    message: z.string().includes('violates unique constraint'),
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
    const DefaultConstraintErrorDescription = intl.formatMessage({ id: 'global.errors.constraintError.default.description' })
    const { form, typeToFieldMapping, constraintToMessageMapping } = opts

    return useCallback((error) => {
        let messageToShow = error.message
        let formAffected = false
        for (const graphQLError of error.graphQLErrors) {
            let errorMessage: string | undefined
            let errorType: string | undefined
            let variable: Array<string> | undefined

            const gqlErrorParseResult = GQLErrorSchema.safeParse(graphQLError)

            if (gqlErrorParseResult.success) {
                const { extensions: { type, message, messageForUser, variable: variableFromError } } = gqlErrorParseResult.data
                errorMessage = messageForUser || message
                errorType = type
                variable = variableFromError
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
                messageToShow = errorMessage

                if (errorType && form && typeToFieldMapping && typeToFieldMapping.hasOwnProperty(errorType)) {
                    formAffected = true
                    const fieldName = typeToFieldMapping[errorType]
                    form.setFields([{
                        name: fieldName,
                        errors: [errorMessage],
                    }])
                } else if (form && variable) {
                    const fieldName = variable[variable.length - 1]
                    if (fieldName) {
                        const field = form.getFieldInstance(fieldName)
                        if (field) {
                            formAffected = true
                            form.setFields([{
                                name: fieldName,
                                errors: [errorMessage],
                            }])
                        }
                    }
                }
            }
        }
        if (!formAffected) {
            notification.error({
                message: <Typography.Title level={4}>{ServerErrorMessage}</Typography.Title>,
                description: <Typography.Paragraph type='secondary'>{messageToShow}</Typography.Paragraph>,
            })
        }
    }, [ServerErrorMessage, DefaultConstraintErrorDescription, form, typeToFieldMapping, constraintToMessageMapping])
}
