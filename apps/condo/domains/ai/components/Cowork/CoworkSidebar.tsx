import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { v4 as uuidV4 } from 'uuid'

import { ChevronDown, Plus, Services, Settings, Sparkles, Star, StarFilled, Trash } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Tooltip } from '@open-condo/ui'

import { LocalStorageManager } from '@condo/domains/common/utils/localStorageManager'

import styles from './Cowork.module.css'

const AI_SESSION_STORAGE_KEY = 'condo-ai-chat-session-id'
const COWORK_CHATS_STORAGE_KEY = 'condo-ai-cowork-chats'
const AI_CHAT_HISTORY_STORAGE_KEY = 'condo-ai-chat-history'
const sessionStorageManager = new LocalStorageManager<Record<string, string>>()
const coworkChatsStorageManager = new LocalStorageManager<Record<string, CoworkChat[]>>()
const historyStorageManager = new LocalStorageManager<Record<string, { history: any[], organizationId: string }>>()

export type CoworkChat = {
    id: string
    title: string
    createdAt: number
    pinned?: boolean
}

export const COWORK_CHATS_UPDATED_EVENT = 'condo-ai-cowork-chats-updated'

export const saveCoworkChats = (orgId: string, updatedChats: CoworkChat[]) => {
    const allChats = coworkChatsStorageManager.getItem(COWORK_CHATS_STORAGE_KEY) || {}
    allChats[orgId] = updatedChats
    coworkChatsStorageManager.setItem(COWORK_CHATS_STORAGE_KEY, allChats)
    window.dispatchEvent(new Event(COWORK_CHATS_UPDATED_EVENT))
}

type CoworkSidebarProps = {
    activeChatId?: string | null
    onSelectChat?: (chatId: string) => void
    onNewChat?: () => void
    highlightNavItem?: 'chats' | 'miniapps' | 'skills' | 'settings'
}

