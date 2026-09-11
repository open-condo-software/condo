import type { A2uiMessage } from '@a2ui/web_core/v0_9'

const A2UI_BLOCK_REGEX = /<a2ui>([\s\S]*?)<\/a2ui>/g

const A2UI_MESSAGE_KEYS = new Set(['version', 'createSurface', 'updateComponents', 'updateDataModel', 'deleteSurface'])

export interface ParsedA2UIAnswer {
    text: string
    a2uiMessages: A2uiMessage[]
}

export function extractA2UIMessages (answer: string): ParsedA2UIAnswer {
    if (!answer || typeof answer !== 'string') {
        return { text: '', a2uiMessages: [] }
    }

    const messages: A2uiMessage[] = []
    let textWithoutA2UI = answer

    let match: RegExpExecArray | null
    A2UI_BLOCK_REGEX.lastIndex = 0
    while ((match = A2UI_BLOCK_REGEX.exec(answer)) !== null) {
        const jsonlBlock = match[1].trim()
        const normalized = jsonlBlock.replace(/\\n/g, '\n')
        const lines = normalized.split('\n').map(l => l.trim()).filter(Boolean)
        for (const line of lines) {
            try {
                const parsed = JSON.parse(line) as A2uiMessage
                if (parsed && typeof parsed === 'object') {
                    const knownKey = Object.keys(parsed).find(k => A2UI_MESSAGE_KEYS.has(k))
                    if (knownKey && parsed[knownKey] != null) {
                        messages.push(parsed)
                    } else if (knownKey) {
                        console.warn('[A2UI] Dropped message with null payload for key:', knownKey, line)
                    } else {
                        console.warn('[A2UI] Dropped message without known A2UI keys:', line)
                    }
                }
            } catch {
                // Skip invalid JSON lines
            }
        }
    }

    textWithoutA2UI = answer.replace(A2UI_BLOCK_REGEX, '').trim()

    return { text: textWithoutA2UI, a2uiMessages: messages }
}
