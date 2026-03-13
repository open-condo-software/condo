import { useApolloClient } from '@apollo/client'
import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { v4 as uuidV4 } from 'uuid'

import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Input, Typography, Space } from '@open-condo/ui'
import { Markdown } from '@open-condo/ui'

import { CHAT_WITH_CONDO_FLOW_TYPE, TASK_STATUSES } from '@condo/domains/ai/constants'
import { useAIFlow } from '@condo/domains/ai/hooks/useAIFlow'
import { runToolCall, ToolCallResult } from '@condo/domains/ai/utils/toolCalls'
import { LocalStorageManager } from '@condo/domains/common/utils/localStorageManager'

import styles from './AIChat.module.css'

const STORAGE_KEY = 'condo-ai-chat-history'
const SESSION_KEY = 'condo-ai-assistant-session-id'

// Tools that require user action or data from condo can be run recursively
// -- this setting clamps the maximum depth for these tool calls
const MAX_TOOL_CALL_DEPTH = 5
const AI_FLOW_TIMEOUT_MS = 180000

const historyStorageManager = new LocalStorageManager<Record<string, any[]>>()
const sessionStorageManager = new LocalStorageManager<string>()

export type Message = {
    id: string
    content: string
    role: 'user' | 'assistant'
    timestamp: Date
    status?: 'sending' | 'sent' | 'error'
    taskId?: string
    actionRequest?: {
        type: string
        meta: any
        data?: any
    }
}

type AIChatProps = {
    onClose?: () => void
}

export type AIChatRef = {
    handleResetHistory: () => void
    handleSaveConversation: () => void
    checkForActiveTask: () => void
    scrollToBottom: () => void
}

