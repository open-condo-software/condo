import { useApolloClient } from '@apollo/client'
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { v4 as uuidV4 } from 'uuid'

import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Input, Typography, Space } from '@open-condo/ui'

import { CHAT_WITH_CONDO_FLOW_TYPE, TASK_STATUSES } from '@condo/domains/ai/constants'
import { useAIFlow } from '@condo/domains/ai/hooks/useAIFlow'
import { runToolCall, ToolCallResult } from '@condo/domains/ai/utils/toolCalls'
import { LocalStorageManager } from '@condo/domains/common/utils/localStorageManager'

import styles from './AIChat.module.css'
import { AIChatMessage } from './AIChatMessage'

const STORAGE_KEY_PREFIX = 'condo-ai-chat-history-'

// Tools that require user action or data from condo can be run recursively
// -- this setting clamps the maximum depth for these tool calls
const MAX_TOOL_CALL_DEPTH = 10
const AI_FLOW_TIMEOUT_MS = 3 * 60 * 1000

const historyStorageManager = new LocalStorageManager<Record<string, any[]>>()

export type MessageContent = {
    text: string
}

export type Message = {
    id: string
    content: MessageContent
    role: 'user' | 'assistant'
    timestamp: Date
    status?: 'sending' | 'sent' | 'error'
    executionAIFlowTaskId?: string
}

type AIChatProps = {
    aiSessionId: string | null
    onSessionChange?: (sessionId: string | null) => void
    onDownloadText?: (messages: Message[]) => void
}

