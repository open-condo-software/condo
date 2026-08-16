import { v4 as uuidV4 } from 'uuid'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

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

// Async storage ops — currently synchronous localStorage, ready to swap for GraphQL mutations.
async function loadChats (organizationId: string): Promise<SavedChat[]> {
    if (typeof window === 'undefined') return []
    const allChats = coworkChatsStorageManager.getItem(COWORK_CHATS_STORAGE_KEY) || {}
    return allChats[organizationId] || []
}

async function saveChats (organizationId: string, chats: SavedChat[]): Promise<void> {
    if (typeof window === 'undefined') return
    const allChats = coworkChatsStorageManager.getItem(COWORK_CHATS_STORAGE_KEY) || {}
    allChats[organizationId] = chats
    coworkChatsStorageManager.setItem(COWORK_CHATS_STORAGE_KEY, allChats)
}

interface IAiAssistantsChatStorageContext {
    chats: SavedChat[]
    isLoading: boolean
    createChat: (name: string) => Promise<SavedChat>
    updateChat: (id: string, payload: ChatUpdatePayload) => Promise<SavedChat>
    deleteChat: (id: string) => Promise<void>
    exportChat: (id: string) => string | null
    copyChat: (id: string) => Promise<boolean>
}

const AiAssistantsChatStorageContext = createContext<IAiAssistantsChatStorageContext | null>(null)

export const AiAssistantsChatStorageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { organization } = useOrganization()
    const organizationId = organization?.id

    const [chats, setChats] = useState<SavedChat[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(false)

    const refresh = useCallback(async () => {
        if (!organizationId) return
        setIsLoading(true)
        try {
            setChats(await loadChats(organizationId))
        } finally {
            setIsLoading(false)
        }
    }, [organizationId])

    const createChat = useCallback(async (name: string) => {
        if (!organizationId) throw new Error('Organization is not selected')
        const newChat: SavedChat = {
            id: uuidV4(),
            name,
            createdAt: Date.now(),
            pinned: false,
        }
        const prevChats = chats
        const nextChats = [newChat, ...prevChats]
        setChats(nextChats)
        try {
            await saveChats(organizationId, nextChats)
            return newChat
        } catch (error) {
            setChats(prevChats)
            throw error
        }
    }, [organizationId, chats])

    const updateChat = useCallback(async (id: string, payload: ChatUpdatePayload) => {
        if (!organizationId) throw new Error('Organization is not selected')
        const prevChats = chats
        const chatIndex = prevChats.findIndex((chat) => chat.id === id)
        if (chatIndex === -1) {
            throw new Error(`Chat with id "${id}" not found`)
        }
        const updatedChat = { ...prevChats[chatIndex], ...payload }
        const withoutChat = prevChats.filter((chat) => chat.id !== id)

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
        try {
            await saveChats(organizationId, nextChats)
            return updatedChat
        } catch (error) {
            setChats(prevChats)
            throw error
        }
    }, [organizationId, chats])

    const deleteChat = useCallback(async (id: string) => {
        if (!organizationId) throw new Error('Organization is not selected')
        const prevChats = chats
        const nextChats = prevChats.filter((chat) => chat.id !== id)
        setChats(nextChats)
        deleteChatHistory(id)
        try {
            await saveChats(organizationId, nextChats)
        } catch (error) {
            setChats(prevChats)
            throw error
        }
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

    useEffect(() => {
        refresh()
    }, [refresh])

    const value = useMemo(() => ({
        chats,
        isLoading,
        createChat,
        updateChat,
        deleteChat,
        exportChat,
        copyChat,
    }), [chats, isLoading, createChat, updateChat, deleteChat, exportChat, copyChat])

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