export const AIChat = forwardRef<AIChatRef, AIChatProps>(({ onClose }, ref) => {
    const intl = useIntl()
    const { user } = useAuth()
    const { organization } = useOrganization()
    const client = useApolloClient()
    
    const [inputValue, setInputValue] = useState('')
    // Get or create persistent session ID from localStorage
    const [aiSessionId, setAiSessionId] = useState(() => {
        if (typeof window === 'undefined') return uuidV4()
        
        let sessionId = sessionStorageManager.getItem(SESSION_KEY)
        
        if (!sessionId) {
            sessionId = uuidV4()
            sessionStorageManager.setItem(SESSION_KEY, sessionId)
        }
        
        return sessionId
    })
    const [messages, setMessages] = useState<Message[]>([])
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<any>(null)

    const [activeTaskId, setActiveTaskId] = useState<string | null>(null)

    const [executeAIFlow, { loading, currentTaskId }] = useAIFlow<{ answer: string, toolCalls?: Array<{ name: string, args: any }> }>({
        flowType: CHAT_WITH_CONDO_FLOW_TYPE,
        timeout: AI_FLOW_TIMEOUT_MS,
    })

    const [resumeAIFlow] = useAIFlow<{ answer: string, toolCalls?: Array<{ name: string, args: any }> }>({
        flowType: CHAT_WITH_CONDO_FLOW_TYPE,
        timeout: AI_FLOW_TIMEOUT_MS,
        taskId: activeTaskId || undefined,
    })

    const placeholder = intl.formatMessage({ id: 'ai.chat.placeholder' })
    const loadingLabel = intl.formatMessage({ id: 'ai.chat.loading' })
    const welcomeMessage = intl.formatMessage({ id: 'ai.chat.welcome' })
    const errorMessage = intl.formatMessage({ id: 'ai.chat.error' })
    const failedToGetResponseMessage = intl.formatMessage({ id: 'ai.chat.failedToGetResponse' })

    // Load chat history from local storage on component mount
    // Right now chat history is stored like this:
    // aiSessionId = some uuid
    // STORAGE_KEY: { <aiSessionId>: [ ... ] }
    // Only last conversation is stored, this is by design.
    // Multiple chat conversations should be stored server side
    // Todo: @toplenboren (DOMA-13019) add server side ai conversation storage
    useEffect(() => {
        if (typeof window === 'undefined') return
        
        let savedHistory = historyStorageManager.getItem(STORAGE_KEY)
        let historyArray: any[] = []
        
        if (savedHistory && !Array.isArray(savedHistory) && typeof savedHistory === 'object') {
            historyArray = savedHistory[aiSessionId] || []
        }
        
        if (historyArray.length > 0) {
            // Convert timestamp strings back to Date objects
            const historyWithDates = historyArray.map(msg => ({
                ...msg,
                timestamp: new Date(msg.timestamp),
            }))
            setMessages(historyWithDates)
            
            // Check for active task in the last message
            const lastMessage = historyWithDates[historyWithDates.length - 1]
            if (lastMessage?.status === 'sending' && lastMessage?.taskId) {
                setActiveTaskId(lastMessage.taskId)
            }
        }
    }, [])

    // Sync activeTaskId with currentTaskId from useAIFlow
    useEffect(() => {
        if (currentTaskId && currentTaskId !== activeTaskId) {
            setActiveTaskId(currentTaskId)
        }
    }, [currentTaskId, activeTaskId])

    const addMessage = (newMessage: Message) => {
        setMessages(prev => {
            const updated = [...prev, newMessage]
            if (typeof window !== 'undefined') {
                historyStorageManager.setItem(STORAGE_KEY, { [aiSessionId]: updated })
            }
            return updated
        })
    }

    const changeMessage = (messageId: string, updatedMessage: Message) => {
        setMessages(prev => {
            const updated = prev.map(msg => msg.id === messageId ? updatedMessage : msg)
            if (typeof window !== 'undefined') {
                historyStorageManager.setItem(STORAGE_KEY, { [aiSessionId]: updated })
            }
            return updated
        })
    }

    const removeMessage = (messageId: string) => {
        setMessages(prev => {
            const updated = prev.filter(msg => msg.id !== messageId)
            if (typeof window !== 'undefined') {
                historyStorageManager.setItem(STORAGE_KEY, { [aiSessionId]: updated })
            }
            return updated
        })
    }

    const scrollToBottom = () => {
        const messagesContainer = messagesEndRef.current?.parentElement
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight
            messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
        }
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    useEffect(() => {
        setTimeout(() => {
            inputRef.current?.focus()
        }, 100)
    }, [])

    useImperativeHandle(ref, () => ({
        handleResetHistory,
        handleSaveConversation,
        checkForActiveTask,
        scrollToBottom,
    }))

    const checkForActiveTask = () => {
        setMessages(prev => {
            const hasActiveTask = prev.some(msg => msg.status === 'sending')
            if (hasActiveTask) {
                return prev.map(msg => 
                    msg.status === 'sending' 
                        ? { ...msg, content: loadingLabel }
                        : msg
                )
            }
            return prev
        })
    }

    const executeAIMessage = async (userInput: string, additionalContext?: any, toolCallDepth = 0) => {
        if (toolCallDepth >= MAX_TOOL_CALL_DEPTH) {
            addMessage({
                id: `depth-error-${Date.now()}`,
                role: 'assistant',
                content: intl.formatMessage({ id: 'ai.chat.toolDepthExceeded' }),
                status: 'sent',
                timestamp: new Date(),
            })
            return
        }
        const assistantMessage: Message = {
            id: uuidV4(),
            content: loadingLabel,
            role: 'assistant',
            timestamp: new Date(),
            status: 'sending',
        }
        
        addMessage(assistantMessage)

        try {
            // Use resumeAIFlow if we have an activeTaskId (page refresh case), otherwise create new task
            const result = await (activeTaskId ? resumeAIFlow : executeAIFlow)({
                context: {
                    userInput,
                    userData: {
                        userId: user.id,
                        organizationId: organization?.id,
                        ...additionalContext,
                    },
                    aiSessionId,
                },
            })
            
            // Clear activeTaskId after resuming
            if (activeTaskId) {
                setActiveTaskId(null)
            }
            
            // Update the message with the taskId if available
            if (currentTaskId) {
                changeMessage(assistantMessage.id, {
                    ...assistantMessage,
                    taskId: currentTaskId,
                })
            }
            
            if (!result.data) {
                changeMessage(assistantMessage.id, {
                    ...assistantMessage,
                    content: failedToGetResponseMessage,
                    status: 'sent',
                })
                return
            }

            // If we have any toolCalls -- we need to do this:
            // 1. Execute any known tools that are requested
            // 2. Create new ExecutionAIFlowTask with toolCalls result
            if (result.data?.status === TASK_STATUSES.COMPLETED && result.data?.result?.toolCalls) {
                // Thinking... -> result.data.answer 
                changeMessage(assistantMessage.id, {
                    ...assistantMessage,
                    content: result.data.result.answer ?? '',
                    status: 'sent',
                })

                const toolCalls = result.data.result.toolCalls
                
                // Show thinking message while tools are executing
                const thinkingMessage: Message = {
                    id: `thinking-${Date.now()}`,
                    content: intl.formatMessage({ id: 'ai.chat.executingTools' }),
                    role: 'assistant',
                    timestamp: new Date(),
                    status: 'sending',
                }
                addMessage(thinkingMessage)

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
                    
                    removeMessage(thinkingMessage.id)
                    
                    const resultsMessage = toolCallResults
                        .map(toolCall => toolCall.resultMessage || toolCall.errorMessage)
                        .filter(Boolean)
                        .join('\n')

                    if (resultsMessage) {
                        addMessage({
                            id: `results-${Date.now()}`,
                            role: 'assistant',
                            content: resultsMessage,
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
                        await executeAIMessage(userInput, { toolCalls: allToolCallResults }, toolCallDepth + 1)
                    }
                } catch (error) {
                    removeMessage(thinkingMessage.id)
                    addMessage({
                        id: `tool-error-${Date.now()}`,
                        role: 'assistant',
                        content: intl.formatMessage({ id: 'ai.chat.errorExecutingTools' }, { error: error instanceof Error ? error.message : 'Unknown error' }),
                        status: 'sent',
                        timestamp: new Date(),
                    })
                    setActiveTaskId(null)
                }
            } else if (result.data?.status === TASK_STATUSES.COMPLETED) {
                changeMessage(assistantMessage.id, {
                    ...assistantMessage,
                    content: result.data.result.answer || intl.formatMessage({ id: 'ai.chat.noResponse' }),
                    status: 'sent',
                })
                setActiveTaskId(null)
            }
        } catch (error) {
            console.error('Error in executeAIMessage:', error)
            changeMessage(assistantMessage.id, {
                ...assistantMessage,
                content: errorMessage,
                status: 'sent',
            })
            setActiveTaskId(null)
        }
    }

    const handleSendMessage = async () => {
        if (!inputValue.trim() || loading || !user) return

        const userMessage: Message = {
            id: Date.now().toString(),
            content: inputValue.trim(),
            role: 'user',
            timestamp: new Date(),
            status: 'sent',
        }

        addMessage(userMessage)
        
        const currentInput = inputValue.trim()
        setInputValue('')

        await executeAIMessage(currentInput)
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    const handleResetHistory = () => {
        if (typeof window !== 'undefined') {
            historyStorageManager.setItem(STORAGE_KEY, { [aiSessionId]: [] })
            localStorage.removeItem(SESSION_KEY)
        }
        
        const newSessionId = uuidV4()
        setAiSessionId(newSessionId)
        
        if (typeof window !== 'undefined') {
            sessionStorageManager.setItem(SESSION_KEY, newSessionId)
        }
        
        setMessages([])
        
        // Clear active AI task when resetting
        setActiveTaskId(null)
        
        // Focus input after reset
        setTimeout(() => {
            inputRef.current?.focus()
        }, 100)
    }

    const handleSaveConversation = () => {
        if (messages.length === 0) return
        
        // Create conversation text
        const conversationText = messages.map(msg => {
            const timestamp = msg.timestamp.toLocaleString()
            const role = msg.role === 'user' ? 'User' : 'Assistant'
            return `[${timestamp}] ${role}:\n${msg.content}\n`
        }).join('\n---\n\n')
        
        // Create blob and download
        const blob = new Blob([conversationText], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `ai-assistant-${new Date().toISOString().split('T')[0]}.txt`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
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
                        <div key={message.id} className={`${styles.messageWrapper} ${message.role === 'user' ? styles.userMessage : styles.assistantMessage}`}>
                            {message.role === 'user' ? (
                                <div className={styles.userMessageContainer}>
                                    <div className={styles.userMessageBubble}>
                                        <Typography.Text>{message.content}</Typography.Text>
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.assistantMessageContainer}>
                                    <Markdown type='inline'>{message.content}</Markdown>
                                </div>
                            )}
                        </div>
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
                    disabled={loading}
                    autoSize={{ minRows: 1, maxRows: 4 }}
                />
            </div>
        </div>  
    )
})
