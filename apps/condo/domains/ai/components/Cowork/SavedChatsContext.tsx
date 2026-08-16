import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { useOrganization } from '@open-condo/next/organization'

import { SavedChatsService } from './SavedChatsService'

import type { ChatUpdatePayload, SavedChat } from './SavedChatsService'

interface ISavedChatsContext {
    chats: SavedChat[]
    pinnedChats: SavedChat[]
    unpinnedChats: SavedChat[]
    isLoading: boolean
    createChat: (name: string) => Promise<SavedChat>
    updateChat: (id: string, payload: ChatUpdatePayload) => Promise<SavedChat>
    deleteChat: (id: string) => Promise<void>
}

const SavedChatsContext = createContext<ISavedChatsContext | null>(null)

export const SavedChatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { organization } = useOrganization()
    const organizationId = organization?.id

    const service = useMemo(() => new SavedChatsService(), [])

    const [chats, setChats] = useState<SavedChat[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(false)

    const getChats = useCallback(async () => {
        if (!organizationId) return
        setIsLoading(true)
        try {
            setChats(await service.getChats(organizationId))
        } finally {
            setIsLoading(false)
        }
    }, [organizationId, service])

    const createChat = useCallback(async (name: string) => {
        if (!organizationId) throw new Error('Organization is not selected')
        const newChat = await service.createChat(organizationId, name)
        await getChats()
        return newChat
    }, [organizationId, service, getChats])

    const updateChat = useCallback(async (id: string, payload: ChatUpdatePayload) => {
        if (!organizationId) throw new Error('Organization is not selected')
        const updatedChat = await service.updateChat(organizationId, id, payload)
        await getChats()
        return updatedChat
    }, [organizationId, service, getChats])

    const deleteChat = useCallback(async (id: string) => {
        if (!organizationId) throw new Error('Organization is not selected')
        await service.deleteChat(organizationId, id)
        await getChats()
    }, [organizationId, service, getChats])

    useEffect(() => {
        getChats()
    }, [getChats])

    const pinnedChats = useMemo(() => chats.filter((chat) => chat.pinned), [chats])
    const unpinnedChats = useMemo(() => chats.filter((chat) => !chat.pinned), [chats])

    const value = useMemo(() => ({
        chats,
        pinnedChats,
        unpinnedChats,
        isLoading,
        createChat,
        updateChat,
        deleteChat,
    }), [chats, pinnedChats, unpinnedChats, isLoading, createChat, updateChat, deleteChat])

    return (
        <SavedChatsContext.Provider value={value}>
            {children}
        </SavedChatsContext.Provider>
    )
}

export const useSavedChats = (): ISavedChatsContext => {
    const context = useContext(SavedChatsContext)
    if (!context) {
        throw new Error('useSavedChats must be used within SavedChatsProvider')
    }
    return context
}

export type { ISavedChatsContext, SavedChat }
