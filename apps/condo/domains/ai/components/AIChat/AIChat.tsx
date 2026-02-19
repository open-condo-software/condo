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
const storageManager = new LocalStorageManager<Record<string, any[]>>()

export type Message = {
    id: string
    content: string
    role: 'user' | 'assistant'
    timestamp: Date
    status?: 'sending' | 'sent' | 'error' | 'action_requested'
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
}

export const AIChat = forwardRef<AIChatRef, AIChatProps>(({ onClose }, ref) => {
    const intl = useIntl()
    const { user } = useAuth()
    const { organization } = useOrganization()
    const client = useApolloClient()
    
    const [inputValue, setInputValue] = useState('')
    const [aiSessionId, setAiSessionId] = useState(uuidV4())
    const [messages, setMessages] = useState<Message[]>([])
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<any>(null)

    const [executeAIFlow, { loading }] = useAIFlow<{ answer: string }>({
        flowType: CHAT_WITH_CONDO_FLOW_TYPE,
        timeout: 120000,
    })

    const placeholder = intl.formatMessage({ id: 'ai.chat.placeholder' })
    const loadingLabel = intl.formatMessage({ id: 'ai.chat.loading' })
    const welcomeMessage = intl.formatMessage({ id: 'ai.chat.welcome' })
    const errorMessage = intl.formatMessage({ id: 'ai.chat.error' })
    const failedToGetResponseMessage = intl.formatMessage({ id: 'ai.chat.failedToGetResponse' })

    // Load chat history from local storage on component mount
    useEffect(() => {
        if (typeof window === 'undefined') return
        
        const history = storageManager.getItem(STORAGE_KEY)
        const savedHistory = history?.[aiSessionId] || []
        
        if (savedHistory.length > 0) {
            // Convert timestamp strings back to Date objects
            const historyWithDates = savedHistory.map(msg => ({
                ...msg,
                timestamp: new Date(msg.timestamp),
            }))
            setMessages(historyWithDates)
        }
    }, [aiSessionId])

    const addMessage = (newMessage: Message) => {
        setMessages(prev => {
            const updated = [...prev, newMessage]
            // Save to local storage
            if (typeof window !== 'undefined') {
                const history = storageManager.getItem(STORAGE_KEY) || {}
                history[aiSessionId] = updated
                storageManager.setItem(STORAGE_KEY, history)
            }
            return updated
        })
    }

    const changeMessage = (messageId: string, updatedMessage: Message) => {
        setMessages(prev => {
            const updated = prev.map(msg => msg.id === messageId ? updatedMessage : msg)
            // Save to local storage
            if (typeof window !== 'undefined') {
                const history = storageManager.getItem(STORAGE_KEY) || {}
                history[aiSessionId] = updated
                storageManager.setItem(STORAGE_KEY, history)
            }
            return updated
        })
    }

    const removeMessage = (messageId: string) => {
        setMessages(prev => {
            const updated = prev.filter(msg => msg.id !== messageId)
            // Save to local storage
            if (typeof window !== 'undefined') {
                const history = storageManager.getItem(STORAGE_KEY) || {}
                history[aiSessionId] = updated
                storageManager.setItem(STORAGE_KEY, history)
            }
            return updated
        })
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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
    }))

    const MAX_TOOL_CALL_DEPTH = 5

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
            const result = await executeAIFlow({
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
                    content: (result.data.result.answer),
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
                    const userData = {
                        organizationId: organization?.id,
                        userId: user?.id,
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
                    
                    // Remove thinking message
                    removeMessage(thinkingMessage.id)
                    
                    // Compile results message
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
                    // Remove thinking message and show error
                    removeMessage(thinkingMessage.id)
                    addMessage({
                        id: `tool-error-${Date.now()}`,
                        role: 'assistant',
                        content: intl.formatMessage({ id: 'ai.chat.errorExecutingTools' }, { error: error instanceof Error ? error.message : 'Unknown error' }),
                        status: 'sent',
                        timestamp: new Date(),
                    })
                }
            } else if (result.data?.status === TASK_STATUSES.COMPLETED) {
                changeMessage(assistantMessage.id, {
                    ...assistantMessage,
                    content: result.data.result.answer || intl.formatMessage({ id: 'ai.chat.noResponse' }),
                    status: 'sent',
                })
            }
        } catch (error) {
            console.error('Error in executeAIMessage:', error)
            changeMessage(assistantMessage.id, {
                ...assistantMessage,
                content: errorMessage,
                status: 'sent',
            })
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
        // Clear current session from local storage
        if (typeof window !== 'undefined') {
            const history = storageManager.getItem(STORAGE_KEY)
            if (history) {
                delete history[aiSessionId]
                storageManager.setItem(STORAGE_KEY, history)
            }
        }
        
        // Generate new session ID and clear messages
        const newSessionId = uuidV4()
        setAiSessionId(newSessionId)
        setMessages([])
        
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
        link.download = `condo-ai-conversation-${new Date().toISOString().split('T')[0]}.txt`
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
