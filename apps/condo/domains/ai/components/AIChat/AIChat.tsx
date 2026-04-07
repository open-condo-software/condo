import { useApolloClient } from '@apollo/client'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { v4 as uuidV4 } from 'uuid'

import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Input, Space, Typography } from '@open-condo/ui'

import { CHAT_WITH_CONDO_FLOW_TYPE, TASK_STATUSES } from '@condo/domains/ai/constants'
import { useAIFlow } from '@condo/domains/ai/hooks/useAIFlow'
import { useAIFlowStream } from '@condo/domains/ai/hooks/useAIFlowStream'
import { runToolCall } from '@condo/domains/ai/utils/toolCalls'
import { LocalStorageManager } from '@condo/domains/common/utils/localStorageManager'

import styles from './AIChat.module.css'
import { AIChatMessage } from './AIChatMessage'

const STORAGE_KEY = 'condo-ai-chat-history'

const AI_FLOW_TIMEOUT_MS = 3 * 60 * 1000

const historyStorageManager = new LocalStorageManager<Record<string, { history: any[], organizationId: string }>>()

export type Message = {
    id: string
    content: {
        text: string
    }
    role: 'user' | 'assistant'
    timestamp: Date
    status?: 'sending' | 'sent' | 'error'
    stage?: 'router' | 'summary'
    executionAIFlowTaskId?: string
    userInput?: string
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
    const dataFetchingMessage = intl.formatMessage({ id: 'ai.chat.dataFetching' })

    const { user } = useAuth()
    const { organization } = useOrganization()
    const client = useApolloClient()

    const [inputValue, setInputValue] = useState('')
    const [messages, setMessages] = useState<Message[]>([])
    const [isInputLocked, setIsInputLocked] = useState(false)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<any>(null)
    const currentSummaryMessageIdRef = useRef<string | null>(null)
    const resumedTaskIdRef = useRef<string | null>(null)

    const [{ execute: executeRouterFlow, resume: resumeRouterFlow }, { loading: routerLoading, currentTaskId: routerTaskId }] = useAIFlow<{ answer: string, toolCalls?: Array<{ name: string, args: any }> }>({
        aiSessionId,
        flowType: CHAT_WITH_CONDO_FLOW_TYPE,
        flowStage: 'router',
        timeout: AI_FLOW_TIMEOUT_MS,
        defaultContext: {
            userTimezoneName: Intl.DateTimeFormat().resolvedOptions().timeZone,
            userTimezoneOffset: new Date().getTimezoneOffset(),
            currentUrl: typeof window !== 'undefined' ? window.location.href : null,
        },
    })
    const [{ resume: resumeSummaryFlow }] = useAIFlow<{ answer: string }>({
        aiSessionId,
        flowType: CHAT_WITH_CONDO_FLOW_TYPE,
        flowStage: 'summary',
        timeout: AI_FLOW_TIMEOUT_MS,
    })

    const [executeSummaryFlowStream, { loading: summaryLoading, currentTaskId: summaryTaskId }] = useAIFlowStream<{ answer: string }>({
        flowType: CHAT_WITH_CONDO_FLOW_TYPE,
        flowStage: 'summary',
        timeout: AI_FLOW_TIMEOUT_MS,
        onChunk: (message) => {
            const messageId = currentSummaryMessageIdRef.current
            if (!messageId) return

            if (message.type === 'flow_start') {
                setMessages(prev => prev.map((msg) => msg.id === messageId ? { ...msg, content: { text: '' } } : msg))
                return
            }

            if (message.type === 'flow_item' && message.item) {
                setMessages(prev => prev.map((msg) => msg.id === messageId ? { ...msg, content: { text: `${msg.content.text}${message.item}` } } : msg))
                return
            }

            if (message.type === 'flow_end' || message.type === 'task_end' || message.type === 'task_complete') {
                setMessages(prev => prev.map((msg) => msg.id === messageId ? { ...msg, status: 'sent' } : msg))
                setIsInputLocked(false)
                currentSummaryMessageIdRef.current = null
                return
            }

            if (message.type === 'flow_error' || message.type === 'task_error') {
                setMessages(prev => prev.map((msg) => msg.id === messageId ? { ...msg, content: { text: errorMessage }, status: 'error' } : msg))
                setIsInputLocked(false)
                currentSummaryMessageIdRef.current = null
            }
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
        const historyWithDates = historyArray.map((msg: any) => {
            const text = typeof msg.content === 'string' ? msg.content : msg?.content?.text
            return {
                ...msg,
                content: { text: text || '' },
                timestamp: new Date(msg.timestamp),
            }
        })
        setMessages(historyWithDates)

        const lastMessage = historyWithDates[historyWithDates.length - 1]
        if (lastMessage?.status === 'sending' && lastMessage?.executionAIFlowTaskId) {
            setIsInputLocked(true)
        } else {
            setIsInputLocked(false)
        }
    }, [aiSessionId])

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

    useEffect(() => {
        if (!routerTaskId) return
        setMessages(prev => {
            return prev.map((msg) => {
                if (msg.role === 'assistant' && msg.status === 'sending' && msg.stage === 'router' && !msg.executionAIFlowTaskId) {
                    return { ...msg, executionAIFlowTaskId: routerTaskId }
                }
                return msg
            })
        })
    }, [routerTaskId])

    useEffect(() => {
        if (!summaryTaskId) return
        setMessages(prev => {
            return prev.map((msg) => {
                if (msg.id === currentSummaryMessageIdRef.current && !msg.executionAIFlowTaskId) {
                    return { ...msg, executionAIFlowTaskId: summaryTaskId }
                }
                return msg
            })
        })
    }, [summaryTaskId])

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

    const executeSummaryStage = useCallback(async (userInput: string, toolCalls: Array<{ name: string, args: any, result: any }>) => {
        const assistantMessage: Message = {
            id: uuidV4(),
            content: { text: loadingLabel },
            role: 'assistant',
            timestamp: new Date(),
            status: 'sending',
            stage: 'summary',
            userInput,
        }
        addMessage(assistantMessage)
        currentSummaryMessageIdRef.current = assistantMessage.id

        try {
            const streamResult = await executeSummaryFlowStream({
                context: {
                    userInput,
                    userData: {
                        userId: user.id,
                        organizationId: organization?.id,
                        toolCalls,
                    },
                    aiSessionId,
                },
            })

            if (streamResult?.error) {
                changeMessage(assistantMessage.id, {
                    ...assistantMessage,
                    content: { text: errorMessage },
                    status: 'error',
                })
                setIsInputLocked(false)
                currentSummaryMessageIdRef.current = null
            }

        } catch (error) {
            console.error('Error in executeAIMessage:', error)
            changeMessage(assistantMessage.id, {
                ...assistantMessage,
                content: { text: errorMessage },
                status: 'error',
            })
            setIsInputLocked(false)
            currentSummaryMessageIdRef.current = null
        }
    }, [aiSessionId, loadingLabel, errorMessage, organization?.id, user?.id, addMessage, changeMessage, executeSummaryFlowStream])

    const processRouterResult = useCallback(async (
        assistantMessage: Message,
        userInput: string,
        routerResult: { answer?: string, toolCalls?: Array<{ name: string, args: any }> }
    ) => {
        const answer = routerResult?.answer?.trim() || ''
        const toolCalls = Array.isArray(routerResult?.toolCalls) ? routerResult.toolCalls : []

        if (!answer && toolCalls.length === 0) {
            changeMessage(assistantMessage.id, {
                ...assistantMessage,
                content: { text: failedToGetResponseMessage },
                status: 'error',
            })
            setIsInputLocked(false)
            return
        }

        const routerMessageText = answer || dataFetchingMessage
        changeMessage(assistantMessage.id, {
            ...assistantMessage,
            content: { text: routerMessageText },
            status: 'sent',
        })

        if (toolCalls.length === 0) {
            setIsInputLocked(false)
            return
        }

        if (!organization?.id || !user?.id) {
            changeMessage(assistantMessage.id, {
                ...assistantMessage,
                content: { text: errorMessage },
                status: 'error',
            })
            setIsInputLocked(false)
            return
        }

        const toolCallResults = await Promise.all(toolCalls.map((toolCall) => runToolCall(
            toolCall.name,
            toolCall.args,
            {
                organizationId: organization.id,
                userId: user.id,
            },
            client,
            intl
        )))

        const successfulToolCalls = toolCallResults
            .filter((toolResult) => !toolResult.error)
            .map((toolResult) => ({
                name: toolResult.name,
                args: toolResult.args,
                result: toolResult.result,
            }))

        await executeSummaryStage(userInput, successfulToolCalls)
    }, [
        failedToGetResponseMessage,
        dataFetchingMessage,
        organization?.id,
        user?.id,
        errorMessage,
        changeMessage,
        client,
        intl,
        executeSummaryStage,
    ])

    const executeRouterStage = useCallback(async (userInput: string, assistantMessageId?: string) => {
        const assistantMessage: Message = {
            id: assistantMessageId || uuidV4(),
            content: { text: loadingLabel },
            role: 'assistant',
            timestamp: new Date(),
            status: 'sending',
            stage: 'router',
            userInput,
        }

        if (assistantMessageId) {
            changeMessage(assistantMessageId, assistantMessage)
        } else {
            addMessage(assistantMessage)
        }

        const result = await executeRouterFlow({
            userInput,
            userData: {
                userId: user.id,
                organizationId: organization?.id,
            },
            aiSessionId,
        })

        if (!result?.data || result?.error) {
            changeMessage(assistantMessage.id, {
                ...assistantMessage,
                content: { text: result?.localizedErrorText || failedToGetResponseMessage },
                status: 'error',
            })
            setIsInputLocked(false)
            return
        }

        await processRouterResult(assistantMessage, userInput, result.data.result || {})
    }, [
        aiSessionId,
        loadingLabel,
        failedToGetResponseMessage,
        addMessage,
        changeMessage,
        executeRouterFlow,
        processRouterResult,
    ])

    useEffect(() => {
        const resumeLastMessageIfNeeded = async () => {
            const lastMessage = messages[messages.length - 1]
            if (!lastMessage || lastMessage.status !== 'sending' || !lastMessage.executionAIFlowTaskId) return
            if (resumedTaskIdRef.current === lastMessage.executionAIFlowTaskId) return
            resumedTaskIdRef.current = lastMessage.executionAIFlowTaskId

            if (lastMessage.stage === 'router' && lastMessage.userInput) {
                const resumedResult = await resumeRouterFlow(lastMessage.executionAIFlowTaskId)
                if (resumedResult?.data?.status === TASK_STATUSES.COMPLETED) {
                    await processRouterResult(lastMessage, lastMessage.userInput, resumedResult?.data?.result || {})
                    return
                }
                changeMessage(lastMessage.id, {
                    ...lastMessage,
                    content: { text: resumedResult?.localizedErrorText || errorMessage },
                    status: 'error',
                })
                setIsInputLocked(false)
                return
            }

            if (lastMessage.stage === 'summary') {
                const resumedResult = await resumeSummaryFlow(lastMessage.executionAIFlowTaskId)
                if (resumedResult?.data?.status === TASK_STATUSES.COMPLETED) {
                    changeMessage(lastMessage.id, {
                        ...lastMessage,
                        content: { text: resumedResult?.data?.result?.answer || noResponseMessage },
                        status: 'sent',
                    })
                } else {
                    changeMessage(lastMessage.id, {
                        ...lastMessage,
                        content: { text: resumedResult?.localizedErrorText || errorMessage },
                        status: 'error',
                    })
                }
                setIsInputLocked(false)
            }
        }

        resumeLastMessageIfNeeded()
    }, [messages, processRouterResult, resumeRouterFlow, resumeSummaryFlow, changeMessage, errorMessage, noResponseMessage])

    const handleSendMessage = async () => {
        if (!inputValue.trim() || !user || isInputLocked) return

        const userMessage: Message = {
            id: Date.now().toString(),
            content: { text: inputValue.trim() },
            role: 'user',
            timestamp: new Date(),
            status: 'sent',
        }

        addMessage(userMessage)

        const currentInput = inputValue.trim()
        setInputValue('')
        setIsInputLocked(true)

        await executeRouterStage(currentInput)
    }

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
                    <div className={`${styles.welcomeMessage} empty-container`}>
                        <Space direction='vertical' align='center' size={16}>
                            <Typography.Text type='secondary'>
                                {welcomeMessage}
                            </Typography.Text>
                        </Space>
                    </div>
                ) : (
                    messages.map((message) => (
                        <AIChatMessage key={message.id} message={message} />
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
                    disabled={isInputLocked || routerLoading || summaryLoading}
                    autoSize={{ minRows: 1, maxRows: 4 }}
                />
            </div>
        </div>
    )
}