export const AIChat: React.FC<AIChatProps> = ({ 
    aiSessionId,
}) => {
    const intl = useIntl()
    const { user } = useAuth()
    const { organization } = useOrganization()
    const client = useApolloClient()
    
    const [inputValue, setInputValue] = useState('')
    const [messages, setMessages] = useState<Message[]>([])
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<any>(null)

    const [activeTaskId, setActiveTaskId] = useState<string | null>(null)

    const [executeAIFlow, { loading, currentTaskId, cancelCurrentTask: cancelExecuteAIFlow }] = useAIFlow<{ answer: string, toolCalls?: Array<{ name: string, args: any }> }>({
        flowType: CHAT_WITH_CONDO_FLOW_TYPE,
        timeout: AI_FLOW_TIMEOUT_MS,
    })

    const [resumeAIFlow, { cancelCurrentTask: cancelResumeAIFlow }] = useAIFlow<{ answer: string, toolCalls?: Array<{ name: string, args: any }> }>({
        flowType: CHAT_WITH_CONDO_FLOW_TYPE,
        timeout: AI_FLOW_TIMEOUT_MS,
        taskId: activeTaskId || undefined,
    })

    const loadingLabel = intl.formatMessage({ id: 'ai.chat.loading' })
    const welcomeMessage = intl.formatMessage({ id: 'ai.chat.welcome' })
    const errorMessage = intl.formatMessage({ id: 'ai.chat.error' })
    const failedToGetResponseMessage = intl.formatMessage({ id: 'ai.chat.failedToGetResponse' })
    const placeholder = intl.formatMessage({ id: 'ai.chat.placeholder' })

    // Load messages from localStorage when aiSessionId changes
    useEffect(() => {
        if (typeof window === 'undefined' || !aiSessionId) {
            setMessages([])
            setActiveTaskId(null)
            // TODO: @toplenboren what to do if no session? Can there be no session?
            return
        }

        const savedHistory = historyStorageManager.getItem(STORAGE_KEY_PREFIX + aiSessionId)
        if (!savedHistory || typeof savedHistory !== 'object') {
            setMessages([])
            setActiveTaskId(null)
            return
        }

        const historyArray = savedHistory[aiSessionId] || []
        if (historyArray.length === 0) {
            setMessages([])
            setActiveTaskId(null)
            return
        }

        // Convert timestamp strings back to Date objects
        const historyWithDates = historyArray.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
        }))
        setMessages(historyWithDates)
        
        // Check for active task in the last message
        const lastMessage = historyWithDates[historyWithDates.length - 1]
        if (lastMessage?.status === 'sending' && lastMessage?.taskId) {
            setActiveTaskId(lastMessage.taskId)
        } else {
            setActiveTaskId(null)
        }
    }, [aiSessionId])

    // Sync activeTaskId with currentTaskId from useAIFlow
    useEffect(() => {
        if (currentTaskId && currentTaskId !== activeTaskId) {
            setActiveTaskId(currentTaskId)
        }
    }, [currentTaskId, activeTaskId])

    const addMessage = useCallback((newMessage: Message) => {
        setMessages(prev => {
            const updated = [...prev, newMessage]
            return updated
        })
    }, [])

    const changeMessage = useCallback((messageId: string, updatedMessage: Message) => {
        setMessages(prev => {
            const updated = prev.map(msg => msg.id === messageId ? updatedMessage : msg)
            return updated
        })
    }, [])

    const removeMessage = useCallback((messageId: string) => {
        setMessages(prev => {
            const updated = prev.filter(msg => msg.id !== messageId)
            return updated
        })
    }, [])

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

    // Cleanup when session is cleared
    useEffect(() => {
        if (!aiSessionId) {
            cancelExecuteAIFlow()
            cancelResumeAIFlow()
            setMessages([])
            setActiveTaskId(null)
        }
    }, [aiSessionId, cancelExecuteAIFlow, cancelResumeAIFlow])

    const executeAIMessage = useCallback(async (userInput: string, additionalContext?: any, toolCallDepth = 0) => {
        if (toolCallDepth >= MAX_TOOL_CALL_DEPTH) {
            addMessage({
                id: `depth-error-${Date.now()}`,
                role: 'assistant',
                content: { text: intl.formatMessage({ id: 'ai.chat.toolDepthExceeded' }) },
                status: 'sent',
                timestamp: new Date(),
            })
            return
        }
        
        // No active session - don't process
        if (!aiSessionId) return
        
        const assistantMessage: Message = {
            id: uuidV4(),
            content: { text: loadingLabel },
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
            
            // Update the message with the taskId if available
            if (currentTaskId) {
                changeMessage(assistantMessage.id, {
                    ...assistantMessage,
                    executionAIFlowTaskId: currentTaskId,
                })
            }
            
            if (!result.data) {
                changeMessage(assistantMessage.id, {
                    ...assistantMessage,
                    content: { text: failedToGetResponseMessage },
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
                    content: { text: result.data.result.answer ?? '' },
                    status: 'sent',
                })

                const toolCalls = result.data.result.toolCalls
                
                // Show thinking message while tools are executing
                const thinkingMessage: Message = {
                    id: `thinking-${Date.now()}`,
                    content: { text: intl.formatMessage({ id: 'ai.chat.executingTools' }) },
                    role: 'assistant',
                    timestamp: new Date(),
                    status: 'sending',
                }
                changeMessage(assistantMessage.id, thinkingMessage)

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
                    
                    // No active session - don't process results
                    if (!aiSessionId) return
                    
                    const resultsMessage = toolCallResults
                        .map(toolCall => toolCall.resultMessage || toolCall.errorMessage)
                        .filter(Boolean)
                        .join('\n')

                    if (resultsMessage) {
                        changeMessage(assistantMessage.id, {
                            ...assistantMessage,
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
                        await executeAIMessage(userInput, { toolCalls: allToolCallResults }, toolCallDepth + 1)
                    }
                } catch (error) {
                    removeMessage(thinkingMessage.id)
                    addMessage({
                        id: `tool-error-${Date.now()}`,
                        role: 'assistant',
                        content: { text: intl.formatMessage({ id: 'ai.chat.errorExecutingTools' }, { error: error instanceof Error ? error.message : 'Unknown error' }) },
                        status: 'sent',
                        timestamp: new Date(),
                    })
                    setActiveTaskId(null)
                }
            } else if (result.data?.status === TASK_STATUSES.COMPLETED) {
                changeMessage(assistantMessage.id, {
                    ...assistantMessage,
                    content: { text: result.data.result.answer || intl.formatMessage({ id: 'ai.chat.noResponse' }) },
                    status: 'sent',
                })
                setActiveTaskId(null)
            }
        } catch (error) {
            console.error('Error in executeAIMessage:', error)
            changeMessage(assistantMessage.id, {
                ...assistantMessage,
                content: { text: errorMessage },
                status: 'sent',
            })
            setActiveTaskId(null)
        }
    }, [aiSessionId, activeTaskId, currentTaskId, loadingLabel, errorMessage, failedToGetResponseMessage, organization, user, client, intl, addMessage, changeMessage, removeMessage, executeAIFlow, resumeAIFlow])

    const handleSendMessage = async () => {
        if (!inputValue.trim() || loading || !user) return

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

        await executeAIMessage(currentInput)
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
                    disabled={loading}
                    autoSize={{ minRows: 1, maxRows: 4 }}
                />
            </div>
        </div>  
    )
}
