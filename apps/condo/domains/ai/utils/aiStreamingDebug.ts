// TODO: remove before commit — temporary streaming debug logs
export function logAiStreaming (event: string, data?: Record<string, unknown>): void {
    console.log('[ai-streaming]', event, data ?? '')
}
