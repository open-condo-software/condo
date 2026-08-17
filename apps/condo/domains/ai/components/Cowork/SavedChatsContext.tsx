import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { v4 as uuidV4 } from 'uuid'

import { useOrganization } from '@open-condo/next/organization'

import { deleteChatHistory, exportChatAsText } from '@condo/domains/ai/utils/aiChatStorage'
import { LocalStorageManager } from '@condo/domains/common/utils/localStorageManager'


const COWORK_CHATS_STORAGE_KEY = 'condo-ai-cowork-chats'
const coworkChatsStorageManager = new LocalStorageManager<Record<string, SavedChat[]>>()

export type SavedChat = {
    id: string
    name: string
    createdAt: number
    pinned: boolean
}

export type ChatUpdatePayload = {
    name?: string
    pinned?: boolean
}

function loadChats (organizationId: string): SavedChat[] {
    if (typeof window === 'undefined') return []
    const allChats = coworkChatsStorageManager.getItem(COWORK_CHATS_STORAGE_KEY) || {}
    return allChats[organizationId] || []
}

function saveChats (organizationId: string, chats: SavedChat[]): void {
    if (typeof window === 'undefined') return
    const allChats = coworkChatsStorageManager.getItem(COWORK_CHATS_STORAGE_KEY) || {}
    allChats[organizationId] = chats
    coworkChatsStorageManager.setItem(COWORK_CHATS_STORAGE_KEY, allChats)
}

interface IAiAssistantsChatStorageContext {
    chats: SavedChat[]
    createChat: (name: string) => SavedChat
    updateChat: (id: string, payload: ChatUpdatePayload) => SavedChat
    deleteChat: (id: string) => void
    exportChat: (id: string) => string | null
    copyChat: (id: string) => Promise<boolean>
}

const AiAssistantsChatStorageContext = createContext<IAiAssistantsChatStorageContext | null>(null)

export const AiAssistantsChatStorageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { organization } = useOrganization()
    const organizationId = organization?.id

    const [chats, setChats] = useState<SavedChat[]>([])

    useEffect(() => {
        if (!organizationId) return
        setChats(loadChats(organizationId))
    }, [organizationId])

    const createChat = useCallback((name: string): SavedChat => {
        if (!organizationId) throw new Error('Organization is not selected')
        const newChat: SavedChat = {
            id: uuidV4(),
            name,
            createdAt: Date.now(),
            pinned: false,
        }
        const nextChats = [newChat, ...chats]
        setChats(nextChats)
        saveChats(organizationId, nextChats)
        return newChat
    }, [organizationId, chats])

    const updateChat = useCallback((id: string, payload: ChatUpdatePayload): SavedChat => {
        if (!organizationId) throw new Error('Organization is not selected')
        const chatIndex = chats.findIndex((chat) => chat.id === id)
        if (chatIndex === -1) {
            throw new Error(`Chat with id "${id}" not found`)
        }
        const updatedChat = { ...chats[chatIndex], ...payload }
        const withoutChat = chats.filter((chat) => chat.id !== id)

        // Reorder on pin toggle: pinning floats to the top (most-recently-pinned first),
        // unpinning moves to the front of the unpinned group (first slot after the last pinned chat).
        let insertAt: number
        if (payload.pinned === true) {
            insertAt = 0
        } else if (payload.pinned === false) {
            insertAt = withoutChat.findIndex((chat) => !chat.pinned)
            if (insertAt === -1) insertAt = withoutChat.length
        } else {
            insertAt = chatIndex
        }

        const nextChats = [
            ...withoutChat.slice(0, insertAt),
            updatedChat,
            ...withoutChat.slice(insertAt),
        ]
        setChats(nextChats)
        saveChats(organizationId, nextChats)
        return updatedChat
    }, [organizationId, chats])

    const deleteChat = useCallback((id: string): void => {
        if (!organizationId) throw new Error('Organization is not selected')
        const nextChats = chats.filter((chat) => chat.id !== id)
        setChats(nextChats)
        deleteChatHistory(id)
        saveChats(organizationId, nextChats)
    }, [organizationId, chats])

    const exportChat = useCallback((id: string): string | null => {
        return exportChatAsText(id)
    }, [])

    const copyChat = useCallback(async (id: string): Promise<boolean> => {
        const text = exportChatAsText(id)
        if (!text) return false
        try {
            await navigator.clipboard.writeText(text)
            return true
        } catch (error) {
            console.error('Unable to copy conversation to clipboard', error)
            return false
        }
    }, [])

    const value = useMemo(() => ({
        chats,
        createChat,
        updateChat,
        deleteChat,
        exportChat,
        copyChat,
    }), [chats, createChat, updateChat, deleteChat, exportChat, copyChat])

    return (
        <AiAssistantsChatStorageContext.Provider value={value}>
            {children}
        </AiAssistantsChatStorageContext.Provider>
    )
}

export const useAiAssistantsChatStorage = (): IAiAssistantsChatStorageContext => {
    const context = useContext(AiAssistantsChatStorageContext)
    if (!context) {
        throw new Error('useAiAssistantsChatStorage must be used within AiAssistantsChatStorageProvider')
    }
    return context
}

export type { IAiAssistantsChatStorageContext }
