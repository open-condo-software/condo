import { v4 as uuidV4 } from 'uuid'

import { LocalStorageManager } from '@condo/domains/common/utils/localStorageManager'

export const COWORK_CHATS_UPDATED_EVENT = 'condo-ai-cowork-chats-updated'

const COWORK_CHATS_STORAGE_KEY = 'condo-ai-cowork-chats'

const coworkChatsStorageManager = new LocalStorageManager<Record<string, StoredChat[]>>()

export type SavedChat = {
    id: string
    name: string
    createdAt: number
    pinned?: boolean
}

type StoredChat = {
    id: string
    title: string
    createdAt: number
    pinned?: boolean
}

type ChatStorageType = 'localstorage' | string

type ChatUpdatePayload = {
    name?: string
    pinned?: boolean
}

const toSavedChat = (chat: StoredChat): SavedChat => ({
    id: chat.id,
    name: chat.title,
    createdAt: chat.createdAt,
    pinned: chat.pinned,
})

const toStoredChat = (chat: SavedChat): StoredChat => ({
    id: chat.id,
    title: chat.name,
    createdAt: chat.createdAt,
    pinned: chat.pinned,
})

const sortChats = (chats: SavedChat[]): SavedChat[] => {
    const pinned = chats.filter((chat) => chat.pinned).sort((a, b) => b.createdAt - a.createdAt)
    const unpinned = chats.filter((chat) => !chat.pinned).sort((a, b) => b.createdAt - a.createdAt)

    return [...pinned, ...unpinned]
}

export class SavedChatsService {
    private readonly storage: ChatStorageType

    constructor (storage: ChatStorageType = 'localstorage') {
        this.storage = storage
    }

    private async loadFromLocalStorage (organizationId: string): Promise<SavedChat[]> {
        if (typeof window === 'undefined') return []

        const allChats = coworkChatsStorageManager.getItem(COWORK_CHATS_STORAGE_KEY) || {}

        return (allChats[organizationId] || []).map(toSavedChat)
    }

    private async saveToLocalStorage (organizationId: string, chats: SavedChat[]): Promise<void> {
        if (typeof window === 'undefined') return

        const allChats = coworkChatsStorageManager.getItem(COWORK_CHATS_STORAGE_KEY) || {}

        allChats[organizationId] = chats.map(toStoredChat)
        coworkChatsStorageManager.setItem(COWORK_CHATS_STORAGE_KEY, allChats)
        window.dispatchEvent(new Event(COWORK_CHATS_UPDATED_EVENT))
    }

    async getChats (organizationId: string): Promise<SavedChat[]> {
        if (this.storage !== 'localstorage') {
            throw new Error(`Storage type "${this.storage}" is not supported yet`)
        }

        const chats = await this.loadFromLocalStorage(organizationId)

        return sortChats(chats)
    }

    async createChat (organizationId: string, name: string): Promise<SavedChat> {
        if (this.storage !== 'localstorage') {
            throw new Error(`Storage type "${this.storage}" is not supported yet`)
        }

        const existingChats = await this.loadFromLocalStorage(organizationId)
        const newChat: SavedChat = {
            id: uuidV4(),
            name,
            createdAt: Date.now(),
            pinned: false,
        }
        const updatedChats = [newChat, ...existingChats]

        await this.saveToLocalStorage(organizationId, updatedChats)

        return newChat
    }

    async updateChat (organizationId: string, id: string, payload: ChatUpdatePayload): Promise<SavedChat> {
        if (this.storage !== 'localstorage') {
            throw new Error(`Storage type "${this.storage}" is not supported yet`)
        }

        const existingChats = await this.loadFromLocalStorage(organizationId)
        const chatIndex = existingChats.findIndex((chat) => chat.id === id)

        if (chatIndex === -1) {
            throw new Error(`Chat with id "${id}" not found`)
        }

        const updatedChat = { ...existingChats[chatIndex], ...payload }
        const updatedChats = [
            ...existingChats.slice(0, chatIndex),
            updatedChat,
            ...existingChats.slice(chatIndex + 1),
        ]

        await this.saveToLocalStorage(organizationId, updatedChats)

        return updatedChat
    }

    async deleteChat (organizationId: string, id: string): Promise<void> {
        if (this.storage !== 'localstorage') {
            throw new Error(`Storage type "${this.storage}" is not supported yet`)
        }

        const existingChats = await this.loadFromLocalStorage(organizationId)
        const updatedChats = existingChats.filter((chat) => chat.id !== id)

        await this.saveToLocalStorage(organizationId, updatedChats)
    }
}

export type { ChatStorageType }
export type { ChatUpdatePayload }
