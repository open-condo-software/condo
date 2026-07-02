import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { v4 as uuidV4 } from 'uuid'

import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Tooltip } from '@open-condo/ui'

import { CHAT_WITH_CONDO_FLOW_TYPE, TASK_STATUSES } from '@condo/domains/ai/constants'
import { useAIChatAttachments, type AIChatAttachmentMeta } from '@condo/domains/ai/hooks/useAIChatAttachments'
import { useAIFlow } from '@condo/domains/ai/hooks/useAIFlow'
import { useChatWithCondoButtonConfig } from '@condo/domains/ai/hooks/useChatWithCondoButtonConfig'
import { useStreamReveal } from '@condo/domains/ai/hooks/useStreamReveal'
import {
    getStreamingDisplayText,
    parseAssistantAnswer,
    resolveAssistantAnswerRaw,
} from '@condo/domains/ai/utils/parseAssistantAnswer'
import { logAiStreaming } from '@condo/domains/ai/utils/aiStreamingDebug'
import { AI_STREAMING } from '@condo/domains/common/constants/featureflags'
import { analytics } from '@condo/domains/common/utils/analytics'
import { LocalStorageManager } from '@condo/domains/common/utils/localStorageManager'

import styles from './AIChat.module.css'
import { AIChatInput } from './AIChatInput'
import { AIChatMessage } from './AIChatMessage'

const STORAGE_KEY = 'condo-ai-chat-history'
const WELCOME_UI_MESSAGE_ID = 'welcome-ui-message'
const AI_FLOW_TIMEOUT_MS = 3 * 60 * 1000

const historyStorageManager = new LocalStorageManager<Record<string, { history: any[], organizationId: string }>>()

export type MessageAttachmentDisplay = {
    name: string
    mimeType?: string
    url?: string
}

export type MessageContent = {
    text: string
    suggestions?: string[]
    attachments?: MessageAttachmentDisplay[]
}

export type Message = {
    id: string
    content: MessageContent
    role: 'user' | 'assistant'
    timestamp: Date
    status?: 'sending' | 'sent' | 'error'
    executionAIFlowTaskId?: string
    copyable?: boolean
}

type ExecuteAIMessageOptions = {
    assistantMessage: Message
    scenarioButtonId?: string | null
    attachments?: AIChatAttachmentMeta[]
}

type AIChatProps = {
    aiSessionId: string
    onSessionChange?: (sessionId: string) => void
    onDownloadText?: (messages: Message[]) => void
}

