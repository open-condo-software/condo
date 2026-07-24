import React, { useCallback, useEffect, useLayoutEffect, useRef, useState, useMemo } from 'react'
import { v4 as uuidV4 } from 'uuid'

import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { CHAT_WITH_CONDO_FLOW_TYPE, TASK_STATUSES } from '@condo/domains/ai/constants'
import { useAIChatAttachments, type AIChatAttachmentMeta } from '@condo/domains/ai/hooks/useAIChatAttachments'
import { useAIFlow } from '@condo/domains/ai/hooks/useAIFlow'
import { useChatWithCondoButtonConfig } from '@condo/domains/ai/hooks/useChatWithCondoButtonConfig'
import { parseAssistantAnswer, toDisplayText } from '@condo/domains/ai/utils/aiAnswerPresenter'
import { analytics } from '@condo/domains/common/utils/analytics'
import { LocalStorageManager } from '@condo/domains/common/utils/localStorageManager'

import styles from './AIChat.module.css'
import { AIChatInput } from './AIChatInput'
import { AIChatMessage } from './AIChatMessage'
import { AIChatSuggestions } from './AIChatSuggestions'

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
    additionalContext?: Record<string, unknown>
    scenarioButtonId?: string | null
    attachments?: AIChatAttachmentMeta[]
}

type AIChatProps = {
    aiSessionId: string
}

