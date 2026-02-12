import { useLazyQuery } from '@apollo/client'
import React, { useState, useRef, useEffect } from 'react'
import { v4 as uuidV4 } from 'uuid'

import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Input, Space, Typography } from '@open-condo/ui'
import { Markdown } from '@open-condo/ui'

import { ACTION_REQUESTED, TASK_STATUSES } from '@condo/domains/ai/constants'
import { useAIFlow } from '@condo/domains/ai/hooks/useAIFlow'
import { MODEL_QUERIES } from '@condo/domains/ai/utils/dataQueries'

import styles from './AIChat.module.css'

type Message = {
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

export const AIChat: React.FC<AIChatProps> = ({ onClose }) => {
    const intl = useIntl()
    const { user } = useAuth()
    const { organization } = useOrganization()
    
    const [inputValue, setInputValue] = useState('')
    const [aiSessionId] = useState(uuidV4)
    const [messages, setMessages] = useState<Message[]>([])
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<any>(null)

    // Query for existing chat history
    const [fetchChatTasks] = useLazyQuery(MODEL_QUERIES.ExecutionAIFlowTask)
    const [fetchTickets] = useLazyQuery(MODEL_QUERIES.Ticket)
    const [fetchTicketComments] = useLazyQuery(MODEL_QUERIES.TicketComment)
    const [fetchProperties] = useLazyQuery(MODEL_QUERIES.Property)
    const [fetchUsers] = useLazyQuery(MODEL_QUERIES.User)

    const [executeAIFlow, { loading }] = useAIFlow<{ answer: string }>({
        flowType: 'chat-with-condo',
        timeout: 45000,
    })

    const placeholder = intl.formatMessage({ id: 'ai.chat.placeholder' })
    const loadingLabel = intl.formatMessage({ id: 'ai.chat.loading' })
    const welcomeMessage = intl.formatMessage({ id: 'ai.chat.welcome' })
    const errorMessage = intl.formatMessage({ id: 'ai.chat.error' })
    const failedToGetResponseMessage = intl.formatMessage({ id: 'ai.chat.failedToGetResponse' })
    const foundItemsMessage = intl.formatMessage({ id: 'ai.chat.foundItems' })

    // Load existing chat history on component mount
    useEffect(() => {
        const loadChatHistory = async () => {
            if (!user || !organization) return
            
            try {
                const result = await fetchChatTasks({
                    variables: {
                        where: {
                            aiSessionId: { equals: aiSessionId },
                            user: { id: { equals: user.id } },
                            organization: { id: { equals: organization.id } },
                        },
                        orderBy: [{ createdAt: 'asc' }],
                        first: 100,
                    },
                })

                if (result.data?.items) {
                    const chatHistory: Message[] = []
                    
                    result.data.items.forEach((task: any) => {
                        // Add user message from context
                        if (task.context?.userInput) {
                            chatHistory.push({
                                id: `user-${task.id}`,
                                content: task.context.userInput,
                                role: 'user',
                                timestamp: new Date(task.createdAt),
                                status: 'sent',
                            })
                        }

                        // Add assistant response from result
                        if (task.result?.answer) {
                            chatHistory.push({
                                id: `assistant-${task.id}`,
                                content: task.result.answer,
                                role: 'assistant',
                                timestamp: new Date(task.updatedAt),
                                status: task.status === TASK_STATUSES.COMPLETED ? 'sent' : 
                                       task.status === TASK_STATUSES.ERROR ? 'error' : 'sending',
                            })
                        }

                        // Add tool call results if any
                        if (task.status === TASK_STATUSES.ACTION_REQUESTED && 
                            task.actionRequested === ACTION_REQUESTED.TOOL_CALL) {
                            chatHistory.push({
                                id: `tool-${task.id}`,
                                content: intl.formatMessage({ id: 'ai.chat.toolExecuted' }),
                                role: 'assistant',
                                timestamp: new Date(task.updatedAt),
                                status: 'sent',
                            })
                        }
                    })

                    // If we have chat history in context of the most recent task, use that
                    const latestTask = result.data.items[result.data.items.length - 1]
                    if (latestTask?.context?.chatHistory && Array.isArray(latestTask.context.chatHistory)) {
                        const contextHistory = latestTask.context.chatHistory.map((msg: any) => ({
                            id: msg.id,
                            content: msg.content,
                            role: msg.role,
                            timestamp: new Date(msg.timestamp),
                            status: msg.status || 'sent',
                        }))
                        setMessages(contextHistory)
                    } else {
                        setMessages(chatHistory)
                    }
                }
            } catch (error) {
                console.error('Failed to load chat history:', error)
            }
        }

        loadChatHistory()
    }, [user, organization, aiSessionId, fetchChatTasks, intl])

    const addMessage = (newMessage: Message) => {
        setMessages(prev => [...prev, newMessage])
    }

    const changeMessage = (messageId: string, updatedMessage: Message) => {
        setMessages(prev => prev.map(msg => msg.id === messageId ? updatedMessage : msg))
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

    const executeAIMessage = async (userInput: string, additionalContext?: any) => {
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
                    chatHistory: messages.map(msg => ({
                        id: msg.id,
                        content: msg.content,
                        role: msg.role,
                        timestamp: msg.timestamp.toISOString(),
                        status: msg.status,
                    })),
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

            if (result.data?.status === TASK_STATUSES.ACTION_REQUESTED && result.data?.actionRequested === ACTION_REQUESTED.TOOL_CALL) {
                changeMessage(assistantMessage.id, {
                    ...assistantMessage,
                    content: (result.data.result.answer),
                    status: 'sent',
                })

                const requestedData = await fetchRequestedData(result.data?.actionRequestedMeta)
                
                addMessage({
                    id: `assistant-${Date.now()}`,
                    role: 'assistant',
                    content: intl.formatMessage({ id: 'ai.chat.foundItems' }, { count: requestedData.length }),
                    status: 'sent',
                    timestamp: new Date(),
                })

                // Continue the conversation with the additional data
                await executeAIMessage(userInput, { requestedData })
            } else if (result.data?.status === TASK_STATUSES.COMPLETED) {
                changeMessage(assistantMessage.id, {
                    ...assistantMessage,
                    content: result.data.result.answer || 'No response available',
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

    const fetchRequestedData = async (meta: any) => {
        const modelKey = Object.keys(meta)[0]
        if (!modelKey) {
            throw new Error('Invalid data request: no model specified in meta')
        }

        const modelMeta = meta[modelKey]
        const { first, where } = modelMeta

        if (!where) {
            throw new Error('Invalid data request: missing where clause')
        }

        let result
        const variables = { where, first: first || 10 }

        // Use the appropriate query based on model
        const modelName = modelKey.charAt(0).toUpperCase() + modelKey.slice(1)
        
        switch (modelName) {
            case 'Ticket':
                result = await fetchTickets({ variables })
                break
            case 'TicketComment':
                result = await fetchTicketComments({ variables })
                break
            case 'Property':
                result = await fetchProperties({ variables })
                break
            case 'User':
                result = await fetchUsers({ variables })
                break
            default:
                throw new Error(`Model "${modelName}" is not supported`)
        }

        return result.data?.items || []
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
}
