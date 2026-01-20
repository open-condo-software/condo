import { useMemo } from 'react'

import { replaceHeaders } from '@/domains/common/components/MarkdownEditor/utils'

import type { FormRule, FormInstance } from 'antd'

type ValidateOptions = {
    form: FormInstance
    message: string
    fieldName: string
    minHeaderLevel?: number
    maxHeaderLevel?: number
    maxLength: number
}

export function useMarkdownLengthValidation ({
    form,
    fieldName,
    message,
    maxLength,
    minHeaderLevel = 1,
    maxHeaderLevel = 6,
}: ValidateOptions): FormRule {
    return useMemo(() => ({
        validator: (_, value) => {
            const cleanedValue = replaceHeaders(value, minHeaderLevel, maxHeaderLevel)

            if (cleanedValue !== value) {
                form.setFieldValue(fieldName, cleanedValue)
            }

            if (cleanedValue.length > maxLength) {
                return Promise.reject(message)
            }

            return Promise.resolve()
        },
    }), [fieldName, form, maxHeaderLevel, maxLength, message, minHeaderLevel])
}