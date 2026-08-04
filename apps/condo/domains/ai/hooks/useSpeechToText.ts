import getConfig from 'next/config'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { buildMeta, upload as uploadFiles } from '@open-condo/files'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import {
    EXECUTION_AI_FLOW_TASK_FILE_MODEL_NAME,
    FLOW_TYPES,
    SPEECH_TO_TEXT_MAX_ATTACHMENT_SIZE_BYTES,
} from '@condo/domains/ai/constants'
import { useAIFlow } from '@condo/domains/ai/hooks/useAIFlow'
import {
    convertAudioBlobToWav,
    SPEECH_TO_TEXT_UPLOAD_EXTENSION,
    SPEECH_TO_TEXT_UPLOAD_MIME_TYPE,
} from '@condo/domains/ai/utils/convertAudioBlobToWav'

const { publicRuntimeConfig: { fileClientId } } = getConfig()

const SPEECH_TO_TEXT_TIMEOUT_MS = 60 * 1000
const PREFERRED_AUDIO_MIME_TYPES = [
    'audio/webm',
    'audio/mp4',
    'audio/ogg',
    'audio/wav',
]

export type SpeechToTextStatus = 'idle' | 'recording' | 'processing' | 'unsupported'

export type UseSpeechToTextResult = {
    status: SpeechToTextStatus
    isSupported: boolean
    isBusy: boolean
    errorMessage: string | null
    mediaStream: MediaStream | null
    tooltipTitle: string
    toggleRecording: () => Promise<void>
    clearError: () => void
}

type UseSpeechToTextOptions = {
    enabled?: boolean
    onTranscript: (text: string) => void
}

function pickSupportedMimeType (): string | null {
    if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
        return null
    }

    for (const mimeType of PREFERRED_AUDIO_MIME_TYPES) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
            return mimeType
        }
        // Some browsers require codecs in the type string
        if (mimeType === 'audio/webm' && MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            return 'audio/webm;codecs=opus'
        }
        if (mimeType === 'audio/mp4' && MediaRecorder.isTypeSupported('audio/mp4;codecs=mp4a.40.2')) {
            return 'audio/mp4;codecs=mp4a.40.2'
        }
    }

    return null
}

function normalizeMimeType (mimeType: string): string {
    return mimeType.split(';')[0].trim().toLowerCase()
}

