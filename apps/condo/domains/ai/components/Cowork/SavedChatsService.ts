import { v4 as uuidV4 } from 'uuid'

import { LocalStorageManager } from '@condo/domains/common/utils/localStorageManager'

const COWORK_CHATS_STORAGE_KEY = 'condo-ai-cowork-chats'

const coworkChatsStorageManager = new LocalStorageManager<Record<string, SavedChat[]>>()

export type SavedChat = {
    id: string
    name: string
    createdAt: number
    pinned?: boolean
}

export type ChatUpdatePayload = {
    name?: string
    pinned?: boolean
}

export class SavedChatsService {
    private async load (organizationId: string): Promise<SavedChat[]> {
        if (typeof window === 'undefined') return []
        const allChats = coworkChatsStorageManager.getItem(COWORK_CHATS_STORAGE_KEY) || {}
        return allChats[organizationId] || []
    }

    private async save (organizationId: string, chats: SavedChat[]): Promise<void> {
        if (typeof window === 'undefined') return
        const allChats = coworkChatsStorageManager.getItem(COWORK_CHATS_STORAGE_KEY) || {}
        allChats[organizationId] = chats
        coworkChatsStorageManager.setItem(COWORK_CHATS_STORAGE_KEY, allChats)
    }

    async getChats (organizationId: string): Promise<SavedChat[]> {
        return this.load(organizationId)
    }

    async createChat (organizationId: string, name: string): Promise<SavedChat> {
        const existingChats = await this.load(organizationId)
        const newChat: SavedChat = {
            id: uuidV4(),
            name,
            createdAt: Date.now(),
            pinned: false,
        }
        await this.save(organizationId, [newChat, ...existingChats])
        return newChat
    }

    async updateChat (organizationId: string, id: string, payload: ChatUpdatePayload): Promise<SavedChat> {
        const existingChats = await this.load(organizationId)
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
        await this.save(organizationId, updatedChats)
        return updatedChat
    }

    async deleteChat (organizationId: string, id: string): Promise<void> {
        const existingChats = await this.load(organizationId)
        await this.save(organizationId, existingChats.filter((chat) => chat.id !== id))
    }
}