export const AIChat: React.FC<AIChatProps> = ({
    aiSessionId,
}) => {
    const intl = useIntl()
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

    const [inputValue, setInputValue] = useState('')
    const [messages, setMessages] = useState<Message[]>([])
    // User message id of the turn currently pinned/clamped in the scroller
    const [activeTurnUserMessageId, setActiveTurnUserMessageId] = useState<string | null>(null)

    const messagesContainerRef = useRef<HTMLDivElement>(null)
    const chatContainerRef = useRef<HTMLDivElement>(null)
    const inputContainerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<any>(null)
    const pendingScrollToMessageIdRef = useRef<string | null>(null)
    const shouldScrollActiveTurnRef = useRef(false)

    const [{ execute, resume }, { loading, currentTaskId, data }] = useAIFlow<{ answer: string }>({
        aiSessionId,
        flowType: CHAT_WITH_CONDO_FLOW_TYPE,
        timeout: AI_FLOW_TIMEOUT_MS,
        defaultContext: {
            userTimezoneName: Intl.DateTimeFormat().resolvedOptions().timeZone,
            userTimezoneOffset: new Date().getTimezoneOffset(),
            currentUrl: typeof window !== 'undefined' ? window.location.href : null,
        },
    })

    useEffect(() => {
        if (!loading) return

        const rawAnswer = data?.result?.answer ?? ''
        const displayText = rawAnswer ? toDisplayText(rawAnswer) : ''

        setMessages(prev => {
            const lastSendingIndex = [...prev].reverse().findIndex(
                msg => msg.role === 'assistant' && msg.status === 'sending',
            )
            if (lastSendingIndex < 0) return prev

            const index = prev.length - 1 - lastSendingIndex
            const current = prev[index]
            if (current.content.text === displayText) return prev

            const updated = [...prev]
            updated[index] = {
                ...current,
                content: { text: displayText },
            }
            return updated
        })
    }, [data?.result?.answer, loading])

    const changeMessage = useCallback((messageId: string, updatedMessage: Message) => {
        setMessages(prev => {
            return prev.map(msg => msg.id === messageId ? updatedMessage : msg)
        })
    }, [])

    const finalizeAssistantMessage = useCallback((
        assistantMessage: Message,
        result: { data: { status?: string, result?: { answer?: string } } | null, error?: object, localizedErrorText?: string },
    ) => {
        if (!result.data || result.error) {
            changeMessage(assistantMessage.id, {
                ...assistantMessage,
                content: { text: result.localizedErrorText || failedToGetResponseMessage },
                status: 'sent',
            })
            return
        }

        const rawAnswer = result.data.result?.answer
        const { text: assistantAnswerText, suggestions, suggestionsFailureReason } = parseAssistantAnswer(
            rawAnswer?.trim() ? rawAnswer : noResponseMessage,
        )

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
    }, [aiSessionId, changeMessage, failedToGetResponseMessage, noResponseMessage])

    useEffect(() => {
        const savedHistory = historyStorageManager.getItem(STORAGE_KEY)

        if (!savedHistory || typeof savedHistory !== 'object') {
            setMessages([])
            setActiveTurnUserMessageId(null)
            return
        }

        const sessionData = savedHistory[aiSessionId]
        if (!sessionData || !sessionData.history) {
            setMessages([])
            setActiveTurnUserMessageId(null)
            return
        }

        const historyArray = sessionData.history

        if (historyArray.length === 0) {
            setMessages([])
            setActiveTurnUserMessageId(null)
            return
        }

        const historyWithDates = historyArray.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
        }))
        setMessages(historyWithDates)
        setActiveTurnUserMessageId(null)
        // Wait for history messages to commit to the DOM before scrolling to bottom
        requestAnimationFrame(() => {
            const container = messagesContainerRef.current
            if (container) {
                container.scrollTop = container.scrollHeight
            }
        })

        const lastMessage = historyWithDates[historyWithDates.length - 1]

        if (lastMessage?.status === 'sending' && lastMessage?.executionAIFlowTaskId) {
            const resumeLastMessage = async () => {
                try {
                    const result = await resume(lastMessage.executionAIFlowTaskId)
                    finalizeAssistantMessage(lastMessage, result)
                } catch (error) {
                    console.error('Error resuming AI flow:', error)
                    changeMessage(lastMessage.id, {
                        ...lastMessage,
                        content: { text: errorMessage },
                        status: 'sent',
                    })
                }
            }

            resumeLastMessage()
        }
    }, [aiSessionId, resume, finalizeAssistantMessage, changeMessage, errorMessage])

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
        if (aiSessionId) {
            saveMessagesToLocalStorage()
        }
    }, [aiSessionId, messages, saveMessagesToLocalStorage])

    useEffect(() => {
        if (!currentTaskId) return

        setMessages(prev => prev.map(msg => {
            if (msg.role === 'assistant' && msg.status === 'sending' && !msg.executionAIFlowTaskId) {
                return { ...msg, executionAIFlowTaskId: currentTaskId }
            }
            return msg
        }))
    }, [currentTaskId])

    const chatTurns = useMemo(() => {
        const turns: Array<{ user: Message, assistant?: Message }> = []

        for (let index = 0; index < messages.length; index++) {
            const message = messages[index]
            if (message.role !== 'user') continue

            const nextMessage = messages[index + 1]
            if (nextMessage?.role === 'assistant') {
                turns.push({ user: message, assistant: nextMessage })
                index += 1
            } else {
                turns.push({ user: message })
            }
        }

        return turns
    }, [messages])

    const getMessagesPadding = useCallback((container: HTMLElement) => {
        const style = getComputedStyle(container)
        return {
            padTop: Number.parseFloat(style.paddingTop) || 0,
            padBottom: Number.parseFloat(style.paddingBottom) || 0,
            listGap: Number.parseFloat(style.rowGap || style.gap) || 0,
        }
    }, [])

    const getTurnPinScrollTop = useCallback((container: HTMLElement, turnElement: HTMLElement) => {
        const { padTop, listGap } = getMessagesPadding(container)
        const containerRect = container.getBoundingClientRect()
        const turnRect = turnElement.getBoundingClientRect()
        const alignDelta = turnRect.top - (containerRect.top + padTop)
        const headerBottomY = containerRect.top + padTop - listGap

        let peekAfterAlign = 0
        let sibling = turnElement.previousElementSibling as HTMLElement | null
        while (sibling) {
            const bottomAfterAlign = sibling.getBoundingClientRect().bottom - alignDelta
            peekAfterAlign = Math.max(peekAfterAlign, bottomAfterAlign - headerBottomY)
            sibling = sibling.previousElementSibling as HTMLElement | null
        }

        return Math.max(0, container.scrollTop + alignDelta + Math.max(0, peekAfterAlign))
    }, [getMessagesPadding])

    const scrollTurnToTop = useCallback((userMessageId: string) => {
        const container = messagesContainerRef.current
        if (!container) return

        const turnElement = container.querySelector(
            `[data-turn-user-id="${userMessageId}"]`,
        ) as HTMLElement | null
        if (!turnElement) return

        container.scrollTop = getTurnPinScrollTop(container, turnElement)
    }, [getTurnPinScrollTop])

    const getActiveTurnMaxScrollTop = useCallback(() => {
        const container = messagesContainerRef.current
        const userMessageId = activeTurnUserMessageId
        if (!container || !userMessageId) {
            return Math.max(0, container ? container.scrollHeight - container.clientHeight : 0)
        }

        const turnElement = container.querySelector(
            `[data-turn-user-id="${userMessageId}"]`,
        ) as HTMLElement | null
        if (!turnElement) {
            return Math.max(0, container.scrollHeight - container.clientHeight)
        }

        const { padTop, padBottom } = getMessagesPadding(container)
        const pinScrollTop = getTurnPinScrollTop(container, turnElement)
        const gap = Number.parseFloat(getComputedStyle(turnElement).rowGap || getComputedStyle(turnElement).gap) || 0
        const messageElements = Array.from(
            turnElement.querySelectorAll<HTMLElement>('[data-message-id]'),
        )
        const contentHeight = messageElements.reduce((total, element, index) => {
            return total + element.offsetHeight + (index > 0 ? gap : 0)
        }, 0)
        const visibleHeight = Math.max(0, container.clientHeight - padTop - padBottom)
        const contentOverflow = Math.max(0, contentHeight - visibleHeight)

        return pinScrollTop + contentOverflow
    }, [activeTurnUserMessageId, getMessagesPadding, getTurnPinScrollTop])

    const clampActiveTurnScroll = useCallback(() => {
        const container = messagesContainerRef.current
        if (!container || !activeTurnUserMessageId) return

        const maxScrollTop = getActiveTurnMaxScrollTop()
        if (container.scrollTop > maxScrollTop + 1) {
            container.scrollTop = maxScrollTop
        }
    }, [activeTurnUserMessageId, getActiveTurnMaxScrollTop])

    useLayoutEffect(() => {
        const messageId = pendingScrollToMessageIdRef.current
        if (!messageId) return

        const userIndex = messages.findIndex((message) => message.id === messageId)
        if (userIndex < 0) return

        const turnAssistant = messages[userIndex + 1]
        if (turnAssistant?.role !== 'assistant') return

        pendingScrollToMessageIdRef.current = null
        shouldScrollActiveTurnRef.current = true
        setActiveTurnUserMessageId(messageId)
    }, [messages])

    useLayoutEffect(() => {
        if (!activeTurnUserMessageId || !shouldScrollActiveTurnRef.current) return

        shouldScrollActiveTurnRef.current = false
        scrollTurnToTop(activeTurnUserMessageId)
        clampActiveTurnScroll()
    }, [activeTurnUserMessageId, clampActiveTurnScroll, scrollTurnToTop])

    useEffect(() => {
        if (!activeTurnUserMessageId) return

        const container = messagesContainerRef.current
        const onScroll = () => {
            clampActiveTurnScroll()
        }

        container?.addEventListener('scroll', onScroll, { passive: true })
        clampActiveTurnScroll()

        return () => container?.removeEventListener('scroll', onScroll)
    }, [activeTurnUserMessageId, clampActiveTurnScroll, messages])

    useEffect(() => {
        setTimeout(() => {
            inputRef.current?.focus()
        }, 100)
    }, [])

    useEffect(() => {
        const syncScrollportHeight = (container: HTMLElement) => {
            const { padTop, padBottom } = getMessagesPadding(container)
            const visibleHeight = Math.max(0, container.clientHeight - padTop - padBottom)
            container.style.setProperty('--ai-chat-scrollport-height', `${visibleHeight}px`)
            clampActiveTurnScroll()
        }

        const messagesContainer = messagesContainerRef.current
        if (!messagesContainer) return

        syncScrollportHeight(messagesContainer)
        const messagesObserver = new ResizeObserver(() => syncScrollportHeight(messagesContainer))
        messagesObserver.observe(messagesContainer)

        const chatContainer = chatContainerRef.current
        const inputContainer = inputContainerRef.current
        if (!chatContainer || !inputContainer) {
            return () => messagesObserver.disconnect()
        }

        const syncInputHeight = () => {
            chatContainer.style.setProperty('--ai-chat-input-height', `${inputContainer.offsetHeight}px`)
            // Wait for padding from --ai-chat-input-height to apply before measuring scrollport
            requestAnimationFrame(() => {
                if (messagesContainerRef.current) {
                    syncScrollportHeight(messagesContainerRef.current)
                }
            })
        }

        syncInputHeight()
        const inputObserver = new ResizeObserver(syncInputHeight)
        inputObserver.observe(inputContainer)

        return () => {
            messagesObserver.disconnect()
            inputObserver.disconnect()
        }
    }, [clampActiveTurnScroll, getMessagesPadding])

    const startUserTurn = useCallback((
        userMessage: Message,
        options: ExecuteAIMessageOptions = {},
    ) => {
        const assistantMessage: Message = {
            id: uuidV4(),
            content: { text: '' },
            role: 'assistant',
            timestamp: new Date(),
            status: 'sending',
        }

        setMessages((prev) => [...prev, userMessage, assistantMessage])
        pendingScrollToMessageIdRef.current = userMessage.id

        return (async () => {
            try {
                const result = await execute({
                    userInput: userMessage.content.text,
                    userData: {
                        userId: user.id,
                        organizationId: organization?.id,
                        ...options.additionalContext,
                    },
                    ...(options.attachments?.length ? { attachments: options.attachments } : {}),
                    ...(options.scenarioButtonId ? { button_id: options.scenarioButtonId } : {}),
                })

                finalizeAssistantMessage(assistantMessage, result)
            } catch (error) {
                console.error('Error in startUserTurn:', error)
                changeMessage(assistantMessage.id, {
                    ...assistantMessage,
                    content: { text: errorMessage },
                    status: 'sent',
                })
            }
        })()
    }, [user, organization, execute, finalizeAssistantMessage, changeMessage, errorMessage])

    const handleSendMessage = useCallback(async () => {
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
            id: uuidV4(),
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

        setInputValue('')
        attachments?.resetAttachments()

        await startUserTurn(userMessage, { attachments: attachmentsToSend })
    }, [inputValue, canSendWithAttachments, loading, attachmentsUploading, user, attachments, messages, startUserTurn])

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
            id: uuidV4(),
            content: { text: buttonName },
            role: 'user',
            timestamp: new Date(),
            status: 'sent',
            copyable: true,
        }

        await startUserTurn(userMessage, { scenarioButtonId: buttonId })
    }, [loading, user, canExecuteAIFlow, messages, startUserTurn])

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
            id: uuidV4(),
            content: { text: suggestedText },
            role: 'user',
            timestamp: new Date(),
            status: 'sent',
            copyable: true,
        }

        await startUserTurn(userMessage)
    }, [loading, user, canExecuteAIFlow, messages, startUserTurn])

    const handleComposerKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key !== 'Enter' || e.shiftKey) return

        e.preventDefault()

        if (canSendMessage && canExecuteAIFlow) {
            void handleSendMessage()
        }
    }, [canExecuteAIFlow, canSendMessage, handleSendMessage])

    return (
        <div ref={chatContainerRef} className={styles.chatContainer}>
            <div ref={messagesContainerRef} className={`${styles.messagesContainer} comment-body`}>
                {welcomeDisplayMessage && (
                    <AIChatMessage
                        message={welcomeDisplayMessage}
                        canExecuteAIFlow={canExecuteAIFlow}
                    />
                )}
                {scenarioButtons.length > 0 && (
                    <AIChatSuggestions
                        items={scenarioButtons.map((btn) => ({
                            key: btn.buttonId,
                            label: btn.buttonName,
                            tooltip: btn.buttonDescription || undefined,
                            disabled: !canExecuteAIFlow,
                            onClick: () => handleScenarioButtonClick(btn.buttonId, btn.buttonName),
                        }))}
                    />
                )}
                {chatTurns.map(({ user: userMessage, assistant: assistantMessage }) => {
                    const isActiveTurn = userMessage.id === activeTurnUserMessageId

                    return (
                        <div
                            key={userMessage.id}
                            className={styles.turn}
                            data-turn-user-id={userMessage.id}
                            data-active={isActiveTurn ? 'true' : undefined}
                        >
                            <AIChatMessage
                                message={userMessage}
                                canExecuteAIFlow={canExecuteAIFlow}
                            />
                            {assistantMessage && (
                                <AIChatMessage
                                    message={assistantMessage}
                                    onSuggestionClick={handleSuggestionButtonClick}
                                    canExecuteAIFlow={canExecuteAIFlow}
                                />
                            )}
                        </div>
                    )
                })}
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
                onSendMessage={handleSendMessage}
                placeholder={placeholder}
            />
        </div>
    )
}