export function useSpeechToText ({
    enabled = true,
    onTranscript,
}: UseSpeechToTextOptions): UseSpeechToTextResult {
    const intl = useIntl()
    const { user } = useAuth()
    const { organization } = useOrganization()

    const startTooltip = intl.formatMessage({ id: 'ai.chat.speechToText.tooltip.start' })
    const stopTooltip = intl.formatMessage({ id: 'ai.chat.speechToText.tooltip.stop' })
    const unsupportedTooltip = intl.formatMessage({ id: 'ai.chat.speechToText.tooltip.unsupported' })
    const permissionDeniedMessage = intl.formatMessage({ id: 'ai.chat.speechToText.error.permissionDenied' })
    const recognitionFailedMessage = intl.formatMessage({ id: 'ai.chat.speechToText.error.recognitionFailed' })
    const uploadFailedMessage = intl.formatMessage({ id: 'ai.chat.speechToText.error.uploadFailed' })
    const fileTooBigMessage = intl.formatMessage(
        { id: 'component.uploadlist.error.FileTooBig' },
        { maxSizeInMb: Math.floor(SPEECH_TO_TEXT_MAX_ATTACHMENT_SIZE_BYTES / (1024 * 1024)) },
    )

    const isSupported = useMemo(() => {
        if (typeof window === 'undefined') return false
        return Boolean(
            navigator.mediaDevices?.getUserMedia
            && typeof MediaRecorder !== 'undefined'
            && pickSupportedMimeType(),
        )
    }, [])

    const [status, setStatus] = useState<SpeechToTextStatus>(isSupported ? 'idle' : 'unsupported')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const mediaStreamRef = useRef<MediaStream | null>(null)
    const chunksRef = useRef<BlobPart[]>([])
    const mimeTypeRef = useRef<string | null>(null)
    const onTranscriptRef = useRef(onTranscript)
    onTranscriptRef.current = onTranscript

    const [{ execute }, { loading: flowLoading }] = useAIFlow<{ answer: string }>({
        flowType: FLOW_TYPES.SPEECH_TO_TEXT,
        timeout: SPEECH_TO_TEXT_TIMEOUT_MS,
    })

    const clearError = useCallback(() => {
        setErrorMessage(null)
    }, [])

    const stopMediaTracks = useCallback(() => {
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
        mediaStreamRef.current = null
        mediaRecorderRef.current = null
        chunksRef.current = []
        setMediaStream(null)
    }, [])

    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                try {
                    mediaRecorderRef.current.stop()
                } catch {
                    // ignore stop errors on unmount
                }
            }
            stopMediaTracks()
        }
    }, [stopMediaTracks])

    const processRecording = useCallback(async (blob: Blob) => {
        setStatus('processing')
        setErrorMessage(null)

        try {
            if (!user?.id || !fileClientId) {
                throw new Error(uploadFailedMessage)
            }

            if (blob.size > SPEECH_TO_TEXT_MAX_ATTACHMENT_SIZE_BYTES) {
                throw new Error(fileTooBigMessage)
            }

            let wavBlob: Blob
            try {
                wavBlob = await convertAudioBlobToWav(blob)
            } catch {
                throw new Error(recognitionFailedMessage)
            }

            if (wavBlob.size > SPEECH_TO_TEXT_MAX_ATTACHMENT_SIZE_BYTES) {
                throw new Error(fileTooBigMessage)
            }

            const file = new File(
                [wavBlob],
                `speech-to-text.${SPEECH_TO_TEXT_UPLOAD_EXTENSION}`,
                { type: SPEECH_TO_TEXT_UPLOAD_MIME_TYPE },
            )
            const senderInfo = getClientSideSenderInfo()

            const uploadResult = await uploadFiles({
                files: [file],
                meta: buildMeta({
                    userId: user.id,
                    fileClientId,
                    modelNames: [EXECUTION_AI_FLOW_TASK_FILE_MODEL_NAME],
                    fingerprint: senderInfo.fingerprint,
                    organizationId: organization?.id,
                }),
            })

            const uploaded = uploadResult.files[0]
            if (!uploaded?.id) {
                throw new Error(uploadFailedMessage)
            }

            const result = await execute({
                attachments: [{
                    id: uploaded.id,
                    name: file.name,
                    mimeType: SPEECH_TO_TEXT_UPLOAD_MIME_TYPE,
                    size: file.size,
                }],
            })

            const answer = result.data?.result?.answer?.trim()
            if (result.error || !answer) {
                throw new Error(result.localizedErrorText || recognitionFailedMessage)
            }

            onTranscriptRef.current(answer)
            setStatus('idle')
        } catch (error) {
            const message = error instanceof Error && error.message
                ? error.message
                : recognitionFailedMessage
            setErrorMessage(message)
            setStatus('idle')
        }
    }, [
        execute,
        fileTooBigMessage,
        organization?.id,
        recognitionFailedMessage,
        uploadFailedMessage,
        user?.id,
    ])

    const startRecording = useCallback(async () => {
        setErrorMessage(null)

        const mimeType = pickSupportedMimeType()
        if (!mimeType || !navigator.mediaDevices?.getUserMedia) {
            setStatus('unsupported')
            setErrorMessage(unsupportedTooltip)
            return
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            mediaStreamRef.current = stream
            setMediaStream(stream)
            chunksRef.current = []
            mimeTypeRef.current = mimeType

            const recorder = new MediaRecorder(stream, { mimeType })
            mediaRecorderRef.current = recorder

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data)
                }
            }

            recorder.onstop = () => {
                const recordedMimeType = mimeTypeRef.current || mimeType
                const blob = new Blob(chunksRef.current, { type: normalizeMimeType(recordedMimeType) })
                stopMediaTracks()

                if (blob.size === 0) {
                    setErrorMessage(recognitionFailedMessage)
                    setStatus('idle')
                    return
                }

                void processRecording(blob)
            }

            recorder.start()
            setStatus('recording')
        } catch {
            stopMediaTracks()
            setErrorMessage(permissionDeniedMessage)
            setStatus('idle')
        }
    }, [
        permissionDeniedMessage,
        processRecording,
        recognitionFailedMessage,
        stopMediaTracks,
        unsupportedTooltip,
    ])

    const stopRecording = useCallback(() => {
        const recorder = mediaRecorderRef.current
        if (!recorder || recorder.state === 'inactive') {
            stopMediaTracks()
            setStatus('idle')
            return
        }

        setStatus('processing')
        recorder.stop()
    }, [stopMediaTracks])

    const toggleRecording = useCallback(async () => {
        if (!enabled || !isSupported || status === 'processing' || flowLoading) {
            return
        }

        if (status === 'recording') {
            stopRecording()
            return
        }

        await startRecording()
    }, [enabled, flowLoading, isSupported, startRecording, status, stopRecording])

    const effectiveStatus: SpeechToTextStatus = !isSupported
        ? 'unsupported'
        : (status === 'processing' || flowLoading)
            ? 'processing'
            : status

    const tooltipTitle = useMemo(() => {
        if (errorMessage) return errorMessage
        if (effectiveStatus === 'unsupported') return unsupportedTooltip
        if (effectiveStatus === 'recording') return stopTooltip
        return startTooltip
    }, [
        effectiveStatus,
        errorMessage,
        startTooltip,
        stopTooltip,
        unsupportedTooltip,
    ])

    return {
        status: effectiveStatus,
        isSupported,
        isBusy: effectiveStatus === 'processing' || effectiveStatus === 'recording',
        errorMessage,
        mediaStream,
        tooltipTitle,
        toggleRecording,
        clearError,
    }
}
