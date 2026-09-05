import { LocalStorageManager } from '@condo/domains/common/utils/localStorageManager'
import { stripMarkdown } from '@condo/domains/common/utils/stripMarkdown'

import type { A2uiMessage } from '@a2ui/web_core/v0_9'

export const AI_SESSION_STORAGE_KEY = 'condo-ai-chat-session-id'
export const AI_CHAT_HISTORY_STORAGE_KEY = 'condo-ai-chat-history'

export type MessageAttachmentDisplay = {
    name: string
    mimeType?: string
    url?: string
}

export type MessageContent = {
    text: string
    suggestions?: string[]
    attachments?: MessageAttachmentDisplay[]
    a2uiMessages?: A2uiMessage[]
    skillName?: string
}

export type Message = {
    id: string
    content: MessageContent
    role: 'user' | 'assistant'
    timestamp: Date
    status?: 'sending' | 'sent' | 'error'
    executionAIFlowTaskId?: string
    copyable?: boolean
}

type StoredMessage = Omit<Message, 'timestamp'> & { timestamp: string }

type StoredHistory = Record<string, { history: StoredMessage[], organizationId: string }>

const sessionStorageManager = new LocalStorageManager<Record<string, string>>()
const historyStorageManager = new LocalStorageManager<StoredHistory>()

// --- Session id (per organization) ---

export function getSessionId (orgId: string): string | null {
    const sessions = sessionStorageManager.getItem(AI_SESSION_STORAGE_KEY) || {}
    return sessions[orgId] || null
}

export function setSessionId (orgId: string, sessionId: string): void {
    const sessions = sessionStorageManager.getItem(AI_SESSION_STORAGE_KEY) || {}
    sessions[orgId] = sessionId
    sessionStorageManager.setItem(AI_SESSION_STORAGE_KEY, sessions)
}

// --- Chat history (per session id) ---

export function getChatHistory (sessionId: string): Message[] | null {
    const savedHistory = historyStorageManager.getItem(AI_CHAT_HISTORY_STORAGE_KEY)
    if (!savedHistory) return null

    const sessionData = savedHistory[sessionId]
    if (!sessionData?.history) return null

    return sessionData.history.map((msg) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
    }))
}

export function saveChatHistory (sessionId: string, messages: Message[], orgId: string | undefined): void {
    try {
        const currentHistory = historyStorageManager.getItem(AI_CHAT_HISTORY_STORAGE_KEY) || {}
        const updatedHistory: StoredHistory = {
            ...currentHistory,
            [sessionId]: {
                history: messages.map((msg) => ({
                    ...msg,
                    timestamp: msg.timestamp.toISOString(),
                })),
                organizationId: orgId || '',
            },
        }
        historyStorageManager.setItem(AI_CHAT_HISTORY_STORAGE_KEY, updatedHistory)
    } catch (error) {
        console.error('Failed to save chat history to localStorage:', error)
    }
}

export function deleteChatHistory (sessionId: string): void {
    const savedHistory = historyStorageManager.getItem(AI_CHAT_HISTORY_STORAGE_KEY)
    if (!savedHistory?.[sessionId]) return
    delete savedHistory[sessionId]
    historyStorageManager.setItem(AI_CHAT_HISTORY_STORAGE_KEY, savedHistory)
}

export function hasUserMessage (sessionId: string): boolean {
    const history = getChatHistory(sessionId)
    return Boolean(history?.some((msg) => msg.role === 'user'))
}

// --- Export / share ---

export function exportChatAsText (sessionId: string): string | null {
    const history = getChatHistory(sessionId)
    if (!history || history.length === 0) return null

    const lines: string[] = []
    for (const msg of history) {
        if (!msg.content?.text?.trim()) continue
        const roleLabel = msg.role === 'user' ? 'User' : 'Assistant'
        const text = msg.role === 'assistant'
            ? stripMarkdown(msg.content.text, { collapseLineBreaks: false })
            : msg.content.text
        lines.push(`${roleLabel}: ${text}`, '')
    }

    if (lines.length === 0) return null
    return lines.join('\n').trim()
}
