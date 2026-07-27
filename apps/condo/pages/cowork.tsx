import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { v4 as uuidV4 } from 'uuid'

import { Plus, Trash } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Input } from '@open-condo/ui'

import { AIChat } from '@condo/domains/ai/components/AIChat'
import { PageComponentType } from '@condo/domains/common/types'
import { TopMenuItems } from '@condo/domains/common/components/containers/BaseLayout/components/TopMenuItems'
import { LocalStorageManager } from '@condo/domains/common/utils/localStorageManager'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'

import styles from './cowork.module.css'

const AI_SESSION_STORAGE_KEY = 'condo-ai-chat-session-id'
const COWORK_CHATS_STORAGE_KEY = 'condo-ai-cowork-chats'
const sessionStorageManager = new LocalStorageManager<Record<string, string>>()
const coworkChatsStorageManager = new LocalStorageManager<Record<string, CoworkChat[]>>()

type CoworkChat = {
    id: string
    title: string
    createdAt: number
}


const CoworkLayout: React.FC<React.PropsWithChildren<{ headerAction?: React.ElementType }>> = ({ children, headerAction }) => {
    return (
        <div className={styles.coworkLayout}>
            <div className={styles.coworkHeader}>
                <div className={styles.coworkHeaderLeft}>
                    <div className={styles.coworkLogo}>
                        Doma.ai <span className={styles.coworkLogoItalic}>Cowork</span>
                    </div>
                </div>
                <div className={styles.coworkHeaderRight}>
                    <TopMenuItems headerAction={headerAction} hideAIButton />
                </div>
            </div>
            {children}
        </div>
    )
}

const CoworkPage: PageComponentType = () => {
    const intl = useIntl()
    const { organization } = useOrganization()

    const placeholder = intl.formatMessage({ id: 'ai.chat.placeholder' })
    const newChatLabel = intl.formatMessage({ id: 'ai.cowork.newChat' })
    const welcomeSubtitle = intl.formatMessage({ id: 'ai.cowork.welcomeSubtitle' })
    const deleteChatLabel = intl.formatMessage({ id: 'ai.cowork.deleteChat' })

    const organizationId = useMemo(() => organization?.id, [organization])

    const [chats, setChats] = useState<CoworkChat[]>([])
    const [activeChatId, setActiveChatId] = useState<string | null>(null)
    const [initialMessage, setInitialMessage] = useState('')
    const [inputValue, setInputValue] = useState('')
    const inputRef = useRef<any>(null)

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
        const allChats = coworkChatsStorageManager.getItem(COWORK_CHATS_STORAGE_KEY) || {}
        allChats[orgId] = updatedChats
        coworkChatsStorageManager.setItem(COWORK_CHATS_STORAGE_KEY, allChats)
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
    }, [saveSessionId])

    const handleNewChat = useCallback(() => {
        setInitialMessage('')
        setActiveChatId(null)
        setInputValue('')
    }, [])

    const handleDeleteChat = useCallback((chatId: string) => {
        if (!organizationId) return
        const updatedChats = chats.filter((c) => c.id !== chatId)
        saveChats(organizationId, updatedChats)
        setChats(updatedChats)

        if (activeChatId === chatId) {
            if (updatedChats.length > 0) {
                saveSessionId(updatedChats[0].id)
                setInitialMessage('')
                setActiveChatId(updatedChats[0].id)
            } else {
                setActiveChatId(null)
            }
        }
    }, [organizationId, chats, activeChatId, saveChats, saveSessionId])

    const canSend = useMemo(() => Boolean(inputValue.trim()), [inputValue])

    const renderSidebar = () => (
        <div className={styles.sidebar}>
            <div className={styles.sidebarNewChat}>
                <Button
                    type='secondary'
                    size='medium'
                    block
                    onClick={handleNewChat}
                    icon={<Plus size='small' />}
                >
                    {newChatLabel}
                </Button>
            </div>
            <div className={styles.chatList}>
                {chats.length === 0 ? (
                    <div className={styles.sidebarEmpty}>{welcomeSubtitle}</div>
                ) : (
                    chats.map((chat) => (
                        <div
                            key={chat.id}
                            className={`${styles.chatListItem} ${chat.id === activeChatId ? styles.chatListItemActive : ''}`}
                            onClick={() => handleSelectChat(chat.id)}
                        >
                            <span className={styles.chatListItemTitle}>{chat.title}</span>
                            <div className={styles.chatListItemDelete}>
                                <Button
                                    type='secondary'
                                    size='medium'
                                    compact
                                    minimal
                                    icon={<Trash size='small' />}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteChat(chat.id)
                                    }}
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )

    const renderMain = () => {
        if (!hasStarted) {
            return (
                <div className={styles.welcomeScreen}>
                    <div className={styles.welcomeTitle}>
                        Doma.ai <span className={styles.welcomeTitleItalic}>Cowork</span>
                    </div>
                    <div className={styles.welcomeSubtitle}>
                        {welcomeSubtitle}
                    </div>
                    <div className={styles.welcomeInputWrapper}>
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
            <div className={styles.chatScreen}>
                {activeChatId && (
                    <AIChat
                        key={activeChatId}
                        aiSessionId={activeChatId}
                        initialMessage={initialMessage || undefined}
                        variant='embedded'
                    />
                )}
            </div>
        )
    }

    return (
        <div className={styles.coworkBody}>
            {renderSidebar()}
            <div className={styles.mainArea}>
                <div className={styles.contentContainer}>
                    {renderMain()}
                </div>
            </div>
        </div>
    )
}

CoworkPage.requiredAccess = OrganizationRequired
CoworkPage.container = CoworkLayout

export default CoworkPage
