import { useEffect, useState } from 'react'

import { useOrganization } from '@open-condo/next/organization'

interface MessagingChannel {
    name: string
    topics: string[]
    description: string
    permission?: string
}

interface MessagingChannelsResponse {
    channels: MessagingChannel[]
    organizationId: string
}

export const useMessagingChannels = () => {
    const { organization } = useOrganization()
    const [channels, setChannels] = useState<MessagingChannel[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!organization?.id) {
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
    }, [organization?.id])

    return {
        channels,
        loading,
        error,
        hasChannel: (channelName: string) => channels.some(c => c.name === channelName),
    }
}
