import { useLazyQuery } from '@apollo/client'
import React, { useState, useRef, useEffect } from 'react'
import { v4 as uuidV4 } from 'uuid'

import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Input, Space, Typography } from '@open-condo/ui'
import { Markdown } from '@open-condo/ui'


import { LAST_ACTION_REQUESTED, TASK_STATUSES } from '@condo/domains/ai/constants'
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
    
    const [messages, setMessages] = useState<Message[]>([])
    const [inputValue, setInputValue] = useState('')
    const [aiSessionId] = useState(uuidV4)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<any>(null)

    const addMessage = (newMessage: Message) => {
        setMessages(prev => [...prev, newMessage])
    }

    const changeMessage = (messageId: string, updatedMessage: Message) => {
        setMessages(prev => prev.map(msg => msg.id === messageId ? updatedMessage : msg))
    }

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

            if (result.data?.status === TASK_STATUSES.ACTION_REQUESTED && result.data?.lastActionRequested === LAST_ACTION_REQUESTED.DATA_REQUESTED) {
                changeMessage(assistantMessage.id, {
                    ...assistantMessage,
                    content: (result.data.result.answer),
                    status: 'sent',
                })

                const requestedData = await fetchRequestedData(result.data?.lastActionRequestedMeta)
                
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
