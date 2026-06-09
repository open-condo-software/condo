import { useMemo } from 'react'
import { z } from 'zod'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'

import {
    CHAT_WITH_CONDO_ALLOWED_FILE_EXTENSIONS,
    CHAT_WITH_CONDO_ALLOWED_MIME_TYPES,
    CHAT_WITH_CONDO_MAX_ATTACHMENT_SIZE_BYTES,
    CHAT_WITH_CONDO_MAX_ATTACHMENTS,
} from '@condo/domains/ai/constants'
import { CHAT_WITH_CONDO_ATTACHMENTS_CONFIG } from '@condo/domains/common/constants/featureflags'

export type ChatWithCondoAttachmentsConfig = {
    mimeTypes: string[]
    extensions: string
    maxAttachments: number
    maxFileSizeBytes: number
    maxFileSizeMb: number
}

const MB = 1024 * 1024
const DEFAULT_CONFIG: ChatWithCondoAttachmentsConfig = {
    mimeTypes: [...CHAT_WITH_CONDO_ALLOWED_MIME_TYPES],
    extensions: CHAT_WITH_CONDO_ALLOWED_FILE_EXTENSIONS,
    maxAttachments: CHAT_WITH_CONDO_MAX_ATTACHMENTS,
    maxFileSizeBytes: CHAT_WITH_CONDO_MAX_ATTACHMENT_SIZE_BYTES,
    maxFileSizeMb: Math.round(CHAT_WITH_CONDO_MAX_ATTACHMENT_SIZE_BYTES / MB),
}

const AttachmentsFlagObjectSchema = z.preprocess((raw) => {
    if (typeof raw !== 'string') return raw

    try {
        return JSON.parse(raw)
    } catch {
        return null
    }
}, z.record(z.string(), z.unknown()))

export function useChatWithCondoAttachmentsConfig (): ChatWithCondoAttachmentsConfig | null {
    const { useFlagValue } = useFeatureFlags()
    const raw = useFlagValue<unknown>(CHAT_WITH_CONDO_ATTACHMENTS_CONFIG)

    return useMemo(() => {
        if (raw === null || raw === undefined || raw === false) return null

        const objectResult = AttachmentsFlagObjectSchema.safeParse(raw)
        if (!objectResult.success) return null

        const value = objectResult.data
        const mimeTypesRaw = z.array(z.string()).safeParse(value.mimeTypes)
        const mimeTypes = mimeTypesRaw.success
            ? mimeTypesRaw.data
                .map((item) => item.replace(/\s/g, '').split(';')[0].toLowerCase())
                .filter(Boolean)
            : []
        const extensions = z.string().trim().min(1).safeParse(value.extensions)
        const maxAttachments = z.coerce.number().int().positive().safeParse(value.maxAttachments)
        const maxFileSizeBytesFromFlag = z.coerce.number().int().positive().safeParse(value.maxFileSizeBytes)
        const maxFileSizeMbFromFlag = z.coerce.number().positive().safeParse(value.maxFileSizeMb)
        const maxFileSizeInMbFromFlag = z.coerce.number().positive().safeParse(value.maxFileSizeInMb)

        let maxFileSizeMb = DEFAULT_CONFIG.maxFileSizeMb
        if (maxFileSizeBytesFromFlag.success) {
            maxFileSizeMb = Math.max(1, Math.round(maxFileSizeBytesFromFlag.data / MB))
        } else if (maxFileSizeMbFromFlag.success) {
            maxFileSizeMb = Math.max(1, Math.round(maxFileSizeMbFromFlag.data))
        } else if (maxFileSizeInMbFromFlag.success) {
            maxFileSizeMb = Math.max(1, Math.round(maxFileSizeInMbFromFlag.data))
        }

        return {
            mimeTypes: mimeTypes.length > 0 ? mimeTypes : DEFAULT_CONFIG.mimeTypes,
            extensions: extensions.success ? extensions.data : DEFAULT_CONFIG.extensions,
            maxAttachments: maxAttachments.success ? maxAttachments.data : DEFAULT_CONFIG.maxAttachments,
            maxFileSizeBytes: maxFileSizeBytesFromFlag.success ? maxFileSizeBytesFromFlag.data : maxFileSizeMb * MB,
            maxFileSizeMb,
        }
    }, [raw])
}