export const CoworkSidebar: React.FC<CoworkSidebarProps> = ({
    activeChatId,
    onSelectChat,
    onNewChat,
    highlightNavItem = 'chats',
}) => {
    const intl = useIntl()
    const router = useRouter()
    const { organization } = useOrganization()

    const newChatLabel = intl.formatMessage({ id: 'ai.cowork.newChat' })
    const welcomeSubtitle = intl.formatMessage({ id: 'ai.cowork.welcomeSubtitle' })
    const deleteChatLabel = intl.formatMessage({ id: 'ai.cowork.deleteChat' })
    const myMiniappsLabel = intl.formatMessage({ id: 'ai.cowork.myMiniapps' })
    const skillsLabel = intl.formatMessage({ id: 'ai.cowork.skills' })
    const settingsLabel = intl.formatMessage({ id: 'ai.cowork.settings' })
    const pinnedLabel = intl.formatMessage({ id: 'ai.cowork.pinned' })
    const chatsLabel = intl.formatMessage({ id: 'ai.cowork.chats' })
    const pinChatLabel = intl.formatMessage({ id: 'ai.cowork.pinChat' })
    const unpinChatLabel = intl.formatMessage({ id: 'ai.cowork.unpinChat' })

    const organizationId = useMemo(() => organization?.id, [organization])

    const [chats, setChats] = useState<CoworkChat[]>([])

    useEffect(() => {
        if (!organizationId) return

        const allChats = coworkChatsStorageManager.getItem(COWORK_CHATS_STORAGE_KEY) || {}
        const orgChats = allChats[organizationId] || []
        setChats(orgChats)
    }, [organizationId, activeChatId])

    // Reload chats when they are changed elsewhere (e.g. chat page creates/renames a chat)
    useEffect(() => {
        const handleChatsUpdated = () => {
            if (!organizationId) return
            const allChats = coworkChatsStorageManager.getItem(COWORK_CHATS_STORAGE_KEY) || {}
            setChats(allChats[organizationId] || [])
        }
        window.addEventListener(COWORK_CHATS_UPDATED_EVENT, handleChatsUpdated)
        return () => window.removeEventListener(COWORK_CHATS_UPDATED_EVENT, handleChatsUpdated)
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

    const handleNewChat = useCallback(() => {
        if (onNewChat) {
            onNewChat()
            return
        }

        if (!organizationId) return

        const savedHistory = historyStorageManager.getItem(AI_CHAT_HISTORY_STORAGE_KEY) || {}
        const emptyChat = chats.find((chat) => {
            const sessionData = savedHistory[chat.id]
            return !sessionData || !sessionData.history || sessionData.history.length === 0
        })
        if (emptyChat) {
            saveSessionId(emptyChat.id)
            router.push('/cowork/chat')
            return
        }

        const newChatId = uuidV4()
        const newChat: CoworkChat = {
            id: newChatId,
            title: newChatLabel,
            createdAt: Date.now(),
        }
        const allChats = coworkChatsStorageManager.getItem(COWORK_CHATS_STORAGE_KEY) || {}
        const orgChats = allChats[organizationId] || []
        const updatedChats = [newChat, ...orgChats]
        saveChats(organizationId, updatedChats)
        setChats(updatedChats)
        saveSessionId(newChatId)

        router.push('/cowork/chat')
    }, [onNewChat, organizationId, chats, newChatLabel, saveChats, saveSessionId, router])

    // Cmd+K shortcut for new chat
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                handleNewChat()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleNewChat])

    const handleSelectChat = useCallback((chatId: string) => {
        saveSessionId(chatId)
        if (onSelectChat) {
            onSelectChat(chatId)
        } else {
            router.push('/cowork/chat')
        }
    }, [saveSessionId, onSelectChat, router])

    const handleDeleteChat = useCallback((chatId: string) => {
        if (!organizationId) return
        const updatedChats = chats.filter((c) => c.id !== chatId)
        saveChats(organizationId, updatedChats)
        setChats(updatedChats)
    }, [organizationId, chats, saveChats])

    const handleTogglePin = useCallback((chatId: string) => {
        if (!organizationId) return
        const updatedChats = chats.map((c) =>
            c.id === chatId ? { ...c, pinned: !c.pinned } : c
        )
        saveChats(organizationId, updatedChats)
        setChats(updatedChats)
    }, [organizationId, chats, saveChats])

    const pinnedChats = useMemo(() => chats.filter((c) => c.pinned), [chats])
    const unpinnedChats = useMemo(() => chats.filter((c) => !c.pinned), [chats])

    const [pinnedCollapsed, setPinnedCollapsed] = useState(false)
    const [chatsCollapsed, setChatsCollapsed] = useState(false)

    const renderChatItem = (chat: CoworkChat) => (
        <div
            key={chat.id}
            className={`${styles.chatListItem} ${chat.id === activeChatId ? styles.chatListItemActive : ''} ${chat.pinned ? styles.chatListItemPinned : ''}`}
            onClick={() => handleSelectChat(chat.id)}
        >
            <span className={styles.chatListItemTitle}>{chat.title}</span>
            <div className={styles.chatListItemActions}>
                <Tooltip title={chat.pinned ? unpinChatLabel : pinChatLabel}>
                    <Button
                        type='secondary'
                        size='medium'
                        compact
                        minimal
                        icon={chat.pinned ? <StarFilled size='small' /> : <Star size='small' />}
                        onClick={(e) => {
                            e.stopPropagation()
                            handleTogglePin(chat.id)
                        }}
                    />
                </Tooltip>
                <Tooltip title={deleteChatLabel}>
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
                </Tooltip>
            </div>
        </div>
    )

    return (
        <div className={styles.sidebar}>
            <div className={styles.sidebarNav}>
                <div
                    className={`${styles.sidebarNavItem} ${highlightNavItem === 'chats' ? styles.sidebarNavItemActive : ''}`}
                    onClick={handleNewChat}
                >
                    <span className={styles.sidebarNavItemIcon}><Plus size='small' /></span>
                    {newChatLabel}
                </div>
                <div
                    className={`${styles.sidebarNavItem} ${highlightNavItem === 'miniapps' ? styles.sidebarNavItemActive : ''}`}
                    onClick={() => router.push('/cowork/miniapps')}
                >
                    <span className={styles.sidebarNavItemIcon}><Services size='small' /></span>
                    {myMiniappsLabel}
                </div>
                <div
                    className={`${styles.sidebarNavItem} ${highlightNavItem === 'skills' ? styles.sidebarNavItemActive : ''}`}
                    onClick={() => router.push('/cowork/skills')}
                >
                    <span className={styles.sidebarNavItemIcon}><Sparkles size='small' /></span>
                    {skillsLabel}
                </div>
                <div
                    className={`${styles.sidebarNavItem} ${highlightNavItem === 'settings' ? styles.sidebarNavItemActive : ''}`}
                    onClick={() => router.push('/cowork/settings')}
                >
                    <span className={styles.sidebarNavItemIcon}><Settings size='small' /></span>
                    {settingsLabel}
                </div>
            </div>
            <div className={styles.sidebarDivider} />
            {pinnedChats.length > 0 && (
                <>
                    <div
                        className={styles.sidebarSectionHeader}
                        onClick={() => setPinnedCollapsed((v) => !v)}
                    >
                        <span
                            className={`${styles.sidebarSectionHeaderChevron} ${pinnedCollapsed ? styles.sidebarSectionHeaderChevronCollapsed : ''}`}
                        >
                            <ChevronDown size='small' />
                        </span>
                        {pinnedLabel}
                    </div>
                    <div
                        className={`${styles.sidebarSectionContent} ${pinnedCollapsed ? styles.sidebarSectionContentCollapsed : ''}`}
                    >
                        {pinnedChats.map(renderChatItem)}
                    </div>
                </>
            )}
            {unpinnedChats.length > 0 && (
                <>
                    <div
                        className={styles.sidebarSectionHeader}
                        onClick={() => setChatsCollapsed((v) => !v)}
                    >
                        <span
                            className={`${styles.sidebarSectionHeaderChevron} ${chatsCollapsed ? styles.sidebarSectionHeaderChevronCollapsed : ''}`}
                        >
                            <ChevronDown size='small' />
                        </span>
                        {chatsLabel}
                    </div>
                    <div
                        className={`${styles.sidebarSectionContent} ${chatsCollapsed ? styles.sidebarSectionContentCollapsed : ''}`}
                    >
                        {unpinnedChats.map(renderChatItem)}
                    </div>
                </>
            )}
        </div>
    )
}
