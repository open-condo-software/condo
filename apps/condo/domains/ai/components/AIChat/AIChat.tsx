import { useApolloClient } from '@apollo/client'
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { v4 as uuidV4 } from 'uuid'

import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Tooltip } from '@open-condo/ui'

import { CHAT_WITH_CONDO_FLOW_TYPE, TASK_STATUSES } from '@condo/domains/ai/constants'
import { useAIChatAttachments, type AIChatAttachmentMeta } from '@condo/domains/ai/hooks/useAIChatAttachments'
import { useAIFlow } from '@condo/domains/ai/hooks/useAIFlow'
import { useChatWithCondoButtonConfig } from '@condo/domains/ai/hooks/useChatWithCondoButtonConfig'
import { analytics } from '@condo/domains/common/utils/analytics'
import { LocalStorageManager } from '@condo/domains/common/utils/localStorageManager'

import styles from './AIChat.module.css'
import { AIChatInput } from './AIChatInput'
import { AIChatMessage } from './AIChatMessage'

const STORAGE_KEY = 'condo-ai-chat-history'
const WELCOME_UI_MESSAGE_ID = 'welcome-ui-message'

const AI_FLOW_TIMEOUT_MS = 3 * 60 * 1000

const historyStorageManager = new LocalStorageManager<Record<string, { history: any[], organizationId: string }>>()

const SUGGESTIONS_BLOCK_REGEX = /\[\[SUGGESTIONS\]\]([\s\S]*?)\[\[\/SUGGESTIONS\]\]/m

type ParsedAssistantAnswer = {
    text: string
    suggestions: string[]
    suggestionsFailureReason?: 'missing_block' | 'empty_after_parse' | 'service_text_leaked'
}

