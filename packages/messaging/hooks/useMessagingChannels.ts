import { useEffect, useState } from 'react'

interface MessagingChannel {
    name: string
    topic: string
}

interface MessagingChannelsResponse {
    channels: MessagingChannel[]
}

interface UseMessagingChannelsOptions {
    enabled?: boolean
}

export const useMessagingChannels = (options: UseMessagingChannelsOptions = {}) => {
    const { enabled = true } = options
    const [channels, setChannels] = useState<MessagingChannel[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!enabled) {
            setChannels([])
            setLoading(false)
            return
        }

        const fetchChannels = async () => {
            try {
                setLoading(true)
                setError(null)

                const response = await fetch('/messaging/channels')
                if (!response.ok) {
                    throw new Error('Failed to fetch messaging channels')
                }

                const data: MessagingChannelsResponse = await response.json()
                setChannels(data.channels)
            } catch (err) {
                console.error('[messaging] Error fetching channels:', err)
                setError(err instanceof Error ? err.message : 'Unknown error')
                setChannels([])
            } finally {
                setLoading(false)
            }
        }

        fetchChannels()
    }, [enabled])

    return {
        channels,
        loading,
        error,
        hasChannel: (channelName: string) => channels.some(c => c.name === channelName),
    }
}
