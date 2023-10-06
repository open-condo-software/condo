import { notification, FormInstance } from 'antd'
import { z } from 'zod'

import type { ApolloError } from '@apollo/client'

type OnErrorHandlerType = (error: ApolloError) => void

type TypeToFieldMapping = Record<string, string>

const GQLErrorSchema = z.object({
    name: z.literal('GQLError'),
    extensions: z.object({
        type: z.string(),
        message: z.string(),
    }),
})


export function getFormErrorHandler<FormType> (form: FormInstance<FormType>, errorFieldMapping?: TypeToFieldMapping): OnErrorHandlerType {
    return function (error) {
        let formAffected = false
        if (error.graphQLErrors) {
            for (const graphQLError of error.graphQLErrors) {
                const parseResult = GQLErrorSchema.safeParse(graphQLError)
                if (parseResult.success) {
                    const { extensions: { type, message } } = parseResult.data
                    if (errorFieldMapping && errorFieldMapping.hasOwnProperty(type)) {
                        formAffected = true
                        form.setFields([
                            { name: errorFieldMapping[type], errors: [message] },
                        ])
                    }
                }
            }
        }

        if (!formAffected) {
            notification.error({ message: error.message })
        }
    }
}