function parseAssistantAnswer (answer: string): ParsedAssistantAnswer {
    if (!answer || typeof answer !== 'string') {
        return { text: '', suggestions: [], suggestionsFailureReason: 'missing_block' }
    }

    const match = answer.match(SUGGESTIONS_BLOCK_REGEX)
    if (!match) {
        const hasSuggestionMarkers = answer.includes('[[SUGGESTIONS') || answer.includes('[[/SUGGESTIONS')
        return {
            text: answer.trim(),
            suggestions: [],
            suggestionsFailureReason: hasSuggestionMarkers ? 'service_text_leaked' : 'missing_block',
        }
    }

    const suggestions = match[1]
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.startsWith('& '))
        .map((line) => line.slice(2).trim())
        .filter(Boolean)

    const textWithoutSuggestions = answer.replace(SUGGESTIONS_BLOCK_REGEX, '').trim()
    const hasLeakedServiceText = textWithoutSuggestions.includes('[[SUGGESTIONS') || textWithoutSuggestions.includes('[[/SUGGESTIONS')
    const parsedSuggestions = suggestions.slice(0, 3)

    return {
        text: textWithoutSuggestions,
        suggestions: parsedSuggestions,
        suggestionsFailureReason: hasLeakedServiceText
            ? 'service_text_leaked'
            : (parsedSuggestions.length === 0 ? 'empty_after_parse' : undefined),
    }
}

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
    additionalContext?: Record<string, unknown>
    messageId?: string | null
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

    const client = useApolloClient()

    const [inputValue, setInputValue] = useState('')
    const [messages, setMessages] = useState<Message[]>([])

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<any>(null)
    const inputContainerRef = useRef<HTMLDivElement>(null)
    const [inputContainerHeight, setInputContainerHeight] = useState(0)

    const [{ execute, resume }, { loading, currentTaskId }] = useAIFlow<{ answer: string }>({
        aiSessionId: aiSessionId,
        flowType: CHAT_WITH_CONDO_FLOW_TYPE,
        timeout: AI_FLOW_TIMEOUT_MS,
        defaultContext: {
            userTimezoneName: Intl.DateTimeFormat().resolvedOptions().timeZone,
            userTimezoneOffset: new Date().getTimezoneOffset(),
            currentUrl: typeof window !== 'undefined' ? window.location.href : null,
        },
    })

    // Load messages from localStorage when aiSessionId changes
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

        // Convert timestamp strings back to Date objects
        const historyWithDates = historyArray.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
        }))
        setMessages(historyWithDates)

        // Check for active task in the last message and resume if needed
        const lastMessage = historyWithDates[historyWithDates.length - 1]

        if (lastMessage?.status === 'sending' && lastMessage?.executionAIFlowTaskId) {
            resume(lastMessage.executionAIFlowTaskId)
        }
    }, [aiSessionId, resume])

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

    const removeMessage = useCallback((messageId: string) => {
        setMessages(prev => {
            return prev.filter(msg => msg.id !== messageId)
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

    // Update message with executionAIFlowTaskId when currentTaskId changes
    useEffect(() => {
        if (currentTaskId) {
            // Find the last assistant message with 'sending' status and update it with currentTaskId
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

    const scrollToBottom = useCallback(() => {
        const messagesContainer = messagesEndRef.current?.parentElement
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight
            messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
        }
    }, [])

    useEffect(() => {
        scrollToBottom()
    }, [messages, scrollToBottom])

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
        options: ExecuteAIMessageOptions = {},
    ) => {
        const {
            additionalContext,
            messageId = null,
            scenarioButtonId = null,
            attachments: attachmentsForRequest,
        } = options

        const assistantMessage: Message = {
            id: uuidV4(),
            content: { text: loadingLabel },
            role: 'assistant',
            timestamp: new Date(),
            status: 'sending',
        }

        if (!messageId) {
            addMessage(assistantMessage)
        } else {
            changeMessage(messageId, assistantMessage)
        }

        try {
            const result = await execute({
                userInput,
                userData: {
                    userId: user.id,
                    organizationId: organization?.id,
                    ...additionalContext,
                },
                ...(attachmentsForRequest?.length ? { attachments: attachmentsForRequest } : {}),
                ...(scenarioButtonId ? { button_id: scenarioButtonId } : {}),
            })

            // If no data returned or there's an error - show error and return
            if (!result.data || result.error) {
                changeMessage(assistantMessage.id, {
                    ...assistantMessage,
                    content: { text: result.localizedErrorText || failedToGetResponseMessage },
                    status: 'sent',
                })
                return
            }

            const { text: assistantAnswerText, suggestions, suggestionsFailureReason } = parseAssistantAnswer(result.data.result?.answer ?? noResponseMessage)
            if (suggestionsFailureReason) {
                void analytics.track('ai_suggestions_failure', {
                    reason: suggestionsFailureReason,
                    session_id: aiSessionId,
                    message_id: assistantMessage.id,
                    suggestions_count_parsed: suggestions.length,
                })
            }

            const isFinalAssistantReply = result.data?.status === TASK_STATUSES.COMPLETED

            // Show copy button only for final assistant replies, not intermediate statuses.
            changeMessage(assistantMessage.id, {
                ...assistantMessage,
                content: {
                    text: assistantAnswerText,
                    suggestions,
                },
                status: 'sent',
                copyable: isFinalAssistantReply,
            })
        } catch (error) {
            console.error('Error in executeAIMessage:', error)
            changeMessage(assistantMessage.id, {
                ...assistantMessage,
                content: { text: errorMessage },
                status: 'sent',
            })
        }
    }, [aiSessionId, currentTaskId, loadingLabel, errorMessage, failedToGetResponseMessage, organization, user, client, intl, addMessage, changeMessage, removeMessage, execute, noResponseMessage])

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

        addMessage(userMessage)

        setInputValue('')
        attachments?.resetAttachments()

        await executeAIMessage(trimmedInput, { attachments: attachmentsToSend })
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

        addMessage(userMessage)
        await executeAIMessage(buttonName, { scenarioButtonId: buttonId })
    }, [loading, user, canExecuteAIFlow, messages, addMessage, executeAIMessage])

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

        addMessage(userMessage)
        await executeAIMessage(suggestedText)
    }, [loading, user, canExecuteAIFlow, messages, addMessage, executeAIMessage])

    const handleComposerKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key !== 'Enter' || e.shiftKey) return

        e.preventDefault()

        if (canSendMessage && canExecuteAIFlow) {
            void handleSendMessage()
        }
    }, [canExecuteAIFlow, canSendMessage, handleSendMessage])

    return (
        <div className={styles.chatContainer}>
            <div className={`${styles.messagesContainer} comment-body`}>
                <div className={styles.headerSpacer} />
                {welcomeDisplayMessage && (
                    <AIChatMessage
                        message={welcomeDisplayMessage}
                        canExecuteAIFlow={canExecuteAIFlow}
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
                    />
                ))}
                <div ref={messagesEndRef} />
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
