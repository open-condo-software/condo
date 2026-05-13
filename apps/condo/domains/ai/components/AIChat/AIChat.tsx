import { useApolloClient } from '@apollo/client'
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { v4 as uuidV4 } from 'uuid'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Input, Markdown, Space, Tooltip, Typography } from '@open-condo/ui'

import { CHAT_WITH_CONDO_FLOW_TYPE, TASK_STATUSES } from '@condo/domains/ai/constants'
import { useAIFlow } from '@condo/domains/ai/hooks/useAIFlow'
import { runToolCall, ToolCallResult } from '@condo/domains/ai/utils/toolCalls'
import { AI_CHAT_BUTTON_CONFIG } from '@condo/domains/common/constants/featureflags'
import { analytics } from '@condo/domains/common/utils/analytics'
import { LocalStorageManager } from '@condo/domains/common/utils/localStorageManager'

import styles from './AIChat.module.css'
import { AIChatMessage } from './AIChatMessage'

const STORAGE_KEY = 'condo-ai-chat-history'

// Tools that require user action or data from condo can be run recursively
// -- this setting clamps the maximum depth for these tool calls
const MAX_TOOL_CALL_DEPTH = 10
const AI_FLOW_TIMEOUT_MS = 3 * 60 * 1000

const historyStorageManager = new LocalStorageManager<Record<string, { history: any[], organizationId: string }>>()

type AiChatScenarioButton = {
    button_id: string
    button_name: string
    button_description: string
}

type AiChatButtonConfig = {
    welcomeMessage: string
    buttons: AiChatScenarioButton[]
}

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

function parseAiChatButtonConfigFromFlag (raw: unknown): AiChatButtonConfig | null {
    let value = raw
    if (typeof raw === 'string') {
        try {
            value = JSON.parse(raw)
        } catch {
            return null
        }
    }
    if (!value || typeof value !== 'object') {
        return null
    }
    const obj = value as Record<string, unknown>
    const welcomeMessage = typeof obj.welcome_message === 'string' ? obj.welcome_message.trim() : ''

    const buttonsRaw = Array.isArray(obj.buttons) ? obj.buttons : []
    const buttons: AiChatScenarioButton[] = buttonsRaw
        .map((item: unknown) => {
            const row = item as Record<string, unknown>
            const buttonId = row?.button_id !== undefined && row?.button_id !== null
                ? String(row.button_id).trim()
                : ''
            const buttonName = typeof row?.button_name === 'string' ? row.button_name.trim() : ''
            const buttonDescription = typeof row?.button_description === 'string' ? row.button_description.trim() : ''
            return { button_id: buttonId, button_name: buttonName, button_description: buttonDescription }
        })
        .filter((b) => b.button_id && b.button_name)

    if (!welcomeMessage && buttons.length === 0) {
        return null
    }
    return { welcomeMessage, buttons }
}

