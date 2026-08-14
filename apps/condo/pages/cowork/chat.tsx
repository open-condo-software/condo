import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Check, Edit, Share, Trash } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Input, Modal, Tooltip } from '@open-condo/ui'

import { AIChat } from '@condo/domains/ai/components/AIChat'
import { CoworkLayout } from '@condo/domains/ai/components/Cowork'
import coworkStyles from '@condo/domains/ai/components/Cowork/Cowork.module.css'
import { useSavedChats } from '@condo/domains/ai/components/Cowork/SavedChatsContext'
import { PageComponentType } from '@condo/domains/common/types'
import { LocalStorageManager } from '@condo/domains/common/utils/localStorageManager'
import { stripMarkdown } from '@condo/domains/common/utils/stripMarkdown'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
const AI_SESSION_STORAGE_KEY = 'condo-ai-chat-session-id'
const AI_CHAT_HISTORY_STORAGE_KEY = 'condo-ai-chat-history'
const sessionStorageManager = new LocalStorageManager<Record<string, string>>()
const historyStorageManager = new LocalStorageManager<Record<string, { history: any[], organizationId: string }>>()

const SHARE_COPIED_RESET_TIMEOUT_MS = 2000

const CoworkPage: PageComponentType = () => {
    const intl = useIntl()
    const { organization } = useOrganization()
    const router = useRouter()
    const queryChatId = router.query.chatId as string | undefined

    const placeholder = intl.formatMessage({ id: 'ai.chat.placeholder' })
    const newChatLabel = intl.formatMessage({ id: 'ai.cowork.newChat' })
    const welcomeSubtitle = intl.formatMessage({ id: 'ai.cowork.welcomeSubtitle' })
    const welcomeTitle = intl.formatMessage({ id: 'ai.cowork.title' })
    const editChatNameLabel = intl.formatMessage({ id: 'ai.cowork.editChatName' })
    const shareLabel = intl.formatMessage({ id: 'ai.cowork.share' })
    const shareCopiedLabel = intl.formatMessage({ id: 'ai.cowork.shareCopied' })
    const deleteChatLabel = intl.formatMessage({ id: 'ai.cowork.deleteChat' })
    const deleteChatConfirmLabel = intl.formatMessage({ id: 'ai.cowork.deleteChatConfirm' })
    const deleteChatConfirmOkLabel = intl.formatMessage({ id: 'ai.cowork.deleteChatConfirmOk' })
    const deleteChatConfirmCancelLabel = intl.formatMessage({ id: 'ai.cowork.deleteChatConfirmCancel' })

    const organizationId = useMemo(() => organization?.id, [organization])

    const { chats, isLoading: isChatsLoading, createChat, updateChat, deleteChat } = useSavedChats()

    const [activeChatId, setActiveChatId] = useState<string | null>(null)
    const [initialMessage, setInitialMessage] = useState('')
    const [inputValue, setInputValue] = useState('')
    const [editingChatName, setEditingChatName] = useState(false)
    const [chatNameInput, setChatNameInput] = useState('')
    const [shareCopied, setShareCopied] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const inputRef = useRef<any>(null)
    const chatNameInputRef = useRef<any>(null)

    // Pick the active chat once the saved chats are loaded / org changes
    useEffect(() => {
        if (!organizationId || isChatsLoading) return

        if (chats.length > 0) {
            const queryChat = queryChatId ? chats.find((c) => c.id === queryChatId) : null
            if (queryChat) {
                setActiveChatId(queryChat.id)
                setInitialMessage('')
                return
            }

            const sessions = sessionStorageManager.getItem(AI_SESSION_STORAGE_KEY) || {}
            const currentSessionId = sessions[organizationId]
            const matchingChat = chats.find((c) => c.id === currentSessionId)
            setActiveChatId(matchingChat ? matchingChat.id : chats[0].id)
        } else {
            setActiveChatId(null)
        }
    }, [organizationId, queryChatId, chats, isChatsLoading])

    const saveSessionId = useCallback((sessionId: string) => {
        if (!organizationId) return
        const sessions = sessionStorageManager.getItem(AI_SESSION_STORAGE_KEY) || {}
        sessions[organizationId] = sessionId
        sessionStorageManager.setItem(AI_SESSION_STORAGE_KEY, sessions)
    }, [organizationId])

    const hasStarted = activeChatId !== null

    useEffect(() => {
        if (!hasStarted) {
            setTimeout(() => {
                inputRef.current?.focus()
            }, 100)
        }
    }, [hasStarted])

    const handleStartChat = useCallback(async () => {
        if (!organizationId) return
        const trimmedInput = inputValue.trim()
        if (!trimmedInput) return

        const newChat = await createChat(trimmedInput.slice(0, 50))
        saveSessionId(newChat.id)
        setInitialMessage(trimmedInput)
        setActiveChatId(newChat.id)
        setInputValue('')
    }, [organizationId, inputValue, createChat, saveSessionId])

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key !== 'Enter' || e.shiftKey) return
        e.preventDefault()
        handleStartChat()
    }, [handleStartChat])

    const handleSelectChat = useCallback((chatId: string) => {
        saveSessionId(chatId)
        setInitialMessage('')
        setActiveChatId(chatId)
        setEditingChatName(false)
    }, [saveSessionId])

    const activeChat = useMemo(() => chats.find((c) => c.id === activeChatId), [chats, activeChatId])

    const handleSaveChatName = useCallback(async () => {
        if (!organizationId || !activeChatId) return
        const trimmedName = chatNameInput.trim()
        if (!trimmedName) {
            setEditingChatName(false)
            return
        }
        await updateChat(activeChatId, { name: trimmedName.slice(0, 100) })
        setEditingChatName(false)
    }, [organizationId, activeChatId, chatNameInput, updateChat])

    const handleChatNameKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleSaveChatName()
        } else if (e.key === 'Escape') {
            e.preventDefault()
            setEditingChatName(false)
        }
    }, [handleSaveChatName])

    useEffect(() => {
        if (editingChatName) {
            setChatNameInput(activeChat?.name || '')
            setTimeout(() => {
                chatNameInputRef.current?.focus()
                chatNameInputRef.current?.select()
            }, 0)
        }
    }, [editingChatName, activeChat?.name])

    const handleShare = useCallback(async () => {
        if (!activeChatId) return

        const savedHistory = historyStorageManager.getItem(AI_CHAT_HISTORY_STORAGE_KEY)
        if (!savedHistory) return

        const sessionData = savedHistory[activeChatId]
        if (!sessionData || !sessionData.history || sessionData.history.length === 0) return

        const lines: string[] = []
        for (const msg of sessionData.history) {
            if (!msg.content?.text?.trim()) continue
            const roleLabel = msg.role === 'user' ? 'User' : 'Assistant'
            const text = msg.role === 'assistant'
                ? stripMarkdown(msg.content.text, { collapseLineBreaks: false })
                : msg.content.text
            lines.push(`${roleLabel}: ${text}`)
            lines.push('')
        }

        if (lines.length === 0) return

        try {
            await navigator.clipboard.writeText(lines.join('\n').trim())
            setShareCopied(true)
            setTimeout(() => setShareCopied(false), SHARE_COPIED_RESET_TIMEOUT_MS)
        } catch (e) {
            console.error('Unable to copy conversation to clipboard', e)
        }
    }, [activeChatId])

    const handleDeleteChat = useCallback(async () => {
        if (!activeChatId) return
        await deleteChat(activeChatId)
        setIsDeleteModalOpen(false)

        // Also clean up the chat history from local storage
        const savedHistory = historyStorageManager.getItem(AI_CHAT_HISTORY_STORAGE_KEY)
        if (savedHistory && savedHistory[activeChatId]) {
            delete savedHistory[activeChatId]
            historyStorageManager.setItem(AI_CHAT_HISTORY_STORAGE_KEY, savedHistory)
        }

        // Navigate to a fresh chat page (the layout's New chat logic will pick an empty one or create a new one)
        void router.push('/cowork/chat')
    }, [activeChatId, deleteChat, router])

    const canSend = useMemo(() => Boolean(inputValue.trim()), [inputValue])

    const renderChatHeader = () => {
        if (!hasStarted) return null

        return (
            <div className={coworkStyles.chatHeader}>
                <div className={coworkStyles.chatHeaderLeft}>
                    {editingChatName ? (
                        <Input
                            ref={chatNameInputRef}
                            className={coworkStyles.chatNameInput}
                            value={chatNameInput}
                            onChange={(e) => setChatNameInput(e.target.value)}
                            onKeyDown={handleChatNameKeyDown}
                            onBlur={handleSaveChatName}
                        />
                    ) : (
                        <Tooltip title={editChatNameLabel}>
                            <button
                                className={coworkStyles.chatNameButton}
                                onClick={() => setEditingChatName(true)}
                            >
                                <span className={coworkStyles.chatNameText}>{activeChat?.name || newChatLabel}</span>
                                <span className={coworkStyles.chatNameEditIcon}><Edit size='small' /></span>
                            </button>
                        </Tooltip>
                    )}
                </div>
                <div className={coworkStyles.chatHeaderRight}>
                    <Tooltip title={shareCopied ? shareCopiedLabel : shareLabel}>
                        <Button
                            type='secondary'
                            size='medium'
                            compact
                            minimal
                            icon={shareCopied ? <Check size='small' /> : <Share size='small' />}
                            onClick={handleShare}
                            disabled={shareCopied}
                            aria-label={shareLabel}
                        />
                    </Tooltip>
                    <Tooltip title={deleteChatLabel}>
                        <Button
                            type='secondary'
                            size='medium'
                            compact
                            minimal
                            icon={<Trash size='small' />}
                            onClick={() => setIsDeleteModalOpen(true)}
                            aria-label={deleteChatLabel}
                        />
                    </Tooltip>
                </div>
            </div>
        )
    }

    const renderMain = () => {
        if (!hasStarted) {
            return (
                <div className={coworkStyles.welcomeScreen}>
                    <div className={coworkStyles.welcomeTitle}>
                        {welcomeTitle}
                    </div>
                    <div className={coworkStyles.welcomeSubtitle}>
                        {welcomeSubtitle}
                    </div>
                    <div className={coworkStyles.welcomeInputWrapper}>
                        <Input.TextArea
                            ref={inputRef}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onSubmit={handleStartChat}
                            placeholder={placeholder}
                            autoSize={{ minRows: 1, maxRows: 4 }}
                            isSubmitDisabled={!canSend}
                        />
                    </div>
                </div>
            )
        }

        return (
            <div className={coworkStyles.chatContent}>
                {activeChatId && (
                    <AIChat
                        key={activeChatId}
                        aiSessionId={activeChatId}
                        initialMessage={initialMessage || undefined}
                    />
                )}
            </div>
        )
    }

    return (
        <div className={coworkStyles.coworkBody}>
            <div className={coworkStyles.mainArea}>
                {renderChatHeader()}
                {renderMain()}
            </div>
            <Modal
                open={isDeleteModalOpen}
                title={deleteChatConfirmLabel}
                onCancel={() => setIsDeleteModalOpen(false)}
                footer={
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <Button type='secondary' onClick={() => setIsDeleteModalOpen(false)}>
                            {deleteChatConfirmCancelLabel}
                        </Button>
                        <Button type='primary' onClick={handleDeleteChat}>
                            {deleteChatConfirmOkLabel}
                        </Button>
                    </div>
                }
            />
        </div>
    )
}

CoworkPage.requiredAccess = OrganizationRequired
CoworkPage.container = CoworkLayout

export default CoworkPage
