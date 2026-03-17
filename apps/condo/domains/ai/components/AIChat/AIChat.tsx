import { useApolloClient } from '@apollo/client'
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { v4 as uuidV4 } from 'uuid'

import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Input, Space, Typography } from '@open-condo/ui'

import { CHAT_WITH_CONDO_FLOW_TYPE, TASK_STATUSES } from '@condo/domains/ai/constants'
import { useAIFlow } from '@condo/domains/ai/hooks/useAIFlow'
import { runToolCall, ToolCallResult } from '@condo/domains/ai/utils/toolCalls'
import { LocalStorageManager } from '@condo/domains/common/utils/localStorageManager'

import styles from './AIChat.module.css'
import { AIChatMessage } from './AIChatMessage'

const STORAGE_KEY = 'condo-ai-chat-history'

// Tools that require user action or data from condo can be run recursively
// -- this setting clamps the maximum depth for these tool calls
const MAX_TOOL_CALL_DEPTH = 10
const AI_FLOW_TIMEOUT_MS = 3 * 60 * 1000

const historyStorageManager = new LocalStorageManager<Record<string, { history: any[], organizationId: string }>>()

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
    
    const client = useApolloClient()
    
    const [inputValue, setInputValue] = useState('')
    const [messages, setMessages] = useState<Message[]>([])
    
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<any>(null)

    const [{ execute, resume }, { loading, currentTaskId }] = useAIFlow<{ answer: string, toolCalls?: Array<{ name: string, args: any }> }>({
        aiSessionId: aiSessionId,
        flowType: CHAT_WITH_CONDO_FLOW_TYPE,
        timeout: AI_FLOW_TIMEOUT_MS,
    })

    // Load messages from localStorage when aiSessionId changes
    useEffect(() => {
        console.log('🔄 AIChat: Loading messages for session:', aiSessionId)
        const savedHistory = historyStorageManager.getItem(STORAGE_KEY)
        console.log('📚 Saved history:', savedHistory)
        
        if (!savedHistory || typeof savedHistory !== 'object') {
            console.log('❌ No valid history found')
            setMessages([])
            return
        }

        const sessionData = savedHistory[aiSessionId]
        if (!sessionData || !sessionData.history) {
            console.log('📭 No session data or empty history for session')
            setMessages([])
            return
        }

        console.log('📝 Session data:', sessionData)
        const historyArray = sessionData.history
        
        if (historyArray.length === 0) {
            console.log('📭 Empty history for session')
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
        console.log('🔍 Last message:', lastMessage)
        
        if (lastMessage?.status === 'sending' && lastMessage?.executionAIFlowTaskId) {
            console.log('🚀 Found active task, resuming:', lastMessage.executionAIFlowTaskId)
            resume(lastMessage.executionAIFlowTaskId)
        } else {
            console.log('✅ No active task to resume')
        }
    }, [aiSessionId, resume])

    const canExecuteAIFlow = useMemo(() => {
        console.log('🔒 canExecuteAIFlow check:', { currentTaskId, loading })
        return !(currentTaskId && loading)
    }, [currentTaskId, loading])

    const addMessage = useCallback((newMessage: Message) => {
        console.log('addMessage', newMessage)
        setMessages(prev => {
            return [...prev, newMessage]
        })
    }, [])

    const changeMessage = useCallback((messageId: string, updatedMessage: Message) => {
        console.log('changeMessage', messageId, updatedMessage)
        setMessages(prev => {
            return prev.map(msg => msg.id === messageId ? updatedMessage : msg)
        })
    }, [])

    const removeMessage = useCallback((messageId: string) => {
        console.log('removeMessage', messageId)
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
            console.log('💾 Updating latest sending message with task ID:', currentTaskId)
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

    const executeAIMessage = useCallback(async (userInput: string, additionalContext?: any, toolCallDepth = 0, messageId = null) => {
        console.log('🤖 executeAIMessage called:', { userInput, additionalContext, toolCallDepth, messageId })

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
            console.log('📤 Calling execute with context:', { userInput, userData: { userId: user.id, organizationId: organization?.id, ...additionalContext } })
            const result = await execute({ userInput, userData: {
                userId: user.id,
                organizationId: organization?.id,
                ...additionalContext,
            }})
            
            // If no data returned or there's an error - show error and return
            if (!result.data || result.error) {
                changeMessage(assistantMessage.id, {
                    ...assistantMessage,
                    content: { text: result.localizedErrorText || failedToGetResponseMessage },
                    status: 'sent',
                })
                return
            }
            
            // Data is received - show answer
            changeMessage(assistantMessage.id, {
                ...assistantMessage,
                content: { text: result.data.result?.answer ?? noResponseMessage },
                status: 'sent',
            })

            // If had toolcalls -> add message about toolcalls and start executing toolcalls
            if (result.data?.status === TASK_STATUSES.COMPLETED && result.data?.result?.toolCalls) {
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
                        await executeAIMessage('toolCalls:', { toolCalls: allToolCallResults }, toolCallDepth + 1, messageId = toolExecutionMessage.id)
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
    }, [aiSessionId, currentTaskId, loadingLabel, errorMessage, failedToGetResponseMessage, organization, user, client, intl, addMessage, changeMessage, removeMessage, execute])

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
                    disabled={!canExecuteAIFlow}
                    autoSize={{ minRows: 1, maxRows: 4 }}
                />
            </div>
        </div>  
    )
}
