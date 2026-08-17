import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Check, Edit, Share, Star, StarFilled, Trash } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Input, Modal, Tooltip } from '@open-condo/ui'

import { AIChat } from '@condo/domains/ai/components/AIChat'
import { CoworkLayout } from '@condo/domains/ai/components/Cowork'
import coworkStyles from '@condo/domains/ai/components/Cowork/Cowork.module.css'
import { useAiAssistantsChatStorage } from '@condo/domains/ai/components/Cowork/SavedChatsContext'
import { setSessionId } from '@condo/domains/ai/utils/aiChatStorage'
import { PageComponentType } from '@condo/domains/common/types'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'

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
    const pinChatLabel = intl.formatMessage({ id: 'ai.cowork.pinChat' })
    const unpinChatLabel = intl.formatMessage({ id: 'ai.cowork.unpinChat' })

    const organizationId = useMemo(() => organization?.id, [organization])

    const { chats, createChat, updateChat, deleteChat, copyChat } = useAiAssistantsChatStorage()

    const [activeChatId, setActiveChatId] = useState<string | null>(null)
    const [initialMessage, setInitialMessage] = useState('')
    const [inputValue, setInputValue] = useState('')
    const [editingChatName, setEditingChatName] = useState(false)
    const [chatNameInput, setChatNameInput] = useState('')
    const [shareCopied, setShareCopied] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const inputRef = useRef<any>(null)
    const chatNameInputRef = useRef<any>(null)

    // URL is the source of truth: ?chatId=xyz loads that chat, no chatId = new chat (welcome screen)
    useEffect(() => {
        if (!organizationId) return

        if (queryChatId) {
            const queryChat = chats.find((c) => c.id === queryChatId)
            if (queryChat) {
                setActiveChatId(queryChat.id)
                setInitialMessage('')
                return
            }
        }

        setActiveChatId(null)
    }, [organizationId, queryChatId, chats])

    // Pre-fill input from ?prompt= (used by Skills page) — one-shot, then clean the URL
    useEffect(() => {
        const prompt = router.query.prompt
        if (typeof prompt !== 'string' || !prompt.trim()) return
        if (activeChatId) return
        setInputValue(prompt)
        void router.replace({ pathname: '/cowork/chat', query: {} }, undefined, { shallow: true })
        setTimeout(() => inputRef.current?.focus(), 100)
    }, [router, activeChatId])

    const saveSessionId = useCallback((sessionId: string) => {
        if (!organizationId) return
        setSessionId(organizationId, sessionId)
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

        const newChat = createChat(trimmedInput.slice(0, 50))
        saveSessionId(newChat.id)
        setInitialMessage(trimmedInput)
        setActiveChatId(newChat.id)
        setInputValue('')
        void router.push(`/cowork/chat?chatId=${newChat.id}`, undefined, { shallow: true })
    }, [organizationId, inputValue, createChat, saveSessionId, router])

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key !== 'Enter' || e.shiftKey) return
        e.preventDefault()
        handleStartChat()
    }, [handleStartChat])

    const activeChat = useMemo(() => chats.find((c) => c.id === activeChatId), [chats, activeChatId])

    const handleSaveChatName = useCallback(() => {
        if (!organizationId || !activeChatId) return
        const trimmedName = chatNameInput.trim()
        if (!trimmedName) {
            setEditingChatName(false)
            return
        }
        updateChat(activeChatId, { name: trimmedName.slice(0, 100) })
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
        const copied = await copyChat(activeChatId)
        if (copied) {
            setShareCopied(true)
            setTimeout(() => setShareCopied(false), SHARE_COPIED_RESET_TIMEOUT_MS)
        }
    }, [activeChatId, copyChat])

    const handleDeleteChat = useCallback(() => {
        if (!activeChatId) return
        deleteChat(activeChatId)
        setIsDeleteModalOpen(false)

        // Navigate to a fresh chat page (the layout's New chat logic will pick an empty one or create a new one)
        void router.push('/cowork/chat')
    }, [activeChatId, deleteChat, router])

    const handleTogglePin = useCallback(() => {
        if (!activeChatId) return
        updateChat(activeChatId, { pinned: !activeChat?.pinned })
    }, [activeChatId, activeChat?.pinned, updateChat])

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
                                type='button'
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
                    <Tooltip title={activeChat?.pinned ? unpinChatLabel : pinChatLabel}>
                        <Button
                            type='secondary'
                            size='medium'
                            compact
                            minimal
                            icon={activeChat?.pinned ? <StarFilled size='small' /> : <Star size='small' />}
                            onClick={handleTogglePin}
                            aria-label={activeChat?.pinned ? unpinChatLabel : pinChatLabel}
                        />
                    </Tooltip>
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
                    <div className={coworkStyles.chatContainer}>
                        <AIChat
                            key={activeChatId}
                            aiSessionId={activeChatId}
                            initialMessage={initialMessage || undefined}
                        />
                    </div>
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
                    <div className={coworkStyles.modalFooter}>
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