export const AIChat: React.FC<AIChatProps> = ({
    aiSessionId,
}) => {
    const intl = useIntl()
    const loadingLabel = intl.formatMessage({ id: 'ai.chat.loading' })
    const welcomeMessage = intl.formatMessage({ id: 'ai.chat.welcome' })
    const errorMessage = intl.formatMessage({ id: 'ai.chat.error' })
    const failedToGetResponseMessage = intl.formatMessage({ id: 'ai.chat.failedToGetResponse' })
    const placeholder = intl.formatMessage({ id: 'ai.chat.placeholder' })
    const noResponseMessage = intl.formatMessage({ id: 'ai.chat.noResponse' })

    const { user } = useAuth()
    const { organization } = useOrganization()
    const { useFlagValue } = useFeatureFlags()
    const aiStreamingEnabled = Boolean(useFlagValue(AI_STREAMING)?.[CHAT_WITH_CONDO_FLOW_TYPE])

    const buttonConfig = useChatWithCondoButtonConfig()
    const scenarioButtons = buttonConfig?.buttons ?? []
    const welcomeDisplayMessage = useMemo<Message | null>(() => {
        const text = (buttonConfig?.welcomeMessage || welcomeMessage).trim()
        if (!text) {
            return null
        }
        return {
            id: WELCOME_UI_MESSAGE_ID,
            role: 'assistant',
            content: { text },
            timestamp: new Date(0),
            status: 'sent',
        }
    }, [buttonConfig?.welcomeMessage, welcomeMessage])

    const [inputValue, setInputValue] = useState('')
    const [messages, setMessages] = useState<Message[]>([])
    const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)

    const inputRef = useRef<any>(null)
    const inputContainerRef = useRef<HTMLDivElement>(null)
    const messagesContainerRef = useRef<HTMLDivElement>(null)
    const streamDataTextRef = useRef('')
    const streamLoggedFirstCharRef = useRef(false)
    const [inputContainerHeight, setInputContainerHeight] = useState(0)

    const [{ execute, resume }, { loading, currentTaskId, streamDataText }] = useAIFlow<{ answer: string }>({
        aiSessionId: aiSessionId,
        flowType: CHAT_WITH_CONDO_FLOW_TYPE,
        timeout: AI_FLOW_TIMEOUT_MS,
        defaultContext: {
            userTimezoneName: Intl.DateTimeFormat().resolvedOptions().timeZone,
            userTimezoneOffset: new Date().getTimezoneOffset(),
            currentUrl: typeof window !== 'undefined' ? window.location.href : null,
        },
    })

    streamDataTextRef.current = streamDataText

    const receivedStreamText = useMemo(
        () => getStreamingDisplayText(streamDataText),
        [streamDataText],
    )

    const isActiveStreamReveal = Boolean(aiStreamingEnabled && streamingMessageId)
    const displayStreamText = useStreamReveal(receivedStreamText, { enabled: isActiveStreamReveal })

    useEffect(() => {
        const savedHistory = historyStorageManager.getItem(STORAGE_KEY)

        if (!savedHistory || typeof savedHistory !== 'object') {
            setMessages([])
            return
        }

        const sessionData = savedHistory[aiSessionId]
        if (!sessionData || !sessionData.history) {
            setMessages([])
            return
        }

        const historyArray = sessionData.history

        if (historyArray.length === 0) {
            setMessages([])
            return
        }

        const historyWithDates = historyArray.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
        }))
        setMessages(historyWithDates)

        const lastMessage = historyWithDates[historyWithDates.length - 1]

        if (lastMessage?.status === 'sending' && lastMessage?.executionAIFlowTaskId) {
            const taskId = lastMessage.executionAIFlowTaskId
            const messageId = lastMessage.id

            if (aiStreamingEnabled) {
                setStreamingMessageId(messageId)
            }

            void resume(taskId).then((result) => {
                if (!result.data || result.error) {
                    setMessages((prev) => prev.map((msg) => {
                        if (msg.id !== messageId) {
                            return msg
                        }

                        return {
                            ...msg,
                            content: { text: result.localizedErrorText || failedToGetResponseMessage },
                            status: 'sent',
                        }
                    }))
                    setStreamingMessageId(null)
                    return
                }

                const rawAnswer = resolveAssistantAnswerRaw(
                    result.data.result,
                    streamDataTextRef.current,
                    noResponseMessage,
                )
                const { text, suggestions } = parseAssistantAnswer(rawAnswer)

                setMessages((prev) => prev.map((msg) => {
                    if (msg.id !== messageId) {
                        return msg
                    }

                    return {
                        ...msg,
                        content: { text, suggestions },
                        status: 'sent',
                        copyable: result.data?.status === TASK_STATUSES.COMPLETED,
                    }
                }))
                setStreamingMessageId(null)
            })
        }
    }, [aiSessionId, resume, aiStreamingEnabled, failedToGetResponseMessage, noResponseMessage])

    const canExecuteAIFlow = useMemo(() => {
        return !(currentTaskId && loading)
    }, [currentTaskId, loading])

    const attachments = useAIChatAttachments({
        onFileListChange: () => inputRef.current?.focus(),
    })
    const attachmentsUploading = attachments ? attachments.uploading : false
    const canSendWithAttachments = attachments ? attachments.canSendWithAttachments : false

    const canSendMessage = useMemo(() => {
        return Boolean(inputValue.trim() || canSendWithAttachments) && !attachmentsUploading
    }, [inputValue, canSendWithAttachments, attachmentsUploading])

    const addMessage = useCallback((newMessage: Message) => {
        setMessages(prev => {
            return [...prev, newMessage]
        })
    }, [])

    const changeMessage = useCallback((messageId: string, updatedMessage: Message) => {
        setMessages(prev => {
            return prev.map(msg => msg.id === messageId ? updatedMessage : msg)
        })
    }, [])

    const saveMessagesToLocalStorage = useCallback(() => {
        try {
            const currentHistory = historyStorageManager.getItem(STORAGE_KEY) || {}
            const updatedHistory = {
                ...currentHistory,
                [aiSessionId]: {
                    history: messages.map(msg => ({
                        ...msg,
                        timestamp: msg.timestamp.toISOString(),
                    })),
                    organizationId: organization?.id,
                },
            }
            historyStorageManager.setItem(STORAGE_KEY, updatedHistory)
        } catch (error) {
            console.error('Failed to save chat history to localStorage:', error)
        }
    }, [aiSessionId, messages, organization?.id])

    useEffect(() => {
        if (aiSessionId && messages.length >= 0) {
            saveMessagesToLocalStorage()
        }
    }, [aiSessionId, messages, saveMessagesToLocalStorage])

    useEffect(() => {
        if (currentTaskId) {
            setMessages(prev => {
                const updated = prev.map(msg => {
                    if (msg.role === 'assistant' && msg.status === 'sending' && !msg.executionAIFlowTaskId) {
                        return {
                            ...msg,
                            executionAIFlowTaskId: currentTaskId,
                        }
                    }
                    return msg
                })
                return updated
            })
        }
    }, [currentTaskId])

    const scrollMessageIntoView = useCallback((messageId: string) => {
        requestAnimationFrame(() => {
            const element = document.querySelector(`[data-chat-message-id="${messageId}"]`)
            element?.scrollIntoView({ block: 'start', behavior: 'smooth' })
        })
    }, [])

    useEffect(() => {
        if (!streamingMessageId || !aiStreamingEnabled || !displayStreamText) {
            return
        }

        if (!streamLoggedFirstCharRef.current) {
            streamLoggedFirstCharRef.current = true
            logAiStreaming('chat first visible char', {
                messageId: streamingMessageId,
                displayLength: displayStreamText.length,
                receivedLength: receivedStreamText.length,
            })
        }

        setMessages(prev => prev.map((msg) => {
            if (msg.id !== streamingMessageId || msg.status !== 'sending') {
                return msg
            }

            return {
                ...msg,
                content: {
                    ...msg.content,
                    text: displayStreamText,
                },
            }
        }))
    }, [displayStreamText, streamingMessageId, aiStreamingEnabled, receivedStreamText.length])

    useEffect(() => {
        setTimeout(() => {
            inputRef.current?.focus()
        }, 100)
    }, [])

    useEffect(() => {
        if (!inputContainerRef.current) return

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setInputContainerHeight(entry.contentRect.height)
            }
        })

        observer.observe(inputContainerRef.current)
        return () => observer.disconnect()
    }, [])

    const executeAIMessage = useCallback(async (
        userInput: string,
        options: ExecuteAIMessageOptions,
    ) => {
        const {
            assistantMessage,
            scenarioButtonId = null,
            attachments: attachmentsForRequest,
        } = options

        if (aiStreamingEnabled) {
            setStreamingMessageId(assistantMessage.id)
            streamLoggedFirstCharRef.current = false
            logAiStreaming('chat stream start', { messageId: assistantMessage.id })
        }

        try {
            const result = await execute({
                userInput,
                userData: {
                    userId: user.id,
                    organizationId: organization?.id,
                },
                ...(attachmentsForRequest?.length ? { attachments: attachmentsForRequest } : {}),
                ...(scenarioButtonId ? { button_id: scenarioButtonId } : {}),
            })

            const rawAnswer = resolveAssistantAnswerRaw(
                result.data?.result,
                streamDataTextRef.current,
                noResponseMessage,
            )

            if (!result.data || result.error) {
                changeMessage(assistantMessage.id, {
                    ...assistantMessage,
                    content: { text: result.localizedErrorText || failedToGetResponseMessage },
                    status: 'sent',
                })
                return
            }

            const { text: assistantAnswerText, suggestions, suggestionsFailureReason } = parseAssistantAnswer(rawAnswer)
            if (suggestionsFailureReason) {
                void analytics.track('ai_suggestions_failure', {
                    reason: suggestionsFailureReason,
                    session_id: aiSessionId,
                    message_id: assistantMessage.id,
                    suggestions_count_parsed: suggestions.length,
                })
            }

            const isFinalAssistantReply = result.data?.status === TASK_STATUSES.COMPLETED

            changeMessage(assistantMessage.id, {
                ...assistantMessage,
                content: {
                    text: assistantAnswerText,
                    suggestions,
                },
                status: 'sent',
                copyable: isFinalAssistantReply,
            })

            logAiStreaming('chat stream complete', {
                messageId: assistantMessage.id,
                answerLength: assistantAnswerText.length,
                suggestionsCount: suggestions.length,
            })
        } catch (error) {
            console.error('Error in executeAIMessage:', error)
            changeMessage(assistantMessage.id, {
                ...assistantMessage,
                content: { text: errorMessage },
                status: 'sent',
            })
        } finally {
            setStreamingMessageId(null)
        }
    }, [
        aiSessionId,
        aiStreamingEnabled,
        errorMessage,
        failedToGetResponseMessage,
        organization,
        user,
        changeMessage,
        execute,
        noResponseMessage,
    ])

    const sendExchange = useCallback(async (
        userMessage: Message,
        assistantMessage: Message,
        userInput: string,
        options: Omit<ExecuteAIMessageOptions, 'assistantMessage'> = {},
    ) => {
        addMessage(userMessage)
        addMessage(assistantMessage)
        scrollMessageIntoView(userMessage.id)
        await executeAIMessage(userInput, { assistantMessage, ...options })
    }, [addMessage, scrollMessageIntoView, executeAIMessage])

    const handleSendMessage = async () => {
        const trimmedInput = inputValue.trim()
        const canSend = (trimmedInput || canSendWithAttachments) && !loading && !attachmentsUploading && user
        if (!canSend) return

        const attachmentsToSend = attachments ? [...attachments.readyAttachments] : []
        const isFirstInSession = !messages.some((msg) => msg.role === 'user')
        void analytics.track('ai_assistant_message_send', {
            source: 'typed',
            is_first_in_session: isFirstInSession,
            location: typeof window !== 'undefined' ? window.location.href : '',
            attachments_count: attachmentsToSend.length,
        })

        const userMessage: Message = {
            id: Date.now().toString(),
            content: {
                text: trimmedInput,
                ...(attachmentsToSend.length ? {
                    attachments: attachmentsToSend.map(({ name, mimeType }) => ({ name, mimeType })),
                } : {}),
            },
            role: 'user',
            timestamp: new Date(),
            status: 'sent',
            copyable: true,
        }

        const assistantMessage: Message = {
            id: uuidV4(),
            content: { text: loadingLabel },
            role: 'assistant',
            timestamp: new Date(),
            status: 'sending',
        }

        setInputValue('')
        attachments?.resetAttachments()

        await sendExchange(userMessage, assistantMessage, trimmedInput, { attachments: attachmentsToSend })
    }

    const handleScenarioButtonClick = useCallback(async (buttonId: string, buttonName: string) => {
        if (!buttonName.trim() || loading || !user || !canExecuteAIFlow) return

        const isFirstInSession = !messages.some((msg) => msg.role === 'user')
        void analytics.track('ai_assistant_message_send', {
            source: 'scenario_button',
            is_first_in_session: isFirstInSession,
            location: typeof window !== 'undefined' ? window.location.href : '',
            attachments_count: 0,
            button_id: buttonId,
            button_name: buttonName,
        })

        const userMessage: Message = {
            id: Date.now().toString(),
            content: { text: buttonName },
            role: 'user',
            timestamp: new Date(),
            status: 'sent',
            copyable: true,
        }

        const assistantMessage: Message = {
            id: uuidV4(),
            content: { text: loadingLabel },
            role: 'assistant',
            timestamp: new Date(),
            status: 'sending',
        }

        await sendExchange(userMessage, assistantMessage, buttonName, { scenarioButtonId: buttonId })
    }, [loading, user, canExecuteAIFlow, messages, sendExchange, loadingLabel])

    const handleSuggestionButtonClick = useCallback(async (suggestedText: string) => {
        if (!suggestedText.trim() || loading || !user || !canExecuteAIFlow) return

        const isFirstInSession = !messages.some((msg) => msg.role === 'user')
        void analytics.track('ai_assistant_message_send', {
            source: 'suggestion',
            is_first_in_session: isFirstInSession,
            location: typeof window !== 'undefined' ? window.location.href : '',
            attachments_count: 0,
            button_name: suggestedText,
        })

        const userMessage: Message = {
            id: Date.now().toString(),
            content: { text: suggestedText },
            role: 'user',
            timestamp: new Date(),
            status: 'sent',
            copyable: true,
        }

        const assistantMessage: Message = {
            id: uuidV4(),
            content: { text: loadingLabel },
            role: 'assistant',
            timestamp: new Date(),
            status: 'sending',
        }

        await sendExchange(userMessage, assistantMessage, suggestedText)
    }, [loading, user, canExecuteAIFlow, messages, sendExchange, loadingLabel])

    const handleComposerKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key !== 'Enter' || e.shiftKey) return

        e.preventDefault()

        if (canSendMessage && canExecuteAIFlow) {
            void handleSendMessage()
        }
    }, [canExecuteAIFlow, canSendMessage, handleSendMessage])

    const isStreamingActive = Boolean(aiStreamingEnabled && streamingMessageId)

    return (
        <div className={styles.chatContainer}>
            <div
                ref={messagesContainerRef}
                className={`${styles.messagesContainer} comment-body`}
            >
                <div className={styles.headerSpacer} />
                {welcomeDisplayMessage && (
                    <AIChatMessage
                        message={welcomeDisplayMessage}
                        canExecuteAIFlow={canExecuteAIFlow}
                        loadingLabel={loadingLabel}
                    />
                )}
                {scenarioButtons.length > 0 && (
                    <div className={styles.assistantSuggestions}>
                        {scenarioButtons.map((btn) => {
                            const scenarioButton = (
                                <Button
                                    type='primary'
                                    size='medium'
                                    disabled={!canExecuteAIFlow}
                                    onClick={() => void handleScenarioButtonClick(btn.buttonId, btn.buttonName)}
                                >
                                    {btn.buttonName}
                                </Button>
                            )
                            return btn.buttonDescription ? (
                                <Tooltip
                                    key={btn.buttonId}
                                    title={btn.buttonDescription}
                                    getPopupContainer={(trigger) => trigger.parentElement || trigger}
                                >
                                    <span className={styles.scenarioButtonTooltipWrap}>
                                        {scenarioButton}
                                    </span>
                                </Tooltip>
                            ) : (
                                <React.Fragment key={btn.buttonId}>{scenarioButton}</React.Fragment>
                            )
                        })}
                    </div>
                )}
                {messages.map((message) => (
                    <AIChatMessage
                        key={message.id}
                        message={message}
                        onSuggestionClick={handleSuggestionButtonClick}
                        canExecuteAIFlow={canExecuteAIFlow}
                        isStreamingActive={aiStreamingEnabled && message.id === streamingMessageId && message.status === 'sending'}
                        loadingLabel={loadingLabel}
                    />
                ))}
                {isStreamingActive && (
                    <div className={styles.streamingViewportSpacer} aria-hidden />
                )}
                <div className={styles.inputSpacer} style={{ height: inputContainerHeight }} />
            </div>

            <AIChatInput
                containerRef={inputContainerRef}
                attachments={attachments}
                canExecuteAIFlow={canExecuteAIFlow}
                canSendMessage={canSendMessage}
                inputRef={inputRef}
                inputValue={inputValue}
                onInputChange={setInputValue}
                onInputKeyDown={handleComposerKeyDown}
                onSendMessage={() => void handleSendMessage()}
                placeholder={placeholder}
            />
        </div>
    )
}