export type MessageContent = {
    text: string
    suggestions?: string[]
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
    const toolDepthExceededMessage = intl.formatMessage({ id: 'ai.chat.toolDepthExceeded' })
    const noResponseMessage = intl.formatMessage({ id: 'ai.chat.noResponse' })
    const executingToolsMessage = intl.formatMessage({ id: 'ai.chat.executingTools' })
    const errorExecutingToolsMessage = intl.formatMessage({ id: 'ai.chat.errorExecutingTools' })

    const { user } = useAuth()
    const { organization } = useOrganization()
    const { useFlagValue } = useFeatureFlags()
    const chatButtonConfigRaw = useFlagValue<Record<string, unknown>>(AI_CHAT_BUTTON_CONFIG)
    const chatButtonConfig = useMemo(
        () => parseAiChatButtonConfigFromFlag(chatButtonConfigRaw),
        [chatButtonConfigRaw],
    )

    const client = useApolloClient()

    const [inputValue, setInputValue] = useState('')
    const [messages, setMessages] = useState<Message[]>([])

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<any>(null)

    const [{ execute, resume }, { loading, currentTaskId }] = useAIFlow<{ answer: string, toolCalls?: Array<{ name: string, args: any }> }>({
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

    const executeAIMessage = useCallback(async (
        userInput: string,
        additionalContext?: any,
        toolCallDepth = 0,
        messageId: string | null = null,
        scenarioButtonId?: string | null,
    ) => {
        if (toolCallDepth >= MAX_TOOL_CALL_DEPTH) {
            addMessage({
                id: `depth-error-${Date.now()}`,
                role: 'assistant',
                content: { text: toolDepthExceededMessage },
                status: 'sent',
                timestamp: new Date(),
            })
            return
        }

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
            const hasToolCalls = Boolean(result.data?.result?.toolCalls?.length)
            const isFinalAssistantReply = result.data?.status === TASK_STATUSES.COMPLETED && !hasToolCalls

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

            // If had toolcalls -> add message about toolcalls and start executing toolcalls
            if (result.data?.status === TASK_STATUSES.COMPLETED && hasToolCalls) {
                const toolCalls = result.data.result.toolCalls

                // Create new message for tool execution
                const toolExecutionMessage: Message = {
                    id: `tool-execution-${Date.now()}`,
                    content: { text: executingToolsMessage },
                    role: 'assistant',
                    timestamp: new Date(),
                    status: 'sending',
                }
                addMessage(toolExecutionMessage)

                try {
                    if (!organization?.id || !user?.id) {
                        throw new Error('Organization or user not available')
                    }

                    const userData = {
                        organizationId: organization.id,
                        userId: user.id,
                    }

                    const toolCallPromises = toolCalls.map((toolCall: any) =>
                        runToolCall(
                            toolCall.name,
                            toolCall.args,
                            userData,
                            client,
                            intl
                        )
                    )

                    const toolCallResults: ToolCallResult[] = await Promise.all(toolCallPromises)

                    const resultsMessage = toolCallResults
                        .map(toolCall => toolCall.resultMessage || toolCall.errorMessage)
                        .filter(Boolean)
                        .join('\n')

                    if (resultsMessage) {
                        changeMessage(toolExecutionMessage.id, {
                            ...toolExecutionMessage,
                            content: { text: resultsMessage },
                            status: 'sent',
                            timestamp: new Date(),
                        })
                    }

                    // Continue the conversation with the additional data
                    const allToolCallResults = toolCallResults.map(toolCall => (
                        {
                            name: toolCall.name,
                            args: toolCall.args,
                            result: toolCall.result,
                        }))

                    if (allToolCallResults.length > 0) {
                        await executeAIMessage('toolCalls:', { toolCalls: allToolCallResults }, toolCallDepth + 1, toolExecutionMessage.id)
                    }
                } catch (error) {
                    changeMessage(toolExecutionMessage.id, {
                        id: `tool-error-${Date.now()}`,
                        role: 'assistant',
                        content: { text: errorExecutingToolsMessage },
                        status: 'sent',
                        timestamp: new Date(),
                    })
                }
            }
        } catch (error) {
            console.error('Error in executeAIMessage:', error)
            changeMessage(assistantMessage.id, {
                ...assistantMessage,
                content: { text: errorMessage },
                status: 'sent',
            })
        }
    }, [aiSessionId, currentTaskId, loadingLabel, errorMessage, failedToGetResponseMessage, organization, user, client, intl, addMessage, changeMessage, removeMessage, execute, toolDepthExceededMessage, noResponseMessage, executingToolsMessage, errorExecutingToolsMessage])

    const handleSendMessage = async () => {
        if (!inputValue.trim() || loading || !user) return

        const isFirstInSession = !messages.some((msg) => msg.role === 'user')
        void analytics.track('ai_assistant_message_send', {
            source: 'typed',
            is_first_in_session: isFirstInSession,
            location: typeof window !== 'undefined' ? window.location.href : '',
        })

        const userMessage: Message = {
            id: Date.now().toString(),
            content: { text: inputValue.trim() },
            role: 'user',
            timestamp: new Date(),
            status: 'sent',
            copyable: true,
        }

        addMessage(userMessage)

        const currentInput = inputValue.trim()
        setInputValue('')

        await executeAIMessage(currentInput)
    }

    const handleScenarioButtonClick = useCallback(async (buttonId: string, buttonName: string) => {
        if (!buttonName.trim() || loading || !user || !canExecuteAIFlow) return

        const isFirstInSession = !messages.some((msg) => msg.role === 'user')
        void analytics.track('ai_assistant_message_send', {
            source: 'scenario_button',
            is_first_in_session: isFirstInSession,
            location: typeof window !== 'undefined' ? window.location.href : '',
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
        await executeAIMessage(buttonName, undefined, 0, null, buttonId)
    }, [loading, user, canExecuteAIFlow, messages, addMessage, executeAIMessage])

    const handleSuggestionButtonClick = useCallback(async (suggestedText: string) => {
        if (!suggestedText.trim() || loading || !user || !canExecuteAIFlow) return

        const isFirstInSession = !messages.some((msg) => msg.role === 'user')
        void analytics.track('ai_assistant_message_send', {
            source: 'suggestion',
            is_first_in_session: isFirstInSession,
            location: typeof window !== 'undefined' ? window.location.href : '',
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

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    return (
        <div className={styles.chatContainer}>
            <div className={`${styles.messagesContainer} comment-body`}>
                {messages.length === 0 ? (
                    chatButtonConfig ? (
                        <div className={`${styles.welcomeMessage} ${styles.welcomeMessageConfigured} empty-container`}>
                            <Space direction='vertical' size={16} align='start'>
                                <div className={`${styles.messageWrapper} ${styles.assistantMessage}`}>
                                    <div className={styles.assistantMessageContainer}>
                                        {chatButtonConfig.welcomeMessage ? (
                                            <div className={styles.assistantMarkdown}>
                                                <Markdown type='inline'>{chatButtonConfig.welcomeMessage}</Markdown>
                                            </div>
                                        ) : (
                                            <Typography.Text type='secondary'>{welcomeMessage}</Typography.Text>
                                        )}
                                    </div>
                                </div>
                                {chatButtonConfig.buttons.length > 0 && (
                                    <Space wrap size={8}>
                                        {chatButtonConfig.buttons.map((btn) => {
                                            const scenarioButton = (
                                                <Button
                                                    type='secondary'
                                                    size='medium'
                                                    disabled={!canExecuteAIFlow}
                                                    onClick={() => void handleScenarioButtonClick(btn.button_id, btn.button_name)}
                                                >
                                                    {btn.button_name}
                                                </Button>
                                            )
                                            return btn.button_description ? (
                                                <Tooltip key={btn.button_id} title={btn.button_description}>
                                                    <span className={styles.scenarioButtonTooltipWrap}>
                                                        {scenarioButton}
                                                    </span>
                                                </Tooltip>
                                            ) : (
                                                <React.Fragment key={btn.button_id}>{scenarioButton}</React.Fragment>
                                            )
                                        })}
                                    </Space>
                                )}
                            </Space>
                        </div>
                    ) : (
                        <div className={`${styles.welcomeMessage} ${styles.welcomeMessageLegacy} empty-container`}>
                            <Space direction='vertical' align='center' size={16}>
                                <Typography.Text type='secondary'>
                                    {welcomeMessage}
                                </Typography.Text>
                            </Space>
                        </div>
                    )
                ) : (
                    messages.map((message) => (
                        <AIChatMessage
                            key={message.id}
                            message={message}
                            onSuggestionClick={handleSuggestionButtonClick}
                            canExecuteAIFlow={canExecuteAIFlow}
                        />
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className={styles.inputContainer}>
                <Input.TextArea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    onSubmit={() => handleSendMessage()}
                    placeholder={placeholder}
                    disabled={!canExecuteAIFlow}
                    autoSize={{ minRows: 1, maxRows: 4 }}
                />
            </div>
        </div>
    )
}
