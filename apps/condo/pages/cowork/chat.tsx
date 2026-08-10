import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { v4 as uuidV4 } from 'uuid'

import { Check, Edit, Share } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Input, Tooltip } from '@open-condo/ui'

import { CoworkLayout, CoworkSidebar, saveCoworkChats, type CoworkChat } from '@condo/domains/ai/components/Cowork'
import { AIChat } from '@condo/domains/ai/components/AIChat'
import coworkStyles from '@condo/domains/ai/components/Cowork/Cowork.module.css'
import { PageComponentType } from '@condo/domains/common/types'
import { LocalStorageManager } from '@condo/domains/common/utils/localStorageManager'
import { stripMarkdown } from '@condo/domains/common/utils/stripMarkdown'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'

const AI_SESSION_STORAGE_KEY = 'condo-ai-chat-session-id'
const COWORK_CHATS_STORAGE_KEY = 'condo-ai-cowork-chats'
const AI_CHAT_HISTORY_STORAGE_KEY = 'condo-ai-chat-history'
const sessionStorageManager = new LocalStorageManager<Record<string, string>>()
const coworkChatsStorageManager = new LocalStorageManager<Record<string, CoworkChat[]>>()
const historyStorageManager = new LocalStorageManager<Record<string, { history: any[], organizationId: string }>>()

const SHARE_COPIED_RESET_TIMEOUT_MS = 2000

const CoworkPage: PageComponentType = () => {
    const intl = useIntl()
    const { organization } = useOrganization()

    const placeholder = intl.formatMessage({ id: 'ai.chat.placeholder' })
    const newChatLabel = intl.formatMessage({ id: 'ai.cowork.newChat' })
    const welcomeSubtitle = intl.formatMessage({ id: 'ai.cowork.welcomeSubtitle' })
    const editChatNameLabel = intl.formatMessage({ id: 'ai.cowork.editChatName' })
    const shareLabel = intl.formatMessage({ id: 'ai.cowork.share' })
    const shareCopiedLabel = intl.formatMessage({ id: 'ai.cowork.shareCopied' })

    const organizationId = useMemo(() => organization?.id, [organization])

    const [chats, setChats] = useState<CoworkChat[]>([])
    const [activeChatId, setActiveChatId] = useState<string | null>(null)
    const [initialMessage, setInitialMessage] = useState('')
    const [inputValue, setInputValue] = useState('')
    const [editingChatName, setEditingChatName] = useState(false)
    const [chatNameInput, setChatNameInput] = useState('')
    const [shareCopied, setShareCopied] = useState(false)
    const inputRef = useRef<any>(null)
    const chatNameInputRef = useRef<any>(null)

    // Load chats from localStorage on mount / org change
    useEffect(() => {
        if (!organizationId) return

        const allChats = coworkChatsStorageManager.getItem(COWORK_CHATS_STORAGE_KEY) || {}
        const orgChats = allChats[organizationId] || []
        setChats(orgChats)

        if (orgChats.length > 0) {
            const sessions = sessionStorageManager.getItem(AI_SESSION_STORAGE_KEY) || {}
            const currentSessionId = sessions[organizationId]
            const matchingChat = orgChats.find((c) => c.id === currentSessionId)
            setActiveChatId(matchingChat ? matchingChat.id : orgChats[0].id)
        } else {
            setActiveChatId(null)
        }
    }, [organizationId])

    const saveChats = useCallback((orgId: string, updatedChats: CoworkChat[]) => {
        saveCoworkChats(orgId, updatedChats)
    }, [])

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

    const handleStartChat = useCallback(() => {
        if (!organizationId) return
        const trimmedInput = inputValue.trim()
        if (!trimmedInput) return

        const newChatId = uuidV4()
        const newChat: CoworkChat = {
            id: newChatId,
            title: trimmedInput.slice(0, 50),
            createdAt: Date.now(),
        }
        const updatedChats = [newChat, ...chats]
        saveChats(organizationId, updatedChats)
        setChats(updatedChats)
        saveSessionId(newChatId)
        setInitialMessage(trimmedInput)
        setActiveChatId(newChatId)
        setInputValue('')
    }, [organizationId, inputValue, chats, saveChats, saveSessionId])

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

    const findEmptyChat = useCallback((chatsToCheck: CoworkChat[]) => {
        const savedHistory = historyStorageManager.getItem(AI_CHAT_HISTORY_STORAGE_KEY) || {}
        return chatsToCheck.find((chat) => {
            const sessionData = savedHistory[chat.id]
            return !sessionData || !sessionData.history || sessionData.history.length === 0
        })
    }, [])

    const handleNewChat = useCallback(() => {
        if (!organizationId) return

        const emptyChat = findEmptyChat(chats)
        if (emptyChat) {
            saveSessionId(emptyChat.id)
            setInitialMessage('')
            setActiveChatId(emptyChat.id)
            setInputValue('')
            setEditingChatName(false)
            return
        }

        const newChatId = uuidV4()
        const newChat: CoworkChat = {
            id: newChatId,
            title: newChatLabel,
            createdAt: Date.now(),
        }
        const updatedChats = [newChat, ...chats]
        saveChats(organizationId, updatedChats)
        setChats(updatedChats)
        saveSessionId(newChatId)
        setInitialMessage('')
        setActiveChatId(newChatId)
        setInputValue('')
        setEditingChatName(false)
    }, [organizationId, chats, findEmptyChat, saveChats, saveSessionId, newChatLabel])

    const activeChat = useMemo(() => chats.find((c) => c.id === activeChatId), [chats, activeChatId])

    const handleSaveChatName = useCallback(() => {
        if (!organizationId || !activeChatId) return
        const trimmedName = chatNameInput.trim()
        if (!trimmedName) {
            setEditingChatName(false)
            return
        }
        const updatedChats = chats.map((c) =>
            c.id === activeChatId ? { ...c, title: trimmedName.slice(0, 100) } : c
        )
        saveChats(organizationId, updatedChats)
        setChats(updatedChats)
        setEditingChatName(false)
    }, [organizationId, activeChatId, chatNameInput, chats, saveChats])

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
            setChatNameInput(activeChat?.title || '')
            setTimeout(() => {
                chatNameInputRef.current?.focus()
                chatNameInputRef.current?.select()
            }, 0)
        }
    }, [editingChatName, activeChat?.title])

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
                                <span className={coworkStyles.chatNameText}>{activeChat?.title || newChatLabel}</span>
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
                </div>
            </div>
        )
    }

    const renderMain = () => {
        if (!hasStarted) {
            return (
                <div className={coworkStyles.welcomeScreen}>
                    <div className={coworkStyles.welcomeTitle}>
                        Doma.ai <span className={coworkStyles.welcomeTitleItalic}>Cowork</span>
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
            <CoworkSidebar
                activeChatId={activeChatId}
                onSelectChat={handleSelectChat}
                onNewChat={handleNewChat}
                highlightNavItem='chats'
            />
            <div className={coworkStyles.mainArea}>
                {renderChatHeader()}
                {renderMain()}
            </div>
        </div>
    )
}

CoworkPage.requiredAccess = OrganizationRequired
CoworkPage.container = CoworkLayout

export default CoworkPage
