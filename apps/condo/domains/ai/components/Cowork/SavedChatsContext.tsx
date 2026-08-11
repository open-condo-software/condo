import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { useOrganization } from '@open-condo/next/organization'

import { SavedChatsService } from './SavedChatsService'

import type { ChatStorageType, ChatUpdatePayload, SavedChat } from './SavedChatsService'

interface ISavedChatsContext {
    chats: SavedChat[]
    pinnedChats: SavedChat[]
    unpinnedChats: SavedChat[]
    isLoading: boolean
    error: Error | null
    getChats: () => Promise<void>
    createChat: (name: string) => Promise<SavedChat>
    updateChat: (id: string, payload: ChatUpdatePayload) => Promise<SavedChat>
    deleteChat: (id: string) => Promise<void>
}

const COWORK_CHATS_UPDATED_EVENT = 'coworkChatsUpdated'

const SavedChatsContext = createContext<ISavedChatsContext | null>(null)

interface ISavedChatsProviderProps {
    children: React.ReactNode
    storage?: ChatStorageType
}

export const SavedChatsProvider: React.FC<ISavedChatsProviderProps> = ({ children, storage = 'localstorage' }) => {
    const { organization } = useOrganization()
    const organizationId = organization?.id

    const service = useMemo(() => new SavedChatsService(storage), [storage])

    const [chats, setChats] = useState<SavedChat[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<Error | null>(null)

    const getChats = useCallback(async () => {
        if (!organizationId) return

        setIsLoading(true)
        setError(null)
        try {
            const loadedChats = await service.getChats(organizationId)
            setChats(loadedChats)
        } catch (err) {
            setError(err as Error)
        } finally {
            setIsLoading(false)
        }
    }, [organizationId, service])

    const createChat = useCallback(async (name: string) => {
        if (!organizationId) throw new Error('Organization is not selected')

        const newChat = await service.createChat(organizationId, name)
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event(COWORK_CHATS_UPDATED_EVENT))
        }
        await getChats()

        return newChat
    }, [organizationId, service, getChats])

    const updateChat = useCallback(async (id: string, payload: ChatUpdatePayload) => {
        if (!organizationId) throw new Error('Organization is not selected')

        const updatedChat = await service.updateChat(organizationId, id, payload)
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event(COWORK_CHATS_UPDATED_EVENT))
        }
        await getChats()

        return updatedChat
    }, [organizationId, service, getChats])

    const deleteChat = useCallback(async (id: string) => {
        if (!organizationId) throw new Error('Organization is not selected')

        await service.deleteChat(organizationId, id)
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event(COWORK_CHATS_UPDATED_EVENT))
        }
        await getChats()
    }, [organizationId, service, getChats])

    useEffect(() => {
        getChats()
    }, [getChats])

    useEffect(() => {
        if (typeof window === 'undefined') return

        const handleChatsUpdated = () => {
            getChats()
        }
        window.addEventListener(COWORK_CHATS_UPDATED_EVENT, handleChatsUpdated)
        return () => window.removeEventListener(COWORK_CHATS_UPDATED_EVENT, handleChatsUpdated)
    }, [getChats])

    const pinnedChats = useMemo(() => chats.filter((chat) => chat.pinned), [chats])
    const unpinnedChats = useMemo(() => chats.filter((chat) => !chat.pinned), [chats])

    const value = useMemo(() => ({
        chats,
        pinnedChats,
        unpinnedChats,
        isLoading,
        error,
        getChats,
        createChat,
        updateChat,
        deleteChat,
    }), [chats, pinnedChats, unpinnedChats, isLoading, error, getChats, createChat, updateChat, deleteChat])

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
